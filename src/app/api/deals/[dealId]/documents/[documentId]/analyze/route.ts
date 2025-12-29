import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getFileBuffer } from "@/lib/storage"
import { analyzeContract } from "@/lib/ai/contractAnalysis"
import { ContractAnalysisResult } from "@/types/analysis"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dealId, documentId } = await params

    // Get document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        dealId: dealId,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check file type is supported
    const supportedTypes = ["application/pdf", "text/plain"]
    if (!supportedTypes.includes(document.fileType)) {
      return NextResponse.json(
        { error: "Document type not supported for analysis. Please upload a PDF." },
        { status: 400 }
      )
    }

    // Download file from storage
    const fileBuffer = await getFileBuffer(document.fileKey)

    // Analyze contract with Claude (handles text extraction internally)
    const analysisResult = await analyzeContract(fileBuffer, document.fileType)

    // Update document with analysis
    await prisma.document.update({
      where: { id: documentId },
      data: {
        isAnalyzed: true,
        analysisResult: JSON.parse(JSON.stringify(analysisResult)),
        analyzedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
    })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze document" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dealId, documentId } = await params

    // Get document with analysis
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        dealId: dealId,
      },
      select: {
        id: true,
        name: true,
        isAnalyzed: true,
        analysisResult: true,
        analyzedAt: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    if (!document.isAnalyzed || !document.analysisResult) {
      return NextResponse.json(
        { error: "Document has not been analyzed yet" },
        { status: 404 }
      )
    }

    const analysisResult = document.analysisResult as unknown as ContractAnalysisResult

    return NextResponse.json({
      analysis: analysisResult,
      analyzedAt: document.analyzedAt,
    })
  } catch (error) {
    console.error("Fetch analysis error:", error)
    return NextResponse.json(
      { error: "Failed to fetch analysis" },
      { status: 500 }
    )
  }
}
