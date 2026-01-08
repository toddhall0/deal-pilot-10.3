import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { createNotification } from "@/lib/notifications/notificationService"

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "COMPLETED", "CANCELLED"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  milestoneId: z.string().optional(),
  parentId: z.string().optional(),
  taskListId: z.string().optional().nullable(),
  issueId: z.string().optional().nullable(),
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

    const tasks = await prisma.task.findMany({
      where: { dealId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        taskList: {
          select: { id: true, name: true, color: true },
        },
        subtasks: true,
        _count: {
          select: { comments: true, documents: true },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { status: "asc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
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
    const data = createTaskSchema.parse(body)

    // Get deal info for notification
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { dealNumber: true },
    })

    const task = await prisma.task.create({
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        dealId,
        createdById: session.user.id,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Send notification if task is assigned
    if (task.assigneeId && task.assigneeId !== session.user.id) {
      await createNotification({
        type: "TASK_ASSIGNED",
        userId: task.assigneeId,
        title: task.title,
        message: "You have been assigned a new task",
        dealId,
        taskId: task.id,
        actionUrl: `/deals/${dealId}?tab=tasks`,
        metadata: {
          dealNumber: deal?.dealNumber,
          dueDate: task.dueDate?.toLocaleDateString(),
          assignedBy: session.user.name,
        },
      })
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    )
  }
}
