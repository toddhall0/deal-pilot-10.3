import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateFinancialsSchema = z.object({
  purchasePrice: z.number().optional(),
  earnestMoney: z.number().optional(),
  optionFee: z.number().optional(),
  dueDiligenceFee: z.number().optional(),
  closingCostsBuyer: z.number().optional(),
  closingCostsSeller: z.number().optional(),
  prorationDate: z.string().optional().nullable(),
  prorationMethod: z.enum(["CALENDAR_DAY", "BUSINESS_DAY", "THIRTY_DAY"]).optional(),
  notes: z.string().optional().nullable(),
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
          orderBy: [
            { category: "asc" },
            { sortOrder: "asc" },
          ],
        },
      },
    })

    if (!financials) {
      // Get deal for purchase price
      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        select: { purchasePrice: true },
      })

      financials = await prisma.dealFinancials.create({
        data: {
          dealId,
          purchasePrice: deal?.purchasePrice || null,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...data }
    if (data.prorationDate) {
      updateData.prorationDate = new Date(data.prorationDate)
    }

    const financials = await prisma.dealFinancials.upsert({
      where: { dealId },
      create: {
        dealId,
        ...updateData,
      },
      update: updateData,
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
