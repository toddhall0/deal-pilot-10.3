import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { analyzeContract, validateAnalysisResult } from "@/lib/ai/contractAnalysis"
import { getSignedDownloadUrl } from "@/lib/storage"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await params // Await params for Next.js 16

    const body = await request.json()
    const { documentId } = body

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      )
    }

    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check if it's a supported file type
    if (
      document.fileType !== "application/pdf" &&
      document.fileType !== "text/plain"
    ) {
      return NextResponse.json(
        { error: "Only PDF and text files are supported for analysis" },
        { status: 400 }
      )
    }

    // Get signed URL and fetch document content
    const signedUrl = await getSignedDownloadUrl(document.fileKey)
    const response = await fetch(signedUrl)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Analyze the contract
    const result = await analyzeContract(buffer, document.fileType)

    // Validate result
    const validation = validateAnalysisResult(result)
    if (!validation.valid) {
      result.warnings = [...(result.warnings || []), ...validation.errors]
    }

    // Mark document as analyzed
    await prisma.document.update({
      where: { id: documentId },
      data: { isAnalyzed: true },
    })

    return NextResponse.json({
      success: true,
      result,
      validation,
    })
  } catch (error) {
    console.error("Contract analysis error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze contract",
      },
      { status: 500 }
    )
  }
}
