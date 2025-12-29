import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createMilestoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  parentId: z.string().optional().nullable(),
  reminderDays: z.array(z.number()).optional(),
  sourceType: z.string().optional(),
  sourceReference: z.string().optional(),
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

    // Get or create timeline for this deal
    let timeline = await prisma.timeline.findUnique({
      where: { dealId },
      include: {
        milestones: {
          orderBy: [
            { dueDate: "asc" },
            { sortOrder: "asc" },
          ],
          include: {
            children: {
              orderBy: [
                { dueDate: "asc" },
                { sortOrder: "asc" },
              ],
            },
          },
        },
      },
    })

    if (!timeline) {
      timeline = await prisma.timeline.create({
        data: { dealId },
        include: {
          milestones: {
            include: {
              children: true,
            },
          },
        },
      })
    }

    // Build hierarchical structure (only top-level milestones with nested children)
    const topLevelMilestones = timeline.milestones.filter((m: typeof timeline.milestones[number]) => !m.parentId)

    return NextResponse.json({
      id: timeline.id,
      dealId: timeline.dealId,
      milestones: topLevelMilestones,
    })
  } catch (error) {
    console.error("Error fetching milestones:", error)
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
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
    const data = createMilestoneSchema.parse(body)

    // Get or create timeline
    let timeline = await prisma.timeline.findUnique({
      where: { dealId },
    })

    if (!timeline) {
      timeline = await prisma.timeline.create({
        data: { dealId },
      })
    }

    // Get max sort order
    const maxSortOrder = await prisma.milestone.aggregate({
      where: { timelineId: timeline.id, parentId: data.parentId || null },
      _max: { sortOrder: true },
    })

    const milestone = await prisma.milestone.create({
      data: {
        name: data.name,
        description: data.description,
        dueDate: new Date(data.dueDate),
        parentId: data.parentId || null,
        timelineId: timeline.id,
        reminderDays: data.reminderDays || [7, 3, 1],
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
        sourceType: data.sourceType,
        sourceReference: data.sourceReference,
      },
      include: {
        children: true,
      },
    })

    return NextResponse.json(milestone, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Error creating milestone:", error)
    return NextResponse.json(
      { error: "Failed to create milestone" },
      { status: 500 }
    )
  }
}
