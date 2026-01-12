import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSignedDownloadUrl } from "@/lib/storage"

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

    const documents = await prisma.document.findMany({
      where: { issueId },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Generate signed URLs for each document
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const downloadUrl = await getSignedDownloadUrl(doc.fileKey)
        return {
          id: doc.id,
          name: doc.name,
          originalName: doc.originalName,
          category: doc.category,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          downloadUrl,
          uploadedBy: doc.uploadedBy,
          createdAt: doc.createdAt.toISOString(),
        }
      })
    )

    return NextResponse.json(documentsWithUrls)
  } catch (error) {
    console.error("Error fetching issue documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}
