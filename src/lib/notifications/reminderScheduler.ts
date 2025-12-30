import { prisma } from "@/lib/prisma"
import { createNotification, notifyDealTeam } from "./notificationService"

// Helper to calculate days until date
function daysUntil(date: Date): number {
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Check for tasks due soon or overdue
export async function checkTaskReminders(): Promise<void> {
  const now = new Date()
  const threeDays = new Date()
  threeDays.setDate(threeDays.getDate() + 3)

  try {
    // Find tasks due in next 3 days
    const upcomingTasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: threeDays,
        },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        assigneeId: { not: null },
      },
      include: {
        deal: { select: { dealNumber: true } },
        assignee: { select: { id: true, name: true } },
      },
    })

    for (const task of upcomingTasks) {
      if (!task.dueDate || !task.assigneeId) continue

      const daysLeft = daysUntil(task.dueDate)

      await createNotification({
        type: "TASK_DUE_SOON",
        userId: task.assigneeId,
        title: task.title,
        message: `This task is due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
        dealId: task.dealId,
        taskId: task.id,
        metadata: {
          dealNumber: task.deal.dealNumber,
          dueDate: task.dueDate.toLocaleDateString(),
        },
      })
    }

    // Find overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        assigneeId: { not: null },
      },
      include: {
        deal: { select: { dealNumber: true } },
        assignee: { select: { id: true, name: true } },
      },
    })

    for (const task of overdueTasks) {
      if (!task.dueDate || !task.assigneeId) continue

      await createNotification({
        type: "TASK_OVERDUE",
        userId: task.assigneeId,
        title: task.title,
        message: `This task is overdue`,
        dealId: task.dealId,
        taskId: task.id,
        metadata: {
          dealNumber: task.deal.dealNumber,
          dueDate: task.dueDate.toLocaleDateString(),
        },
      })
    }
  } catch (error) {
    console.error("Error checking task reminders:", error)
  }
}

// Check for milestones due soon
export async function checkMilestoneReminders(): Promise<void> {
  const now = new Date()
  const oneWeek = new Date()
  oneWeek.setDate(oneWeek.getDate() + 7)

  try {
    const upcomingMilestones = await prisma.milestone.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: oneWeek,
        },
        status: { notIn: ["COMPLETED", "WAIVED", "NOT_APPLICABLE"] },
      },
      include: {
        timeline: {
          include: {
            deal: {
              select: { id: true, dealNumber: true, propertyName: true },
            },
          },
        },
      },
    })

    for (const milestone of upcomingMilestones) {
      const daysLeft = daysUntil(milestone.dueDate)
      const deal = milestone.timeline.deal

      await notifyDealTeam(deal.id, {
        type: "MILESTONE_DUE_SOON",
        title: milestone.name,
        message: `Milestone due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
        milestoneId: milestone.id,
        metadata: {
          dealNumber: deal.dealNumber,
          propertyName: deal.propertyName,
          dueDate: milestone.dueDate.toLocaleDateString(),
        },
      })
    }
  } catch (error) {
    console.error("Error checking milestone reminders:", error)
  }
}

// Check for deposits due soon
export async function checkDepositReminders(): Promise<void> {
  const now = new Date()
  const threeDays = new Date()
  threeDays.setDate(threeDays.getDate() + 3)

  try {
    const upcomingDeposits = await prisma.deposit.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: threeDays,
        },
        status: { in: ["SCHEDULED", "DUE"] },
      },
      include: {
        financials: {
          include: {
            deal: {
              select: { id: true, dealNumber: true },
            },
          },
        },
      },
    })

    for (const deposit of upcomingDeposits) {
      const daysLeft = daysUntil(deposit.dueDate)
      const deal = deposit.financials.deal

      await notifyDealTeam(deal.id, {
        type: "DEPOSIT_DUE_SOON",
        title: deposit.name,
        message: `Deposit of $${Number(deposit.amount).toLocaleString()} due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
        dealId: deal.id,
        metadata: {
          dealNumber: deal.dealNumber,
          amount: `$${Number(deposit.amount).toLocaleString()}`,
          dueDate: deposit.dueDate.toLocaleDateString(),
        },
      })
    }
  } catch (error) {
    console.error("Error checking deposit reminders:", error)
  }
}

// Check for closing reminders
export async function checkClosingReminders(): Promise<void> {
  const now = new Date()
  const twoWeeks = new Date()
  twoWeeks.setDate(twoWeeks.getDate() + 14)

  try {
    const upcomingClosings = await prisma.transactionSummary.findMany({
      where: {
        closingDate: {
          gte: now,
          lte: twoWeeks,
        },
      },
      include: {
        deal: {
          select: { id: true, dealNumber: true, propertyName: true },
        },
      },
    })

    for (const summary of upcomingClosings) {
      if (!summary.closingDate) continue

      const daysLeft = daysUntil(summary.closingDate)
      const deal = summary.deal

      await notifyDealTeam(deal.id, {
        type: "CLOSING_REMINDER",
        title: "Closing Date Approaching",
        message: `Closing in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
        dealId: deal.id,
        metadata: {
          dealNumber: deal.dealNumber,
          propertyName: deal.propertyName,
          dueDate: summary.closingDate.toLocaleDateString(),
        },
      })
    }
  } catch (error) {
    console.error("Error checking closing reminders:", error)
  }
}

// Run all reminders
export async function runAllReminders(): Promise<void> {
  console.log("Running reminder checks...")
  await checkTaskReminders()
  await checkMilestoneReminders()
  await checkDepositReminders()
  await checkClosingReminders()
  console.log("Reminder checks complete")
}
