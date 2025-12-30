import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")

    // Get recent activity logs
    const activities = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true },
        },
        deal: {
          select: { id: true, dealNumber: true, propertyName: true },
        },
      },
    })

    // Also get recent deals
    const recentDeals = await prisma.deal.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        dealNumber: true,
        propertyName: true,
        status: true,
        updatedAt: true,
        transactionSummary: {
          select: { purchasePrice: true },
        },
      },
    })

    // Get recent documents
    const recentDocuments = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true,
        deal: {
          select: { id: true, dealNumber: true },
        },
        uploadedBy: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({
      activities,
      recentDeals,
      recentDocuments,
    })
  } catch (error) {
    console.error("Error fetching activity:", error)
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    )
  }
}
