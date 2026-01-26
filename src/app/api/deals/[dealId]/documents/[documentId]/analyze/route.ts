import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getFileBuffer, uploadFile } from "@/lib/storage"
import { analyzeContract } from "@/lib/ai/contractAnalysis"
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

    // Get document with deal info
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        dealId: dealId,
      },
      include: {
        deal: {
          select: { name: true },
        },
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

    // Ensure required fields have default values to prevent rendering errors
    const sanitizedResult = {
      ...analysisResult,
      buyer: analysisResult.buyer || { name: "Unknown Buyer" },
      seller: analysisResult.seller || { name: "Unknown Seller" },
      purchasePrice: analysisResult.purchasePrice || 0,
      priceAdjustable: analysisResult.priceAdjustable ?? false,
      deposits: analysisResult.deposits || [],
      contingencies: analysisResult.contingencies || [],
      dueDiligenceItems: analysisResult.dueDiligenceItems || [],
      closingDocuments: analysisResult.closingDocuments || [],
      confidence: analysisResult.confidence || 0.5,
      // Optional arrays that might be accessed
      warnings: analysisResult.warnings || [],
      specialProvisions: analysisResult.specialProvisions || [],
      preFeasibilityChecklist: analysisResult.preFeasibilityChecklist || [],
      preClosingChecklist: analysisResult.preClosingChecklist || [],
      keyMilestones: analysisResult.keyMilestones || [],
      postClosingObligations: analysisResult.postClosingObligations || [],
      missingDateDependencies: analysisResult.missingDateDependencies || [],
      prorationItems: analysisResult.prorationItems || [],
    }

    // Update document with analysis
    await prisma.document.update({
      where: { id: documentId },
      data: {
        isAnalyzed: true,
        analysisResult: JSON.parse(JSON.stringify(sanitizedResult)),
        analyzedAt: new Date(),
      },
    })

    // Generate HTML Transaction Summary and save it as a document
    try {
      const htmlContent = generateAnalysisHtmlReport(
        sanitizedResult,
        document.name,
        document.deal.name,
        dealId,
        documentId
      )

      const htmlBuffer = Buffer.from(htmlContent, "utf-8")
      const reportName = `Transaction Summary - ${document.name.replace(/\.[^/.]+$/, "")}.html`
      const fileKey = `deals/${dealId}/documents/${Date.now()}-${reportName.replace(/\s+/g, "_")}`

      // Upload HTML to storage
      await uploadFile(htmlBuffer, fileKey, "text/html")

      // Get next sort order for proper ordering
      const maxSortOrderResult = await prisma.document.aggregate({
        where: { dealId },
        _max: { sortOrder: true },
      })
      const nextSortOrder = (maxSortOrderResult._max.sortOrder ?? -1) + 1

      // Create document record for the Transaction Summary
      await prisma.document.create({
        data: {
          name: reportName,
          originalName: reportName,
          description: `Transaction Summary generated from analysis of ${document.name}`,
          category: "TRANSACTION_SUMMARY",
          fileKey: fileKey,
          fileUrl: fileKey,
          fileType: "text/html",
          fileSize: htmlBuffer.length,
          dealId: dealId,
          uploadedById: session.user.id,
          isAnalyzed: false,
          sortOrder: nextSortOrder,
        },
      })
    } catch (htmlError) {
      // Log error but don't fail the whole analysis
      console.error("Failed to generate Transaction Summary HTML:", htmlError)
    }

    // Save analysis to deal's Transaction Summary
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type JsonValue = Record<string, any> | any[] | undefined
      function toJson<T>(value: T | null | undefined): JsonValue {
        if (value === null || value === undefined) return undefined
        return JSON.parse(JSON.stringify(value))
      }

      const summaryData = {
        dealId,
        contractDate: sanitizedResult.contractDate ? new Date(sanitizedResult.contractDate) : null,
        effectiveDate: sanitizedResult.effectiveDate ? new Date(sanitizedResult.effectiveDate) : null,
        buyerName: sanitizedResult.buyer?.name || null,
        buyerEntity: sanitizedResult.buyer?.entityType || null,
        buyerAddress: sanitizedResult.buyer?.address || null,
        sellerName: sanitizedResult.seller?.name || null,
        sellerEntity: sanitizedResult.seller?.entityType || null,
        sellerAddress: sanitizedResult.seller?.address || null,
        purchasePrice: sanitizedResult.purchasePrice || null,
        pricePerUnit: sanitizedResult.pricePerAcre || sanitizedResult.pricePerSquareFoot || sanitizedResult.pricePerUnit || null,
        priceAdjustable: sanitizedResult.priceAdjustable || false,
        priceAdjustmentBasis: sanitizedResult.priceAdjustmentBasis || null,
        initialDeposit: sanitizedResult.deposits?.[0]?.amount || null,
        initialDepositDue: sanitizedResult.deposits?.[0]?.dueDate ? new Date(sanitizedResult.deposits[0].dueDate) : null,
        additionalDeposits: toJson(sanitizedResult.deposits?.slice(1)),
        feasibilityPeriodDays: sanitizedResult.feasibilityPeriodDays || null,
        feasibilityExpiration: sanitizedResult.feasibilityExpiration ? new Date(sanitizedResult.feasibilityExpiration) : null,
        closingDate: sanitizedResult.closingDate ? new Date(sanitizedResult.closingDate) : null,
        outsideClosingDate: sanitizedResult.outsideClosingDate ? new Date(sanitizedResult.outsideClosingDate) : null,
        titleCompany: sanitizedResult.titleCompany || null,
        escrowAgent: sanitizedResult.escrowAgent || null,
        contingencies: toJson(sanitizedResult.contingencies),
        dueDiligenceItems: toJson(sanitizedResult.dueDiligenceItems),
        closingDocuments: toJson(sanitizedResult.closingDocuments),
        specialProvisions: toJson(sanitizedResult.specialProvisions),
        prorationItems: toJson(sanitizedResult.prorationItems),
        rawAnalysis: toJson(sanitizedResult),
      }

      await prisma.transactionSummary.upsert({
        where: { dealId },
        create: summaryData,
        update: {
          ...summaryData,
          version: { increment: 1 },
          analyzedAt: new Date(),
        },
      })

      // Also update deal with property info if available
      await prisma.deal.update({
        where: { id: dealId },
        data: {
          propertyAddress: sanitizedResult.propertyAddress || undefined,
          propertyCity: sanitizedResult.propertyCity || undefined,
          propertyState: sanitizedResult.propertyState || undefined,
          propertyCounty: sanitizedResult.propertyCounty || undefined,
          acreage: sanitizedResult.acreage || undefined,
          squareFootage: sanitizedResult.squareFootage || undefined,
          lotCount: sanitizedResult.lotCount || undefined,
          unitCount: sanitizedResult.unitCount || undefined,
        },
      })
    } catch (summaryError) {
      console.error("Failed to save Transaction Summary:", summaryError)
    }

    return NextResponse.json({
      success: true,
      analysis: sanitizedResult,
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

    // Ensure required fields have default values to prevent rendering errors
    const sanitizedResult = {
      ...analysisResult,
      buyer: analysisResult.buyer || { name: "Unknown Buyer" },
      seller: analysisResult.seller || { name: "Unknown Seller" },
      purchasePrice: analysisResult.purchasePrice || 0,
      priceAdjustable: analysisResult.priceAdjustable ?? false,
      deposits: analysisResult.deposits || [],
      contingencies: analysisResult.contingencies || [],
      dueDiligenceItems: analysisResult.dueDiligenceItems || [],
      closingDocuments: analysisResult.closingDocuments || [],
      confidence: analysisResult.confidence || 0.5,
      // Optional arrays that might be accessed
      warnings: analysisResult.warnings || [],
      specialProvisions: analysisResult.specialProvisions || [],
      preFeasibilityChecklist: analysisResult.preFeasibilityChecklist || [],
      preClosingChecklist: analysisResult.preClosingChecklist || [],
      keyMilestones: analysisResult.keyMilestones || [],
      postClosingObligations: analysisResult.postClosingObligations || [],
      missingDateDependencies: analysisResult.missingDateDependencies || [],
      prorationItems: analysisResult.prorationItems || [],
    }

    return NextResponse.json({
      analysis: sanitizedResult,
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
