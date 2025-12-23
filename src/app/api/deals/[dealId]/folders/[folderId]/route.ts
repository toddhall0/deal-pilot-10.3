import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateFolderSchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; folderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { folderId } = await params
    const body = await request.json()
    const data = updateFolderSchema.parse(body)

    const folder = await prisma.documentFolder.update({
      where: { id: folderId },
      data,
    })

    return NextResponse.json(folder)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update folder" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; folderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { folderId } = await params

    // Check if folder has documents
    const folder = await prisma.documentFolder.findUnique({
      where: { id: folderId },
      include: {
        documents: { select: { id: true } },
        children: { select: { id: true } },
      },
    })

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    // Move documents and children to parent (or root) before deleting
    if (folder.documents.length > 0) {
      await prisma.document.updateMany({
        where: { folderId },
        data: { folderId: folder.parentId },
      })
    }

    if (folder.children.length > 0) {
      await prisma.documentFolder.updateMany({
        where: { parentId: folderId },
        data: { parentId: folder.parentId },
      })
    }

    await prisma.documentFolder.delete({
      where: { id: folderId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    )
  }
}
