import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; taskId: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { commentId } = await params
    const body = await request.json()
    const data = updateCommentSchema.parse(body)

    // Check if user owns the comment
    const existingComment = await prisma.taskComment.findUnique({
      where: { id: commentId },
    })

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    if (existingComment.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to edit this comment" }, { status: 403 })
    }

    const comment = await prisma.taskComment.update({
      where: { id: commentId },
      data: { content: data.content },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(comment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Error updating comment:", error)
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; taskId: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { commentId } = await params

    // Check if user owns the comment
    const existingComment = await prisma.taskComment.findUnique({
      where: { id: commentId },
    })

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    if (existingComment.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this comment" }, { status: 403 })
    }

    await prisma.taskComment.delete({
      where: { id: commentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    )
  }
}
