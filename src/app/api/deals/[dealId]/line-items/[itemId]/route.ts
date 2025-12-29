import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateLineItemSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  description: z.string().optional().nullable(),
  estimatedAmount: z.number().optional().nullable(),
  actualAmount: z.number().optional().nullable(),
  vendor: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  paidDate: z.string().optional().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { itemId } = await params
    const body = await request.json()
    const data = updateLineItemSchema.parse(body)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...data }
    if (data.paidDate !== undefined) {
      updateData.paidDate = data.paidDate ? new Date(data.paidDate) : null
    }

    const lineItem = await prisma.financialLineItem.update({
      where: { id: itemId },
      data: updateData,
    })

    return NextResponse.json(lineItem)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update line item" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { itemId } = await params

    await prisma.financialLineItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete line item" },
      { status: 500 }
    )
  }
}
