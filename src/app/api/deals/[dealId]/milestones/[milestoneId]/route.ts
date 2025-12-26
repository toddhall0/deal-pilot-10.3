import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateMilestoneSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "MISSED", "WAIVED", "NOT_APPLICABLE"]).optional(),
  completedDate: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  reminderDays: z.array(z.number()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; milestoneId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { milestoneId } = await params

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        children: {
          orderBy: [
            { dueDate: "asc" },
            { sortOrder: "asc" },
          ],
        },
        parent: true,
        tasks: true,
      },
    })

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 })
    }

    return NextResponse.json(milestone)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch milestone" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; milestoneId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { milestoneId } = await params
    const body = await request.json()
    const data = updateMilestoneSchema.parse(body)

    const updateData: any = { ...data }

    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate)
    }

    if (data.completedDate) {
      updateData.completedDate = new Date(data.completedDate)
    }

    // If marking as completed, set completedDate
    if (data.status === "COMPLETED" && !data.completedDate) {
      updateData.completedDate = new Date()
    }

    // If unmarking completed, clear completedDate
    if (data.status && data.status !== "COMPLETED") {
      updateData.completedDate = null
    }

    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData,
      include: {
        children: true,
      },
    })

    return NextResponse.json(milestone)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update milestone" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; milestoneId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { milestoneId } = await params

    // Delete children first (cascade)
    await prisma.milestone.deleteMany({
      where: { parentId: milestoneId },
    })

    await prisma.milestone.delete({
      where: { id: milestoneId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete milestone" },
      { status: 500 }
    )
  }
}
