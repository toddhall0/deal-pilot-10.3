import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadFile } from "@/lib/storage"
import { generateAnalysisHtmlReport } from "@/lib/ai/analysisHtmlReport"
import { ContractAnalysisResult } from "@/types/analysis"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dealId, documentId } = await params

    // Get the document with its analysis
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        dealId: dealId,
      },
      include: {
        deal: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    if (!document.isAnalyzed || !document.analysisResult) {
      return NextResponse.json(
        { error: "Document has not been analyzed yet" },
        { status: 400 }
      )
    }

    const analysis = document.analysisResult as unknown as ContractAnalysisResult

    // Generate HTML report
    const htmlContent = generateAnalysisHtmlReport(
      analysis,
      document.name,
      document.deal.name
    )

    // Convert to buffer
    const htmlBuffer = Buffer.from(htmlContent, "utf-8")

    // Generate filename
    const reportName = `Analysis Report - ${document.name.replace(/\.[^/.]+$/, "")}.html`
    const fileKey = `deals/${dealId}/documents/${Date.now()}-${reportName.replace(/\s+/g, "_")}`

    // Upload to storage
    await uploadFile(htmlBuffer, fileKey, "text/html")

    // Create document record
    const newDocument = await prisma.document.create({
      data: {
        name: reportName,
        originalName: reportName,
        description: `Analysis report generated from ${document.name}`,
        category: "OTHER",
        fileKey: fileKey,
        fileType: "text/html",
        fileSize: htmlBuffer.length,
        dealId: dealId,
        uploadedById: session.user.id,
        isAnalyzed: false,
      },
    })

    return NextResponse.json({
      success: true,
      documentId: newDocument.id,
      message: "Analysis report saved to documents",
    })
  } catch (error) {
    console.error("Error exporting HTML:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export HTML" },
      { status: 500 }
    )
  }
}
