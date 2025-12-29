import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createLineItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional().nullable(),
  estimatedAmount: z.number().optional().nullable(),
  actualAmount: z.number().optional().nullable(),
  vendor: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  paidDate: z.string().optional().nullable(),
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

    // Ensure financials record exists
    let financials = await prisma.dealFinancials.findUnique({
      where: { dealId },
    })

    if (!financials) {
      financials = await prisma.dealFinancials.create({
        data: { dealId },
      })
    }

    const lineItems = await prisma.financialLineItem.findMany({
      where: { financialsId: financials.id },
      orderBy: { category: "asc" },
    })

    return NextResponse.json(lineItems)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch line items" },
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
    const data = createLineItemSchema.parse(body)

    // Ensure financials record exists
    let financials = await prisma.dealFinancials.findUnique({
      where: { dealId },
    })

    if (!financials) {
      financials = await prisma.dealFinancials.create({
        data: { dealId },
      })
    }

    const lineItem = await prisma.financialLineItem.create({
      data: {
        financialsId: financials.id,
        name: data.name,
        category: data.category,
        description: data.description || null,
        estimatedAmount: data.estimatedAmount || null,
        actualAmount: data.actualAmount || null,
        vendor: data.vendor || null,
        invoiceNumber: data.invoiceNumber || null,
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
      },
    })

    return NextResponse.json(lineItem, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create line item" },
      { status: 500 }
    )
  }
}
