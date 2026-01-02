import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateTaskListSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  isCollapsed: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; taskListId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskListId } = await params

    const taskList = await prisma.taskList.findUnique({
      where: { id: taskListId },
      include: {
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
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
    })

    if (!taskList) {
      return NextResponse.json({ error: "Task list not found" }, { status: 404 })
    }

    return NextResponse.json(taskList)
  } catch (error) {
    console.error("Failed to fetch task list:", error)
    return NextResponse.json(
      { error: "Failed to fetch task list" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; taskListId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskListId } = await params
    const body = await request.json()
    const data = updateTaskListSchema.parse(body)

    const taskList = await prisma.taskList.update({
      where: { id: taskListId },
      data,
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    })

    return NextResponse.json(taskList)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Failed to update task list:", error)
    return NextResponse.json(
      { error: "Failed to update task list" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; taskListId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskListId } = await params

    // Tasks will have their taskListId set to null due to onDelete: SetNull
    await prisma.taskList.delete({
      where: { id: taskListId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete task list:", error)
    return NextResponse.json(
      { error: "Failed to delete task list" },
      { status: 500 }
    )
  }
}
