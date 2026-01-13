import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createTaskListSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
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

    const taskLists = await prisma.taskList.findMany({
      where: { dealId },
      include: {
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
            issue: {
              select: { id: true, title: true, status: true, priority: true },
            },
            _count: {
              select: { comments: true, documents: true },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    })

    // Also get tasks that are not in any list (uncategorized)
    const uncategorizedTasks = await prisma.task.findMany({
      where: {
        dealId,
        taskListId: null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        issue: {
          select: { id: true, title: true, status: true, priority: true },
        },
        _count: {
          select: { comments: true, documents: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    })

    // Get all tasks with issues for the issue-grouped section
    const tasksWithIssues = await prisma.task.findMany({
      where: {
        dealId,
        issueId: { not: null },
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        issue: {
          select: { id: true, title: true, status: true, priority: true },
        },
        _count: {
          select: { comments: true, documents: true },
        },
      },
      orderBy: [
        { issue: { priority: "desc" } },
        { sortOrder: "asc" },
      ],
    })

    // Group tasks by issue
    const issueTasksMap = new Map<string, { issue: { id: string; title: string; status: string; priority: string }; tasks: typeof tasksWithIssues }>()
    for (const task of tasksWithIssues) {
      if (task.issue) {
        const existing = issueTasksMap.get(task.issue.id)
        if (existing) {
          existing.tasks.push(task)
        } else {
          issueTasksMap.set(task.issue.id, {
            issue: task.issue,
            tasks: [task],
          })
        }
      }
    }
    const issueTasks = Array.from(issueTasksMap.values())

    return NextResponse.json({
      taskLists,
      uncategorizedTasks,
      issueTasks,
    })
  } catch (error) {
    console.error("Failed to fetch task lists:", error)
    return NextResponse.json(
      { error: "Failed to fetch task lists" },
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
    const data = createTaskListSchema.parse(body)

    // Get the highest sort order
    const lastList = await prisma.taskList.findFirst({
      where: { dealId },
      orderBy: { sortOrder: "desc" },
    })

    const taskList = await prisma.taskList.create({
      data: {
        dealId,
        name: data.name,
        description: data.description,
        color: data.color,
        sortOrder: (lastList?.sortOrder ?? -1) + 1,
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    })

    return NextResponse.json(taskList, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Error creating task list:", error)
    return NextResponse.json(
      { error: "Failed to create task list" },
      { status: 500 }
    )
  }
}
