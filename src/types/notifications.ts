export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_DUE_SOON"
  | "TASK_OVERDUE"
  | "MILESTONE_DUE_SOON"
  | "MILESTONE_OVERDUE"
  | "MILESTONE_COMPLETED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_ANALYZED"
  | "DEAL_STATUS_CHANGED"
  | "DEAL_ASSIGNED"
  | "NOTE_MENTIONED"
  | "DEPOSIT_DUE_SOON"
  | "CLOSING_REMINDER"
  | "FEASIBILITY_EXPIRING"
  | "SYSTEM_ANNOUNCEMENT"

export type NotificationChannel = "IN_APP" | "EMAIL" | "BOTH"

export interface NotificationConfig {
  type: NotificationType
  title: string
  description: string
  defaultChannel: NotificationChannel
  canDisable: boolean
  category: "TASKS" | "MILESTONES" | "DOCUMENTS" | "DEALS" | "DEADLINES" | "SYSTEM"
}

export const NOTIFICATION_CONFIGS: Record<NotificationType, NotificationConfig> = {
  TASK_ASSIGNED: {
    type: "TASK_ASSIGNED",
    title: "Task Assigned",
    description: "When a task is assigned to you",
    defaultChannel: "BOTH",
    canDisable: true,
    category: "TASKS",
  },
  TASK_DUE_SOON: {
    type: "TASK_DUE_SOON",
    title: "Task Due Soon",
    description: "Reminder before task deadline",
    defaultChannel: "BOTH",
    canDisable: true,
    category: "TASKS",
  },
  TASK_OVERDUE: {
    type: "TASK_OVERDUE",
    title: "Task Overdue",
    description: "When a task passes its due date",
    defaultChannel: "BOTH",
    canDisable: true,
    category: "TASKS",
  },
  MILESTONE_DUE_SOON: {
    type: "MILESTONE_DUE_SOON",
    title: "Milestone Due Soon",
    description: "Reminder before milestone deadline",
    defaultChannel: "BOTH",
    canDisable: true,
    category: "MILESTONES",
  },
  MILESTONE_OVERDUE: {
    type: "MILESTONE_OVERDUE",
    title: "Milestone Overdue",
    description: "When a milestone passes its due date",
    defaultChannel: "BOTH",
    canDisable: true,
    category: "MILESTONES",
  },
  MILESTONE_COMPLETED: {
    type: "MILESTONE_COMPLETED",
    title: "Milestone Completed",
    description: "When a milestone is marked complete",
    defaultChannel: "IN_APP",
    canDisable: true,
    category: "MILESTONES",
  },
  DOCUMENT_UPLOADED: {
    type: "DOCUMENT_UPLOADED",
    title: "Document Uploaded",
    description: "When a new document is added to your deal",
    defaultChannel: "IN_APP",
    canDisable: true,
    category: "DOCUMENTS",
  },
  DOCUMENT_ANALYZED: {
    type: "DOCUMENT_ANALYZED",
    title: "Contract Analysis Complete",
    description: "When AI contract analysis finishes",
    defaultChannel: "IN_APP",
    canDisable: true,
    category: "DOCUMENTS",
  },
  DEAL_STATUS_CHANGED: {
    type: "DEAL_STATUS_CHANGED",
    title: "Deal Status Changed",
    description: "When a deal moves to a new status",
    defaultChannel: "BOTH",
    canDisable: true,
    category: "DEALS",
  },
  DEAL_ASSIGNED: {
    type: "DEAL_ASSIGNED",
    title: "Deal Assigned",
    description: "When you are assigned to a deal",
    defaultChannel: "BOTH",
    canDisable: true,
    category: "DEALS",
  },
  NOTE_MENTIONED: {
    type: "NOTE_MENTIONED",
    title: "Mentioned in Note",
    description: "When someone mentions you in a note",
    defaultChannel: "BOTH",
    canDisable: true,
    category: "DEALS",
  },
  DEPOSIT_DUE_SOON: {
    type: "DEPOSIT_DUE_SOON",
    title: "Deposit Due Soon",
    description: "Reminder before deposit deadline",
    defaultChannel: "BOTH",
    canDisable: true,
    category: "DEADLINES",
  },
  CLOSING_REMINDER: {
    type: "CLOSING_REMINDER",
    title: "Closing Reminder",
    description: "Reminders before closing date",
    defaultChannel: "BOTH",
    canDisable: true,
    category: "DEADLINES",
  },
  FEASIBILITY_EXPIRING: {
    type: "FEASIBILITY_EXPIRING",
    title: "Feasibility Period Expiring",
    description: "Warning before feasibility period ends",
    defaultChannel: "BOTH",
    canDisable: false,
    category: "DEADLINES",
  },
  SYSTEM_ANNOUNCEMENT: {
    type: "SYSTEM_ANNOUNCEMENT",
    title: "System Announcement",
    description: "Important system updates and announcements",
    defaultChannel: "BOTH",
    canDisable: false,
    category: "SYSTEM",
  },
}

export interface NotificationPayload {
  type: NotificationType
  userId: string
  title: string
  message: string
  dealId?: string
  taskId?: string
  milestoneId?: string
  documentId?: string
  actionUrl?: string
  metadata?: Record<string, any>
}
