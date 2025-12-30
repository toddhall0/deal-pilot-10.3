import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ReportRequest } from "@/types/reports"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: ReportRequest = await request.json()
    const { type, dealId, clientId, startDate, endDate } = body

    let reportData: unknown = null

    switch (type) {
      case "DEAL_SUMMARY":
      case "DEAL_TIMELINE":
      case "DEAL_FINANCIALS":
        if (!dealId) {
          return NextResponse.json(
            { error: "Deal ID is required" },
            { status: 400 }
          )
        }
        reportData = await getDealReportData(dealId)
        break

      case "PIPELINE_SUMMARY":
        reportData = await getPipelineReportData(
          startDate || getDefaultStartDate(),
          endDate || new Date().toISOString()
        )
        break

      case "CLIENT_PORTFOLIO":
        if (!clientId) {
          return NextResponse.json(
            { error: "Client ID is required" },
            { status: 400 }
          )
        }
        reportData = await getClientReportData(clientId)
        break

      case "TASK_LIST":
        if (!dealId) {
          return NextResponse.json(
            { error: "Deal ID is required" },
            { status: 400 }
          )
        }
        reportData = await getTaskReportData(dealId)
        break

      case "MILESTONE_STATUS":
        reportData = await getMilestoneReportData(
          startDate || getDefaultStartDate(),
          endDate || new Date().toISOString()
        )
        break

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        )
    }

    return NextResponse.json({
      type,
      data: reportData,
      generatedAt: new Date().toISOString(),
      generatedBy: session.user.name,
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}

async function getDealReportData(dealId: string) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      client: true,
      transactionSummary: true,
      timeline: {
        include: {
          milestones: {
            orderBy: { dueDate: "asc" },
          },
        },
      },
      financials: {
        include: {
          deposits: true,
          lineItems: true,
        },
      },
      tasks: {
        include: {
          assignedTo: { select: { name: true } },
        },
        orderBy: { dueDate: "asc" },
      },
      documents: {
        select: { id: true, name: true, category: true, createdAt: true },
      },
    },
  })

  if (!deal) {
    throw new Error("Deal not found")
  }

  return {
    deal,
    summary: deal.transactionSummary,
    milestones: deal.timeline?.milestones || [],
    deposits: deal.financials?.deposits || [],
    lineItems: deal.financials?.lineItems || [],
    tasks: deal.tasks,
    documents: deal.documents,
  }
}

async function getPipelineReportData(startDate: string, endDate: string) {
  const deals = await prisma.deal.findMany({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      status: { not: "TERMINATED" },
    },
    include: {
      client: { select: { name: true } },
      transactionSummary: { select: { closingDate: true, purchasePrice: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Calculate summary stats
  const byStatus: Record<string, { count: number; value: number }> = {}
  const byType: Record<string, { count: number; value: number }> = {}

  for (const deal of deals) {
    const value = Number(deal.transactionSummary?.purchasePrice) || 0

    if (!byStatus[deal.status]) {
      byStatus[deal.status] = { count: 0, value: 0 }
    }
    byStatus[deal.status].count++
    byStatus[deal.status].value += value

    if (!byType[deal.type]) {
      byType[deal.type] = { count: 0, value: 0 }
    }
    byType[deal.type].count++
    byType[deal.type].value += value
  }

  let totalValue = 0
  for (const deal of deals) {
    totalValue += Number(deal.transactionSummary?.purchasePrice) || 0
  }

  return {
    deals,
    summary: {
      totalDeals: deals.length,
      totalValue,
      byStatus: Object.entries(byStatus).map(([status, data]) => ({
        status,
        ...data,
      })),
      byType: Object.entries(byType).map(([type, data]) => ({
        type,
        ...data,
      })),
    },
    dateRange: { start: startDate, end: endDate },
  }
}

async function getClientReportData(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      deals: {
        include: {
          transactionSummary: { select: { closingDate: true, purchasePrice: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!client) {
    throw new Error("Client not found")
  }

  let totalValue = 0
  let activeDeals = 0
  for (const deal of client.deals) {
    totalValue += Number(deal.transactionSummary?.purchasePrice) || 0
    if (!["CLOSED", "TERMINATED"].includes(deal.status)) {
      activeDeals++
    }
  }

  return {
    client,
    deals: client.deals,
    summary: {
      totalDeals: client.deals.length,
      totalValue,
      activeDeals,
    },
  }
}

async function getTaskReportData(dealId: string) {
  const tasks = await prisma.task.findMany({
    where: { dealId },
    include: {
      assignedTo: { select: { name: true } },
      deal: { select: { dealNumber: true } },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  })

  return { tasks }
}

async function getMilestoneReportData(startDate: string, endDate: string) {
  const milestones = await prisma.milestone.findMany({
    where: {
      dueDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      timeline: {
        include: {
          deal: { select: { dealNumber: true, propertyName: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  })

  let completed = 0
  let pending = 0
  let overdue = 0
  const now = new Date()

  for (const milestone of milestones) {
    if (milestone.status === "COMPLETED") {
      completed++
    } else if (milestone.status === "PENDING") {
      pending++
    }
    if (milestone.status !== "COMPLETED" && new Date(milestone.dueDate) < now) {
      overdue++
    }
  }

  return {
    milestones,
    dateRange: { start: startDate, end: endDate },
    summary: {
      total: milestones.length,
      completed,
      pending,
      overdue,
    },
  }
}

function getDefaultStartDate(): string {
  const date = new Date()
  date.setMonth(date.getMonth() - 3)
  return date.toISOString()
}
