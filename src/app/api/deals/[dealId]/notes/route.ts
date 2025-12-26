import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

// Helper to extract plain text from HTML
function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

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
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const where: any = { dealId }

    if (category && category !== "ALL") {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { plainText: { contains: search, mode: "insensitive" } },
      ]
    }

    const notes = await prisma.note.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error("Error fetching notes:", error)
    return NextResponse.json(
      { error: "Failed to fetch notes" },
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
    const data = createNoteSchema.parse(body)

    const plainText = htmlToPlainText(data.content)

    const note = await prisma.note.create({
      data: {
        ...data,
        plainText,
        dealId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Error creating note:", error)
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    )
  }
}
