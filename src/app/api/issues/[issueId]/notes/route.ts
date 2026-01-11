import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  plainText: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { issueId } = await params

    // Verify issue exists
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true, dealId: true },
    })

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 })
    }

    const notes = await prisma.note.findMany({
      where: { issueId },
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
    console.error("Error fetching issue notes:", error)
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { issueId } = await params
    const body = await request.json()
    const data = createNoteSchema.parse(body)

    // Get issue to get dealId
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true, dealId: true, title: true },
    })

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 })
    }

    const note = await prisma.note.create({
      data: {
        title: data.title,
        content: data.content,
        plainText: data.plainText,
        category: data.category || "ISSUE",
        tags: data.tags || [],
        dealId: issue.dealId,
        issueId: issueId,
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
    console.error("Error creating issue note:", error)
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    )
  }
}
