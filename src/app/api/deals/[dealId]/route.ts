import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { notifyDealTeam } from "@/lib/notifications/notificationService"

const updateDealSchema = z.object({
  name: z.string().optional(),
  status: z.enum([
    "DRAFT",
    "ACTIVE",
    "UNDER_CONTRACT",
    "IN_DUE_DILIGENCE",
    "PENDING_CLOSING",
    "CLOSED",
    "TERMINATED",
    "ON_HOLD",
  ]).optional(),
  isArchived: z.boolean().optional(),
  propertyName: z.string().optional(),
  propertyAddress: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyState: z.string().optional(),
  propertyZip: z.string().optional(),
  propertyCounty: z.string().optional(),
  propertyType: z.enum([
    "OFFICE",
    "RETAIL",
    "INDUSTRIAL",
    "MULTIFAMILY",
    "MIXED_USE",
    "LAND",
    "HOSPITALITY",
    "HEALTHCARE",
    "SELF_STORAGE",
    "DATA_CENTER",
    "OTHER",
  ]).optional(),
  acreage: z.number().optional(),
  squareFootage: z.number().optional(),
  lotCount: z.number().optional(),
  unitCount: z.number().optional(),
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

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        client: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        transactionSummary: true,
        timeline: {
          include: {
            milestones: {
              orderBy: { dueDate: "asc" },
            },
          },
        },
      },
    })

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    return NextResponse.json(deal)
  } catch (error) {
    console.error("Error fetching deal:", error)
    return NextResponse.json(
      { error: "Failed to fetch deal" },
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
    const data = updateDealSchema.parse(body)

    // Get current deal for status comparison
    const currentDeal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { status: true, dealNumber: true, propertyName: true },
    })

    if (!currentDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    // Build update data, excluding isArchived from spread to handle separately
    const { isArchived, ...restData } = data

    // Handle archive timestamp - only include if explicitly set
    const archiveData = isArchived !== undefined
      ? {
          isArchived: isArchived,
          archivedAt: isArchived ? new Date() : null,
        }
      : {}

    let updatedDeal
    try {
      updatedDeal = await prisma.deal.update({
        where: { id: dealId },
        data: {
          ...restData,
          ...archiveData,
          acreage: restData.acreage !== undefined ? restData.acreage : undefined,
          squareFootage: restData.squareFootage !== undefined ? restData.squareFootage : undefined,
        },
        include: {
          client: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      })
    } catch (updateError) {
      // If archive columns don't exist yet, retry without them
      if (isArchived !== undefined) {
        console.warn("Archive columns may not exist yet, retrying without them")
        updatedDeal = await prisma.deal.update({
          where: { id: dealId },
          data: {
            ...restData,
            acreage: restData.acreage !== undefined ? restData.acreage : undefined,
            squareFootage: restData.squareFootage !== undefined ? restData.squareFootage : undefined,
          },
          include: {
            client: true,
            createdBy: {
              select: { id: true, name: true, email: true },
            },
          },
        })
      } else {
        throw updateError
      }
    }

    // Send notification if status changed
    if (data.status && data.status !== currentDeal.status) {
      await notifyDealTeam(dealId, {
        type: "DEAL_STATUS_CHANGED",
        title: "Deal Status Updated",
        message: `Status changed from ${currentDeal.status.replace(/_/g, " ")} to ${data.status.replace(/_/g, " ")}`,
        actionUrl: `/deals/${dealId}`,
        metadata: {
          dealNumber: currentDeal.dealNumber,
          propertyName: currentDeal.propertyName,
          previousStatus: currentDeal.status.replace(/_/g, " "),
          newStatus: data.status.replace(/_/g, " "),
        },
      })
    }

    return NextResponse.json(updatedDeal)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Error updating deal:", error)
    return NextResponse.json(
      { error: "Failed to update deal" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dealId } = await params

    await prisma.deal.delete({
      where: { id: dealId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting deal:", error)
    return NextResponse.json(
      { error: "Failed to delete deal" },
      { status: 500 }
    )
  }
}
