import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ContractAnalysisResult, KeyMilestone } from "@/types/analysis"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dealId, documentId } = await params

    // Get the document with its analysis
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        dealId: dealId,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    if (!document.isAnalyzed || !document.analysisResult) {
      return NextResponse.json(
        { error: "Document has not been analyzed yet" },
        { status: 400 }
      )
    }

    const analysis = document.analysisResult as unknown as ContractAnalysisResult

    if (!analysis.keyMilestones || analysis.keyMilestones.length === 0) {
      return NextResponse.json(
        { error: "No milestones found in analysis" },
        { status: 400 }
      )
    }

    // Get or create timeline for this deal
    let timeline = await prisma.timeline.findUnique({
      where: { dealId },
    })

    if (!timeline) {
      timeline = await prisma.timeline.create({
        data: { dealId },
      })
    }

    // Get current max sort order
    const maxSortOrder = await prisma.milestone.aggregate({
      where: { timelineId: timeline.id, parentId: null },
      _max: { sortOrder: true },
    })

    let sortOrder = (maxSortOrder._max.sortOrder || 0) + 1
    const createdMilestones: string[] = []

    // Create milestones that have dates
    for (const milestone of analysis.keyMilestones) {
      // Skip milestones without dates
      if (!milestone.date) continue

      // Check if milestone with same name already exists
      const existing = await prisma.milestone.findFirst({
        where: {
          timelineId: timeline.id,
          name: milestone.name,
        },
      })

      if (existing) {
        // Update existing milestone
        await prisma.milestone.update({
          where: { id: existing.id },
          data: {
            dueDate: new Date(milestone.date),
            description: milestone.description || existing.description,
            sourceType: "ANALYSIS",
            sourceReference: documentId,
          },
        })
        createdMilestones.push(existing.id)
      } else {
        // Create new milestone
        const newMilestone = await prisma.milestone.create({
          data: {
            name: milestone.name,
            description: milestone.description || `${milestone.category} milestone from contract analysis`,
            dueDate: new Date(milestone.date),
            timelineId: timeline.id,
            sortOrder: sortOrder++,
            reminderDays: [7, 3, 1],
            sourceType: "ANALYSIS",
            sourceReference: documentId,
          },
        })
        createdMilestones.push(newMilestone.id)
      }
    }

    // Also add key dates from the analysis as milestones if they exist
    const additionalMilestones: Array<{ name: string; date: string; category: string }> = []

    if (analysis.effectiveDate) {
      additionalMilestones.push({
        name: "Contract Effective Date",
        date: analysis.effectiveDate,
        category: "CONTRACT",
      })
    }

    if (analysis.feasibilityExpiration) {
      additionalMilestones.push({
        name: "Feasibility Period Expiration",
        date: analysis.feasibilityExpiration,
        category: "FEASIBILITY",
      })
    }

    if (analysis.closingDate) {
      additionalMilestones.push({
        name: "Closing Date",
        date: analysis.closingDate,
        category: "CLOSING",
      })
    }

    if (analysis.outsideClosingDate) {
      additionalMilestones.push({
        name: "Outside Closing Date",
        date: analysis.outsideClosingDate,
        category: "CLOSING",
      })
    }

    if (analysis.titleCommitmentDate) {
      additionalMilestones.push({
        name: "Title Commitment Due",
        date: analysis.titleCommitmentDate,
        category: "TITLE",
      })
    }

    if (analysis.surveyDate) {
      additionalMilestones.push({
        name: "Survey Due",
        date: analysis.surveyDate,
        category: "SURVEY",
      })
    }

    // Add deposits as milestones
    for (const deposit of analysis.deposits) {
      if (deposit.dueDate) {
        additionalMilestones.push({
          name: `${deposit.name} Due`,
          date: deposit.dueDate,
          category: "FINANCIAL",
        })
      }
    }

    // Create additional milestones
    for (const milestone of additionalMilestones) {
      const existing = await prisma.milestone.findFirst({
        where: {
          timelineId: timeline.id,
          name: milestone.name,
        },
      })

      if (!existing) {
        const newMilestone = await prisma.milestone.create({
          data: {
            name: milestone.name,
            description: `${milestone.category} milestone from contract analysis`,
            dueDate: new Date(milestone.date),
            timelineId: timeline.id,
            sortOrder: sortOrder++,
            reminderDays: [7, 3, 1],
            sourceType: "ANALYSIS",
            sourceReference: documentId,
          },
        })
        createdMilestones.push(newMilestone.id)
      }
    }

    return NextResponse.json({
      success: true,
      count: createdMilestones.length,
      milestoneIds: createdMilestones,
      message: `Successfully imported ${createdMilestones.length} milestones`,
    })
  } catch (error) {
    console.error("Error importing milestones:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import milestones" },
      { status: 500 }
    )
  }
}
