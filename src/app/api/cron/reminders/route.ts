import { NextRequest, NextResponse } from "next/server"
import { runAllReminders } from "@/lib/notifications/reminderScheduler"

// This route can be called by an external cron service (like Railway Cron, Vercel Cron, or cron-job.org)
// Add a secret to protect it
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await runAllReminders()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json(
      { error: "Failed to run reminders" },
      { status: 500 }
    )
  }
}

// Also support POST for services that prefer POST
export async function POST(request: NextRequest) {
  return GET(request)
}
