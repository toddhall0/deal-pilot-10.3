import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getFileBuffer } from "@/lib/storage"
import { analyzeMultipleDocuments, DocumentInput } from "@/lib/ai/contractAnalysis"
import { extractTextFromBuffer } from "@/lib/ai/pdfExtractor"
import { ContractAnalysisResult } from "@/types/analysis"

interface DocumentRecord {
  id: string
  name: string
  fileKey: string
  fileType: string
  category: string
  isPrimaryContract: boolean
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
    const { documentIds, existingAnalysisId } = body as {
      documentIds: string[]
      existingAnalysisId?: string
    }

    if (!documentIds || documentIds.length < 2) {
      return NextResponse.json(
        { error: "At least 2 documents are required for multi-document analysis" },
        { status: 400 }
      )
    }

    // Get all documents
    const documents: DocumentRecord[] = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        dealId: dealId,
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        fileKey: true,
        fileType: true,
        category: true,
        isPrimaryContract: true,
      },
    })

    if (documents.length !== documentIds.length) {
      return NextResponse.json(
        { error: "Some documents were not found" },
        { status: 404 }
      )
    }

    // Check all documents are supported types
    const supportedTypes = ["application/pdf", "text/plain"]
    const unsupportedDocs = documents.filter(
      (d) => !supportedTypes.includes(d.fileType)
    )
    if (unsupportedDocs.length > 0) {
      return NextResponse.json(
        {
          error: `Unsupported file types: ${unsupportedDocs.map((d) => d.name).join(", ")}. Only PDF and text files are supported.`,
        },
        { status: 400 }
      )
    }

    // Get existing analysis if updating
    let existingAnalysis: ContractAnalysisResult | undefined
    if (existingAnalysisId) {
      const existingDoc = await prisma.document.findUnique({
        where: { id: existingAnalysisId },
        select: { analysisResult: true },
      })
      if (existingDoc?.analysisResult) {
        existingAnalysis = existingDoc.analysisResult as unknown as ContractAnalysisResult
      }
    }

    // Extract text from all documents
    const documentInputs: DocumentInput[] = []
    for (const doc of documents) {
      const fileBuffer = await getFileBuffer(doc.fileKey)
      const text = await extractTextFromBuffer(fileBuffer, doc.fileType)

      if (!text || text.trim().length < 50) {
        return NextResponse.json(
          { error: `Could not extract sufficient text from ${doc.name}` },
          { status: 400 }
        )
      }

      documentInputs.push({
        name: doc.name,
        category: doc.category,
        text: text,
      })
    }

    // Run multi-document analysis
    const analysisResult = await analyzeMultipleDocuments(
      documentInputs,
      existingAnalysis
    )

    // Store analysis on the primary contract or first document
    const primaryDoc =
      documents.find((d) => d.isPrimaryContract) || documents[0]

    await prisma.document.update({
      where: { id: primaryDoc.id },
      data: {
        isAnalyzed: true,
        analysisResult: JSON.parse(JSON.stringify(analysisResult)),
        analyzedAt: new Date(),
      },
    })

    // Mark other documents as part of the analysis (without overwriting their individual analysis)
    const otherDocIds = documents.filter((d) => d.id !== primaryDoc.id).map((d) => d.id)
    if (otherDocIds.length > 0) {
      await prisma.document.updateMany({
        where: { id: { in: otherDocIds } },
        data: {
          isAnalyzed: true,
          analyzedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      primaryDocumentId: primaryDoc.id,
      analyzedDocuments: documents.map((d) => ({ id: d.id, name: d.name })),
    })
  } catch (error) {
    console.error("Multi-document analysis error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to analyze documents",
      },
      { status: 500 }
    )
  }
}
