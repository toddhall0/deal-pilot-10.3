import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email/resend"
import { EmailTemplates } from "@/lib/email/templates"
import { NotificationType, NotificationPayload, NOTIFICATION_CONFIGS } from "@/types/notifications"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function createNotification(payload: NotificationPayload): Promise<void> {
  const { type, userId, title, message, dealId, taskId, milestoneId, documentId, actionUrl, metadata } = payload

  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      console.error("User not found for notification:", userId)
      return
    }

    const config = NOTIFICATION_CONFIGS[type]

    // Determine entity type and id for polymorphic reference
    let entityType: string | undefined
    let entityId: string | undefined

    if (dealId) {
      entityType = "DEAL"
      entityId = dealId
    } else if (taskId) {
      entityType = "TASK"
      entityId = taskId
    } else if (milestoneId) {
      entityType = "MILESTONE"
      entityId = milestoneId
    } else if (documentId) {
      entityType = "DOCUMENT"
      entityId = documentId
    }

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: actionUrl || getDefaultActionUrl(type, { dealId, taskId, milestoneId }),
        entityType,
        entityId,
      },
    })

    // Send email notification if user has email
    if (user.email && (config.defaultChannel === "EMAIL" || config.defaultChannel === "BOTH")) {
      await sendNotificationEmail(type, user.email, user.name || "User", payload)
    }
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

async function sendNotificationEmail(
  type: NotificationType,
  email: string,
  recipientName: string,
  payload: NotificationPayload
): Promise<void> {
  let html: string
  let subject: string

  const baseData = {
    recipientName,
    actionUrl: payload.actionUrl || APP_URL,
  }

  switch (type) {
    case "TASK_ASSIGNED":
      subject = `New Task: ${payload.title}`
      html = EmailTemplates.taskAssigned({
        ...baseData,
        taskTitle: payload.title,
        dealNumber: payload.metadata?.dealNumber || "",
        dueDate: payload.metadata?.dueDate,
        assignedBy: payload.metadata?.assignedBy,
      })
      break

    case "TASK_DUE_SOON":
      subject = `Task Due Soon: ${payload.title}`
      html = EmailTemplates.taskDueSoon({
        ...baseData,
        taskTitle: payload.title,
        dealNumber: payload.metadata?.dealNumber || "",
        dueDate: payload.metadata?.dueDate,
      })
      break

    case "TASK_OVERDUE":
      subject = `⚠️ Task Overdue: ${payload.title}`
      html = EmailTemplates.taskOverdue({
        ...baseData,
        taskTitle: payload.title,
        dealNumber: payload.metadata?.dealNumber || "",
        dueDate: payload.metadata?.dueDate,
      })
      break

    case "MILESTONE_DUE_SOON":
      subject = `Milestone Due Soon: ${payload.title}`
      html = EmailTemplates.milestoneDueSoon({
        ...baseData,
        milestoneName: payload.title,
        dealNumber: payload.metadata?.dealNumber || "",
        propertyName: payload.metadata?.propertyName,
        dueDate: payload.metadata?.dueDate,
      })
      break

    case "DEAL_STATUS_CHANGED":
      subject = `Deal Status Update: ${payload.metadata?.dealNumber}`
      html = EmailTemplates.dealStatusChanged({
        ...baseData,
        dealNumber: payload.metadata?.dealNumber || "",
        propertyName: payload.metadata?.propertyName,
        newStatus: payload.metadata?.newStatus,
        previousStatus: payload.metadata?.previousStatus,
      })
      break

    case "DEPOSIT_DUE_SOON":
      subject = `Deposit Due: ${payload.metadata?.amount}`
      html = EmailTemplates.depositDueSoon({
        ...baseData,
        depositName: payload.title,
        amount: payload.metadata?.amount || "",
        dealNumber: payload.metadata?.dealNumber || "",
        dueDate: payload.metadata?.dueDate || "",
      })
      break

    case "CLOSING_REMINDER":
      subject = `Closing Approaching: ${payload.metadata?.dealNumber}`
      html = EmailTemplates.closingReminder({
        ...baseData,
        milestoneName: "Closing Date",
        dealNumber: payload.metadata?.dealNumber || "",
        propertyName: payload.metadata?.propertyName,
        dueDate: payload.metadata?.dueDate,
      })
      break

    default:
      // Generic email for other types
      subject = payload.title
      html = `<p>${payload.message}</p>`
  }

  await sendEmail({
    to: email,
    subject,
    html,
  })
}

function getDefaultActionUrl(
  type: NotificationType,
  ids: { dealId?: string; taskId?: string; milestoneId?: string }
): string {
  if (ids.dealId) {
    switch (type) {
      case "MILESTONE_DUE_SOON":
      case "MILESTONE_OVERDUE":
      case "MILESTONE_COMPLETED":
        return `${APP_URL}/deals/${ids.dealId}?tab=timeline`
      case "DOCUMENT_UPLOADED":
      case "DOCUMENT_ANALYZED":
        return `${APP_URL}/deals/${ids.dealId}?tab=documents`
      case "DEPOSIT_DUE_SOON":
        return `${APP_URL}/deals/${ids.dealId}?tab=financials`
      default:
        return `${APP_URL}/deals/${ids.dealId}`
    }
  }
  return APP_URL
}

// Bulk notification helpers
export async function notifyDealTeam(
  dealId: string,
  notification: Omit<NotificationPayload, "userId">
): Promise<void> {
  // Get deal creator and task assignees
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      tasks: {
        where: { assigneeId: { not: null } },
        select: { assigneeId: true },
      },
    },
  })

  if (!deal) return

  const userIds = new Set<string>()
  userIds.add(deal.createdById)
  deal.tasks?.forEach((t) => t.assigneeId && userIds.add(t.assigneeId))

  for (const userId of userIds) {
    await createNotification({ ...notification, userId, dealId })
  }
}
