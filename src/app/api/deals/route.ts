import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createDealSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["ACQUISITION", "DISPOSITION"]),
  clientId: z.string().optional(),
  propertyName: z.string().optional(),
  propertyType: z.string().optional(),
  propertyAddress: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyState: z.string().optional(),
  propertyZip: z.string().optional(),
})

// Generate deal number
async function generateDealNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.deal.count({
    where: {
      dealNumber: {
        startsWith: `DP-${year}`,
      },
    },
  })
  const number = (count + 1).toString().padStart(4, "0")
  return `DP-${year}-${number}`
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const deals = await prisma.deal.findMany({
      include: {
        client: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(deals)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = createDealSchema.parse(body)

    // Get or create a default client for now
    let clientId = data.clientId
    if (!clientId) {
      const defaultClient = await prisma.client.findFirst()
      if (!defaultClient) {
        // Create a default client
        const firm = await prisma.firm.findFirst()
        if (!firm) {
          return NextResponse.json(
            { error: "No firm found. Please run the seed script." },
            { status: 400 }
          )
        }
        const newClient = await prisma.client.create({
          data: {
            name: "Default Client",
            firmId: firm.id,
          },
        })
        clientId = newClient.id
      } else {
        clientId = defaultClient.id
      }
    }

    const dealNumber = await generateDealNumber()

    const deal = await prisma.deal.create({
      data: {
        name: data.name,
        dealNumber,
        type: data.type as "ACQUISITION" | "DISPOSITION",
        status: "DRAFT",
        clientId,
        createdById: session.user.id,
        propertyName: data.propertyName,
        propertyType: data.propertyType as "OFFICE" | "RETAIL" | "INDUSTRIAL" | "MULTIFAMILY" | "MIXED_USE" | "LAND" | "HOSPITALITY" | "HEALTHCARE" | "SELF_STORAGE" | "DATA_CENTER" | "OTHER" | undefined,
        propertyAddress: data.propertyAddress,
        propertyCity: data.propertyCity,
        propertyState: data.propertyState,
        propertyZip: data.propertyZip,
      },
      include: {
        client: true,
      },
    })

    // Create associated timeline
    await prisma.timeline.create({
      data: {
        dealId: deal.id,
      },
    })

    // Create associated financials
    await prisma.dealFinancials.create({
      data: {
        dealId: deal.id,
      },
    })

    // Create default document folders
    const defaultFolders = [
      { name: "Purchase Agreement", sortOrder: 1 },
      { name: "Amendments", sortOrder: 2 },
      { name: "Due Diligence", sortOrder: 3 },
      { name: "Title", sortOrder: 4 },
      { name: "Survey", sortOrder: 5 },
      { name: "Environmental", sortOrder: 6 },
      { name: "Financial Documents", sortOrder: 7 },
      { name: "Closing Documents", sortOrder: 8 },
      { name: "Correspondence", sortOrder: 9 },
    ]

    await prisma.documentFolder.createMany({
      data: defaultFolders.map((folder) => ({
        ...folder,
        dealId: deal.id,
      })),
    })

    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Error creating deal:", error)
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    )
  }
}
