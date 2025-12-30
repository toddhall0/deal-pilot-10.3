export type ReportType =
  | "DEAL_SUMMARY"
  | "DEAL_TIMELINE"
  | "DEAL_FINANCIALS"
  | "PIPELINE_SUMMARY"
  | "CLIENT_PORTFOLIO"
  | "TASK_LIST"
  | "MILESTONE_STATUS"

export type ReportFormat = "PDF" | "EXCEL" | "CSV"

export interface ReportConfig {
  type: ReportType
  title: string
  description: string
  icon: string
  formats: ReportFormat[]
  requiresDealId?: boolean
  requiresClientId?: boolean
  requiresDateRange?: boolean
}

export const REPORT_CONFIGS: Record<ReportType, ReportConfig> = {
  DEAL_SUMMARY: {
    type: "DEAL_SUMMARY",
    title: "Deal Summary Report",
    description: "Complete overview of a deal including parties, terms, and status",
    icon: "FileText",
    formats: ["PDF", "EXCEL"],
    requiresDealId: true,
  },
  DEAL_TIMELINE: {
    type: "DEAL_TIMELINE",
    title: "Deal Timeline Report",
    description: "All milestones and deadlines for a deal",
    icon: "Calendar",
    formats: ["PDF", "EXCEL"],
    requiresDealId: true,
  },
  DEAL_FINANCIALS: {
    type: "DEAL_FINANCIALS",
    title: "Deal Financials Report",
    description: "Financial summary including deposits, costs, and projections",
    icon: "DollarSign",
    formats: ["PDF", "EXCEL"],
    requiresDealId: true,
  },
  PIPELINE_SUMMARY: {
    type: "PIPELINE_SUMMARY",
    title: "Pipeline Summary Report",
    description: "Overview of all active deals by status and value",
    icon: "TrendingUp",
    formats: ["PDF", "EXCEL"],
    requiresDateRange: true,
  },
  CLIENT_PORTFOLIO: {
    type: "CLIENT_PORTFOLIO",
    title: "Client Portfolio Report",
    description: "All deals and activity for a specific client",
    icon: "Users",
    formats: ["PDF", "EXCEL"],
    requiresClientId: true,
  },
  TASK_LIST: {
    type: "TASK_LIST",
    title: "Task List Report",
    description: "Export tasks with status, assignments, and due dates",
    icon: "CheckSquare",
    formats: ["PDF", "EXCEL", "CSV"],
    requiresDealId: true,
  },
  MILESTONE_STATUS: {
    type: "MILESTONE_STATUS",
    title: "Milestone Status Report",
    description: "Current status of all milestones across deals",
    icon: "Flag",
    formats: ["PDF", "EXCEL"],
    requiresDateRange: true,
  },
}

export interface ReportRequest {
  type: ReportType
  format: ReportFormat
  dealId?: string
  clientId?: string
  startDate?: string
  endDate?: string
  includeCompleted?: boolean
  includeCancelled?: boolean
}

export interface ReportData {
  title: string
  generatedAt: Date
  generatedBy: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
}
