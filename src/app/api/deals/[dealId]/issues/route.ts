import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dealId } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")

    const where: Record<string, unknown> = { dealId }

    if (status && status !== "ALL") {
      where.status = status
    }

    if (priority && priority !== "ALL") {
      where.priority = priority
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json(issues)
  } catch (error) {
    console.error("Error fetching issues:", error)
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dealId } = await params
    const body = await request.json()
    const data = createIssueSchema.parse(body)

    const issue = await prisma.issue.create({
      data: {
        ...data,
        dealId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(issue, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Error creating issue:", error)
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    )
  }
}
