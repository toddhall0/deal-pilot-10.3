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
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const dealId = searchParams.get("dealId")
    const limit = searchParams.get("limit")

    const where: Record<string, unknown> = {}

    if (status) {
      // Support comma-separated statuses (e.g., "OPEN,IN_PROGRESS")
      const statuses = status.split(",")
      if (statuses.length > 1) {
        where.status = { in: statuses }
      } else {
        where.status = status
      }
    }
    if (priority) {
      // Support comma-separated priorities
      const priorities = priority.split(",")
      if (priorities.length > 1) {
        where.priority = { in: priorities }
      } else {
        where.priority = priority
      }
    }
    if (dealId) {
      where.dealId = dealId
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
        deal: {
          select: { id: true, name: true, dealNumber: true },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [
        { priority: "desc" }, // CRITICAL first
        { createdAt: "desc" },
      ],
      ...(limit ? { take: parseInt(limit, 10) } : {}),
    })

    return NextResponse.json(issues)
  } catch (error) {
    console.error("Failed to fetch issues:", error)
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    )
  }
}
