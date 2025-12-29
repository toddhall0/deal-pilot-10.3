import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parentId: z.string().optional().nullable(),
  description: z.string().optional(),
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

    const folders = await prisma.documentFolder.findMany({
      where: { dealId },
      include: {
        documents: {
          select: { id: true },
        },
        children: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    })

    // Add document count to each folder
    const foldersWithCount = folders.map((folder: typeof folders[number]) => ({
      ...folder,
      documentCount: folder.documents.length,
    }))

    return NextResponse.json(foldersWithCount)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch folders" },
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
    const data = createFolderSchema.parse(body)

    const folder = await prisma.documentFolder.create({
      data: {
        ...data,
        dealId,
      },
    })

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    )
  }
}
