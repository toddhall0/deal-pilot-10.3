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
    const sortBy = searchParams.get("sortBy") || "dueDate"
    const sortOrder = searchParams.get("sortOrder") || "asc"
    const limit = searchParams.get("limit")

    const where: Record<string, unknown> = {}

    if (status) {
      // Support comma-separated statuses (e.g., "TODO,IN_PROGRESS")
      const statuses = status.split(",")
      if (statuses.length > 1) {
        where.status = { in: statuses }
      } else {
        where.status = status
      }
    }
    if (priority) {
      where.priority = priority
    }
    if (dealId) {
      where.dealId = dealId
    }

    // Build orderBy - for dueDate, put nulls first so tasks without due dates still appear
    const orderBy: Array<Record<string, unknown>> = []

    if (sortBy === "dueDate") {
      // Sort by dueDate with nulls first (urgent/unscheduled tasks), then by createdAt
      orderBy.push(
        { dueDate: { sort: sortOrder, nulls: "first" } },
        { createdAt: "desc" }
      )
    } else {
      orderBy.push({ [sortBy]: sortOrder })
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        deal: {
          select: { id: true, name: true, dealNumber: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { comments: true, documents: true },
        },
      },
      orderBy,
      ...(limit ? { take: parseInt(limit, 10) } : {}),
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Failed to fetch tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}
