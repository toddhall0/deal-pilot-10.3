import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createDepositSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().min(0, "Amount must be positive"),
  dueDate: z.string().min(1, "Due date is required"),
  paidDate: z.string().optional().nullable(),
  paidAmount: z.number().optional().nullable(),
  status: z.enum(["SCHEDULED", "DUE", "PAID", "APPLIED_TO_PURCHASE", "REFUNDED", "FORFEITED"]).optional(),
  condition: z.string().optional().nullable(),
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

    // Ensure financials record exists
    let financials = await prisma.dealFinancials.findUnique({
      where: { dealId },
    })

    if (!financials) {
      financials = await prisma.dealFinancials.create({
        data: { dealId },
      })
    }

    const deposits = await prisma.deposit.findMany({
      where: { financialsId: financials.id },
      orderBy: { dueDate: "asc" },
    })

    return NextResponse.json(deposits)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch deposits" },
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
    const data = createDepositSchema.parse(body)

    // Ensure financials record exists
    let financials = await prisma.dealFinancials.findUnique({
      where: { dealId },
    })

    if (!financials) {
      financials = await prisma.dealFinancials.create({
        data: { dealId },
      })
    }

    const deposit = await prisma.deposit.create({
      data: {
        financialsId: financials.id,
        name: data.name,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
        paidAmount: data.paidAmount || null,
        status: data.status || "SCHEDULED",
        condition: data.condition || null,
        notes: data.notes || null,
      },
    })

    return NextResponse.json(deposit, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create deposit" },
      { status: 500 }
    )
  }
}
