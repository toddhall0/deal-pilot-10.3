import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateFinancialsSchema = z.object({
  contractPrice: z.number().optional().nullable(),
  currentPrice: z.number().optional().nullable(),
  dueDiligenceBudget: z.number().optional().nullable(),
  dueDiligenceSpent: z.number().optional().nullable(),
  estimatedClosingCosts: z.number().optional().nullable(),
  actualClosingCosts: z.number().optional().nullable(),
})

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

    // Get or create financials record
    let financials = await prisma.dealFinancials.findUnique({
      where: { dealId },
      include: {
        deposits: {
          orderBy: { dueDate: "asc" },
        },
        lineItems: {
          orderBy: { category: "asc" },
        },
      },
    })

    if (!financials) {
      // Get transaction summary for purchase price if available
      const summary = await prisma.transactionSummary.findUnique({
        where: { dealId },
        select: { purchasePrice: true },
      })

      financials = await prisma.dealFinancials.create({
        data: {
          dealId,
          contractPrice: summary?.purchasePrice || null,
        },
        include: {
          deposits: true,
          lineItems: true,
        },
      })
    }

    return NextResponse.json(financials)
  } catch (error) {
    console.error("Error fetching financials:", error)
    return NextResponse.json(
      { error: "Failed to fetch financials" },
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
    const data = updateFinancialsSchema.parse(body)

    const financials = await prisma.dealFinancials.upsert({
      where: { dealId },
      create: {
        dealId,
        ...data,
      },
      update: data,
      include: {
        deposits: true,
        lineItems: true,
      },
    })

    return NextResponse.json(financials)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update financials" },
      { status: 500 }
    )
  }
}
