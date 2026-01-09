import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ContractAnalysisResult } from "@/types/analysis"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dealId, documentId } = await params
    const body = await request.json()

    if (!body.analysis) {
      return NextResponse.json(
        { error: "Analysis data is required" },
        { status: 400 }
      )
    }

    // Verify document exists and belongs to deal
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        dealId: dealId,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Update the analysis result
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        analysisResult: JSON.parse(JSON.stringify(body.analysis as ContractAnalysisResult)),
        analyzedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Analysis updated successfully",
    })
  } catch (error) {
    console.error("Error updating analysis:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update analysis" },
      { status: 500 }
    )
  }
}
