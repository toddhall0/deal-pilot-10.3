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

    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
    })

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.userPreferences.create({
        data: {
          userId: session.user.id,
          emailNotifications: true,
          taskReminders: true,
          deadlineAlerts: true,
          notificationFrequency: "REALTIME",
        },
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      emailNotifications,
      taskReminders,
      deadlineAlerts,
      notificationFrequency,
      dailySummaryTime,
      weeklySummaryDay,
    } = body

    const updated = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        emailNotifications: emailNotifications ?? true,
        taskReminders: taskReminders ?? true,
        deadlineAlerts: deadlineAlerts ?? true,
        notificationFrequency: notificationFrequency ?? "REALTIME",
        dailySummaryTime,
        weeklySummaryDay,
      },
      update: {
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(taskReminders !== undefined && { taskReminders }),
        ...(deadlineAlerts !== undefined && { deadlineAlerts }),
        ...(notificationFrequency !== undefined && { notificationFrequency }),
        ...(dailySummaryTime !== undefined && { dailySummaryTime }),
        ...(weeklySummaryDay !== undefined && { weeklySummaryDay }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    )
  }
}
