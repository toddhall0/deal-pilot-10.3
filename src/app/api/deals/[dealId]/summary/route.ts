import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ContractAnalysisResult } from "@/types/analysis"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = Record<string, any> | any[] | undefined

// Helper to convert arrays/objects to Prisma JSON type
function toJson<T>(value: T | null | undefined): JsonValue {
  if (value === null || value === undefined) return undefined
  return JSON.parse(JSON.stringify(value))
}

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

    const summary = await prisma.transactionSummary.findUnique({
      where: { dealId },
    })

    return NextResponse.json(summary)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transaction summary" },
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
    const body = await request.json()
    const result: ContractAnalysisResult = body.result

    // Transform analysis result to transaction summary
    const summaryData = {
      dealId,

      // Dates
      contractDate: result.contractDate ? new Date(result.contractDate) : null,
      effectiveDate: result.effectiveDate ? new Date(result.effectiveDate) : null,

      // Parties
      buyerName: result.buyer?.name || null,
      buyerEntity: result.buyer?.entityType || null,
      buyerAddress: result.buyer?.address || null,
      sellerName: result.seller?.name || null,
      sellerEntity: result.seller?.entityType || null,
      sellerAddress: result.seller?.address || null,

      // Financial
      purchasePrice: result.purchasePrice || null,
      pricePerUnit: result.pricePerAcre || result.pricePerSquareFoot || result.pricePerUnit || null,
      priceAdjustable: result.priceAdjustable || false,
      priceAdjustmentBasis: result.priceAdjustmentBasis || null,

      // Deposits
      initialDeposit: result.deposits?.[0]?.amount || null,
      initialDepositDue: result.deposits?.[0]?.dueDate ? new Date(result.deposits[0].dueDate) : null,
      additionalDeposits: toJson(result.deposits?.slice(1)),

      // Timeline
      feasibilityPeriodDays: result.feasibilityPeriodDays || null,
      feasibilityExpiration: result.feasibilityExpiration ? new Date(result.feasibilityExpiration) : null,
      closingDate: result.closingDate ? new Date(result.closingDate) : null,
      outsideClosingDate: result.outsideClosingDate ? new Date(result.outsideClosingDate) : null,

      // Title
      titleCompany: result.titleCompany || null,
      escrowAgent: result.escrowAgent || null,

      // JSON fields
      contingencies: toJson(result.contingencies),
      dueDiligenceItems: toJson(result.dueDiligenceItems),
      closingDocuments: toJson(result.closingDocuments),
      specialProvisions: toJson(result.specialProvisions),
      prorationItems: toJson(result.prorationItems),

      // Raw analysis
      rawAnalysis: toJson(result),
    }

    // Upsert transaction summary
    const summary = await prisma.transactionSummary.upsert({
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
        propertyAddress: result.propertyAddress || undefined,
        propertyCity: result.propertyCity || undefined,
        propertyState: result.propertyState || undefined,
        propertyCounty: result.propertyCounty || undefined,
        acreage: result.acreage || undefined,
        squareFootage: result.squareFootage || undefined,
        lotCount: result.lotCount || undefined,
        unitCount: result.unitCount || undefined,
      },
    })

    return NextResponse.json(summary, { status: 201 })
  } catch (error) {
    console.error("Error saving transaction summary:", error)
    return NextResponse.json(
      { error: "Failed to save transaction summary" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    // Allow manual updates to specific fields
    const summary = await prisma.transactionSummary.update({
      where: { dealId },
      data: {
        ...body,
        version: { increment: 1 },
      },
    })

    return NextResponse.json(summary)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update transaction summary" },
      { status: 500 }
    )
  }
}
