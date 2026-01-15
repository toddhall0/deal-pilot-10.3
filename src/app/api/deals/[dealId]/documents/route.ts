import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadFile, generateFileKey, validateFile, getSignedDownloadUrl } from "@/lib/storage"
import { notifyDealTeam } from "@/lib/notifications/notificationService"

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
    const folderId = searchParams.get("folderId")

    const where: any = { dealId }
    if (category) where.category = category
    if (folderId) where.folderId = folderId

    const documents = await prisma.document.findMany({
      where,
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
        folder: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    })

    // Generate signed URLs for each document
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc: typeof documents[number]) => ({
        ...doc,
        downloadUrl: await getSignedDownloadUrl(doc.fileKey),
      }))
    )

    return NextResponse.json(documentsWithUrls)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
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
    const formData = await request.formData()
    const file = formData.get("file") as File
    const category = (formData.get("category") as string) || "OTHER"
    const description = formData.get("description") as string
    const folderId = formData.get("folderId") as string | null
    const issueId = formData.get("issueId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file
    const validation = validateFile({ type: file.type, size: file.size })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique file key
    const fileKey = generateFileKey(dealId, category, file.name)

    // Upload to S3
    await uploadFile(buffer, fileKey, file.type)

    // Get deal info for notification and max sortOrder for new document
    const [deal, maxSortOrderResult] = await Promise.all([
      prisma.deal.findUnique({
        where: { id: dealId },
        select: { dealNumber: true },
      }),
      prisma.document.aggregate({
        where: { dealId },
        _max: { sortOrder: true },
      }),
    ])

    // New documents go at the end of the list
    const nextSortOrder = (maxSortOrderResult._max.sortOrder ?? -1) + 1

    // Create database record
    const document = await prisma.document.create({
      data: {
        dealId,
        name: file.name,
        originalName: file.name,
        description,
        category: category as any,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: fileKey, // We store the key, generate signed URL on fetch
        fileKey,
        uploadedById: session.user.id,
        folderId: folderId || null,
        issueId: issueId || null,
        sortOrder: nextSortOrder,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
    })

    // Notify deal team about new document
    await notifyDealTeam(dealId, {
      type: "DOCUMENT_UPLOADED",
      title: "New Document Uploaded",
      message: `${document.name} has been uploaded`,
      documentId: document.id,
      actionUrl: `/deals/${dealId}?tab=documents`,
      metadata: {
        dealNumber: deal?.dealNumber,
        documentName: document.name,
        uploadedBy: session.user.name,
      },
    })

    // Generate download URL
    const downloadUrl = await getSignedDownloadUrl(fileKey)

    return NextResponse.json(
      { ...document, downloadUrl },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error uploading document:", error)

    // Provide more specific error messages
    let errorMessage = "Failed to upload document"
    if (error instanceof Error) {
      const msg = error.message.toLowerCase()
      if (msg.includes("credentials") || msg.includes("accessdenied") || msg.includes("invalidaccesskeyid")) {
        errorMessage = "Storage service credentials are invalid or missing"
      } else if (msg.includes("nosuchbucket")) {
        errorMessage = "Storage bucket not found - check S3_BUCKET_NAME configuration"
      } else if (msg.includes("networkingerror") || msg.includes("enotfound") || msg.includes("econnrefused")) {
        errorMessage = "Unable to connect to storage service - check S3_ENDPOINT configuration"
      } else if (msg.includes("timeout")) {
        errorMessage = "Storage service request timed out"
      } else {
        errorMessage = `Storage error: ${error.message}`
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
