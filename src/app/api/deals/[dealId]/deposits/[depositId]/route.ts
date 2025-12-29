import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateDepositSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  paidDate: z.string().optional().nullable(),
  paidAmount: z.number().optional().nullable(),
  status: z.enum(["SCHEDULED", "DUE", "PAID", "APPLIED_TO_PURCHASE", "REFUNDED", "FORFEITED"]).optional(),
  condition: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; depositId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { depositId } = await params
    const body = await request.json()
    const data = updateDepositSchema.parse(body)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...data }
    if (data.dueDate !== undefined) {
      updateData.dueDate = new Date(data.dueDate)
    }
    if (data.paidDate !== undefined) {
      updateData.paidDate = data.paidDate ? new Date(data.paidDate) : null
    }

    const deposit = await prisma.deposit.update({
      where: { id: depositId },
      data: updateData,
    })

    return NextResponse.json(deposit)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update deposit" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; depositId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { depositId } = await params

    await prisma.deposit.delete({
      where: { id: depositId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete deposit" },
      { status: 500 }
    )
  }
}
