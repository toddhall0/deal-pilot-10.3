import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteFile, getSignedDownloadUrl } from "@/lib/storage"
import { z } from "zod"

const updateDocumentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.enum([
    // New categories
    "PSA_AMENDMENTS", "DUE_DILIGENCE", "TITLE_SURVEY", "CLOSING_DRAFT", "CLOSING_FINAL", "ENTITY",
    // Old categories (kept for backward compatibility)
    "CONTRACT", "AMENDMENT", "TITLE", "SURVEY", "ENVIRONMENTAL", "FINANCIAL", "LEGAL", "CORRESPONDENCE", "CLOSING",
    "OTHER"
  ]).optional(),
  folderId: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  isPrimaryContract: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { documentId } = await params

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
        folder: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const downloadUrl = await getSignedDownloadUrl(document.fileKey)

    return NextResponse.json({ ...document, downloadUrl })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dealId, documentId } = await params
    const body = await request.json()
    const data = updateDocumentSchema.parse(body)

    // If setting as primary contract, unset any existing primary
    if (data.isPrimaryContract) {
      await prisma.document.updateMany({
        where: { dealId, isPrimaryContract: true },
        data: { isPrimaryContract: false },
      })
    }

    const document = await prisma.document.update({
      where: { id: documentId },
      data,
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { documentId } = await params

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete from S3
    try {
      await deleteFile(document.fileKey)
    } catch (e) {
      console.error("Failed to delete file from S3:", e)
      // Continue with database deletion even if S3 fails
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    )
  }
}
