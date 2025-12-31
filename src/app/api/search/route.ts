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
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = query.toLowerCase()

    // Search deals
    const deals = await prisma.deal.findMany({
      where: {
        OR: [
          { dealNumber: { contains: searchTerm, mode: "insensitive" } },
          { name: { contains: searchTerm, mode: "insensitive" } },
          { propertyName: { contains: searchTerm, mode: "insensitive" } },
          { propertyAddress: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        dealNumber: true,
        name: true,
        propertyName: true,
        propertyAddress: true,
      },
      take: 5,
    })

    // Search clients
    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
      take: 5,
    })

    // Search documents
    const documents = await prisma.document.findMany({
      where: {
        name: { contains: searchTerm, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        category: true,
        deal: { select: { id: true, dealNumber: true } },
      },
      take: 5,
    })

    // Search tasks
    const tasks = await prisma.task.findMany({
      where: {
        title: { contains: searchTerm, mode: "insensitive" },
      },
      select: {
        id: true,
        title: true,
        status: true,
        deal: { select: { id: true, dealNumber: true } },
      },
      take: 5,
    })

    // Format results
    const results = [
      ...deals.map((deal) => ({
        type: "deal" as const,
        id: deal.id,
        title: deal.dealNumber,
        subtitle: deal.propertyName || deal.name || deal.propertyAddress || "No property",
        url: `/deals/${deal.id}`,
      })),
      ...clients.map((client) => ({
        type: "client" as const,
        id: client.id,
        title: client.name,
        subtitle: client.type || "Individual",
        url: `/clients/${client.id}`,
      })),
      ...documents.map((doc) => ({
        type: "document" as const,
        id: doc.id,
        title: doc.name,
        subtitle: `${doc.deal.dealNumber} • ${doc.category}`,
        url: `/deals/${doc.deal.id}?tab=documents`,
      })),
      ...tasks.map((task) => ({
        type: "task" as const,
        id: task.id,
        title: task.title,
        subtitle: `${task.deal.dealNumber} • ${task.status}`,
        url: `/deals/${task.deal.id}?tab=tasks`,
      })),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    )
  }
}
