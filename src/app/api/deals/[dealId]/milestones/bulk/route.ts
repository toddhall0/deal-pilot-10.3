import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const bulkMilestoneSchema = z.object({
  milestones: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      date: z.string().min(1, "Date is required"),
      description: z.string().optional(),
      category: z.string().optional(),
    })
  ),
})

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
    const { milestones } = bulkMilestoneSchema.parse(body)

    if (milestones.length === 0) {
      return NextResponse.json(
        { error: "No milestones provided" },
        { status: 400 }
      )
    }

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
      where: { timelineId: timeline.id, parentId: null },
      _max: { sortOrder: true },
    })

    let sortOrder = (maxSortOrder._max.sortOrder || 0) + 1
    const createdMilestones: string[] = []
    const skippedMilestones: string[] = []

    for (const milestone of milestones) {
      // Check if milestone with same name already exists
      const existing = await prisma.milestone.findFirst({
        where: {
          timelineId: timeline.id,
          name: milestone.name,
        },
      })

      if (existing) {
        // Update existing milestone with new date
        await prisma.milestone.update({
          where: { id: existing.id },
          data: {
            dueDate: new Date(milestone.date),
            description: milestone.description || existing.description,
            sourceType: "TRANSACTION_SUMMARY",
          },
        })
        skippedMilestones.push(milestone.name)
      } else {
        // Create new milestone
        const newMilestone = await prisma.milestone.create({
          data: {
            name: milestone.name,
            description: milestone.description || `${milestone.category || "Contract"} milestone`,
            dueDate: new Date(milestone.date),
            timelineId: timeline.id,
            sortOrder: sortOrder++,
            reminderDays: [7, 3, 1],
            sourceType: "TRANSACTION_SUMMARY",
          },
        })
        createdMilestones.push(newMilestone.id)
      }
    }

    return NextResponse.json({
      success: true,
      count: createdMilestones.length + skippedMilestones.length,
      created: createdMilestones.length,
      updated: skippedMilestones.length,
      message: `Created ${createdMilestones.length} new milestones, updated ${skippedMilestones.length} existing`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Error bulk creating milestones:", error)
    return NextResponse.json(
      { error: "Failed to create milestones" },
      { status: 500 }
    )
  }
}
