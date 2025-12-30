import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const type = searchParams.get("type")

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    if (type && type !== "ALL") {
      where.type = type
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        deals: {
          select: {
            id: true,
            dealNumber: true,
            status: true,
          },
        },
        _count: {
          select: { deals: true },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = createClientSchema.parse(body)

    // Get user's firm or default firm
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firmId: true },
    })

    let firmId = user?.firmId
    if (!firmId) {
      // Fallback to first available firm
      const firm = await prisma.firm.findFirst()
      if (!firm) {
        return NextResponse.json(
          { error: "No firm found. Please run the seed script." },
          { status: 400 }
        )
      }
      firmId = firm.id
    }

    const client = await prisma.client.create({
      data: {
        ...data,
        firmId,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Error creating client:", error)
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    )
  }
}
