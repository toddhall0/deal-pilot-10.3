export type MilestoneStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "MISSED"
  | "WAIVED"
  | "NOT_APPLICABLE"

export interface MilestoneWithChildren {
  id: string
  status: MilestoneStatus
  dueDate: Date | string
  completedDate: Date | string | null
  children?: MilestoneWithChildren[]
}

export function calculateMilestoneStatus(
  milestone: MilestoneWithChildren
): MilestoneStatus {
  // If explicitly set to these statuses, respect them
  if (
    milestone.status === "WAIVED" ||
    milestone.status === "NOT_APPLICABLE" ||
    milestone.status === "COMPLETED"
  ) {
    return milestone.status
  }

  const now = new Date()
  const dueDate = new Date(milestone.dueDate)

  // If completed, return completed
  if (milestone.completedDate) {
    return "COMPLETED"
  }

  // If past due date without completion, it's missed
  if (dueDate < now) {
    return "MISSED"
  }

  // If has children, check their status
  if (milestone.children && milestone.children.length > 0) {
    const childStatuses = milestone.children.map((c) =>
      calculateMilestoneStatus(c)
    )

    const hasIncomplete = childStatuses.some(
      (s) => s !== "COMPLETED" && s !== "WAIVED" && s !== "NOT_APPLICABLE"
    )
    const hasStarted = childStatuses.some(
      (s) => s === "COMPLETED" || s === "IN_PROGRESS"
    )

    if (hasIncomplete && hasStarted) {
      return "IN_PROGRESS"
    }
  }

  // Default to pending
  return milestone.status || "PENDING"
}

export function getDaysUntilDue(dueDate: Date | string): number {
  const now = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getStatusColor(status: MilestoneStatus): string {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-800"
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800"
    case "MISSED":
      return "bg-red-100 text-red-800"
    case "WAIVED":
      return "bg-gray-100 text-gray-800"
    case "NOT_APPLICABLE":
      return "bg-gray-100 text-gray-500"
    default:
      return "bg-yellow-100 text-yellow-800"
  }
}

export function getStatusIcon(status: MilestoneStatus): string {
  switch (status) {
    case "COMPLETED":
      return "check-circle"
    case "IN_PROGRESS":
      return "clock"
    case "MISSED":
      return "x-circle"
    case "WAIVED":
      return "minus-circle"
    case "NOT_APPLICABLE":
      return "slash"
    default:
      return "circle"
  }
}
