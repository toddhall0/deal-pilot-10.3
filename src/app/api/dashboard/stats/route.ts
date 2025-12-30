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

    // Get deal counts by status
    const dealsByStatus = await prisma.deal.groupBy({
      by: ["status"],
      _count: { id: true },
    })

    // Get deal counts by type
    const dealsByType = await prisma.deal.groupBy({
      by: ["type"],
      _count: { id: true },
    })

    // Get total deals count
    const totalDeals = await prisma.deal.count({
      where: {
        status: { not: "CANCELLED" },
      },
    })

    // Get total value from transaction summaries
    const summaries = await prisma.transactionSummary.findMany({
      select: { purchasePrice: true },
    })
    const totalValue = summaries.reduce(
      (sum: number, s: { purchasePrice: unknown }) => sum + Number(s.purchasePrice || 0),
      0
    )

    // Get deals by month (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const recentDeals = await prisma.deal.findMany({
      where: {
        createdAt: { gte: twelveMonthsAgo },
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
        transactionSummary: {
          select: { purchasePrice: true },
        },
      },
    })

    // Group deals by month
    const dealsByMonth: Record<string, { count: number; value: number }> = {}
    recentDeals.forEach((deal: typeof recentDeals[number]) => {
      const monthKey = deal.createdAt.toISOString().slice(0, 7) // YYYY-MM
      if (!dealsByMonth[monthKey]) {
        dealsByMonth[monthKey] = { count: 0, value: 0 }
      }
      dealsByMonth[monthKey].count++
      dealsByMonth[monthKey].value += Number(deal.transactionSummary?.purchasePrice || 0)
    })

    // Get upcoming milestones (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const upcomingMilestones = await prisma.milestone.findMany({
      where: {
        dueDate: {
          gte: new Date(),
          lte: nextWeek,
        },
        status: { notIn: ["COMPLETED", "WAIVED", "NOT_APPLICABLE"] },
      },
      include: {
        timeline: {
          include: {
            deal: {
              select: { id: true, dealNumber: true, propertyName: true },
            },
          },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    })

    // Get overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        dueDate: { lt: new Date() },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    })

    // Get pending tasks
    const pendingTasks = await prisma.task.count({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
    })

    return NextResponse.json({
      dealsByStatus: dealsByStatus.map((d: typeof dealsByStatus[number]) => ({
        status: d.status,
        count: d._count.id,
      })),
      dealsByType: dealsByType.map((d: typeof dealsByType[number]) => ({
        type: d.type,
        count: d._count.id,
      })),
      totalDeals,
      totalValue,
      dealsByMonth: Object.entries(dealsByMonth)
        .map(([month, data]) => ({
          month,
          ...data,
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      upcomingMilestones,
      overdueTasks,
      pendingTasks,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    )
  }
}
