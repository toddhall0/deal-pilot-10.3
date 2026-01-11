import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  plainText: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string; noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { issueId, noteId } = await params
    const body = await request.json()
    const data = updateNoteSchema.parse(body)

    // Verify note belongs to issue
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        issueId: issueId,
      },
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.plainText !== undefined && { plainText: data.plainText }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(updatedNote)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Error updating note:", error)
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string; noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { issueId, noteId } = await params

    // Verify note belongs to issue
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        issueId: issueId,
      },
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    await prisma.note.delete({
      where: { id: noteId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting note:", error)
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    )
  }
}
