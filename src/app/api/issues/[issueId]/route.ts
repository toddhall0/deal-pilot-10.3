import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateIssueSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { issueId } = await params

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        deal: {
          select: { id: true, name: true, dealNumber: true },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { tasks: true },
        },
      },
    })

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 })
    }

    return NextResponse.json(issue)
  } catch (error) {
    console.error("Error fetching issue:", error)
    return NextResponse.json(
      { error: "Failed to fetch issue" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { issueId } = await params
    const body = await request.json()
    const data = updateIssueSchema.parse(body)

    // If resolving the issue, set resolvedAt
    const updateData: Record<string, unknown> = { ...data }
    if (data.status === "RESOLVED" || data.status === "CLOSED") {
      updateData.resolvedAt = new Date()
    } else if (data.status === "OPEN" || data.status === "IN_PROGRESS") {
      updateData.resolvedAt = null
    }

    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: updateData,
      include: {
        deal: {
          select: { id: true, name: true, dealNumber: true },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { tasks: true },
        },
      },
    })

    return NextResponse.json(issue)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Error updating issue:", error)
    return NextResponse.json(
      { error: "Failed to update issue" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { issueId } = await params

    await prisma.issue.delete({
      where: { id: issueId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting issue:", error)
    return NextResponse.json(
      { error: "Failed to delete issue" },
      { status: 500 }
    )
  }
}
