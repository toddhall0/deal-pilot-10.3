export interface PartyInfo {
  name: string
  entityType?: string
  address?: string
  state?: string
}

export interface DepositInfo {
  name: string
  amount: number
  dueDate?: string
  dueDays?: number
  dueFromEvent?: string
  condition?: string
  refundable?: boolean
  refundableUntil?: string
}

export interface ContingencyInfo {
  name: string
  description: string
  deadline?: string
  deadlineDays?: number
  deadlineFromEvent?: string
  conditions?: string
  consequence?: string
}

export interface DueDiligenceItem {
  name: string
  description?: string
  deadline?: string
  deadlineDays?: number
  deadlineFromEvent?: string
  responsible: "BUYER" | "SELLER"
}

export interface ClosingDocument {
  name: string
  responsible: "BUYER" | "SELLER" | "BOTH"
  description?: string
}

export interface KeyDate {
  name: string
  date?: string
  daysFromEffective?: number
  description?: string
}

export interface MissingDateDependency {
  field: string
  dependsOn: string
  daysFromTrigger: number
  description: string
  priority: "HIGH" | "MEDIUM" | "LOW"
}

export interface ChecklistItem {
  item: string
  responsible: "BUYER" | "SELLER" | "BOTH"
  deadline?: string
  deadlineDays?: number
  deadlineFromEvent?: string
  contractReference?: string
  category: string
  isCritical: boolean
}

export interface PostClosingObligation {
  obligation: string
  responsible: "BUYER" | "SELLER"
  deadline?: string
  survives?: string
}

export interface KeyMilestone {
  name: string
  date?: string
  daysFromEffective?: number
  description?: string
  category: "CONTRACT" | "FEASIBILITY" | "TITLE" | "SURVEY" | "FINANCING" | "CLOSING" | "POST_CLOSING"
}

export interface ContractAnalysisResult {
  // Parties
  buyer: PartyInfo
  seller: PartyInfo

  // Property
  propertyAddress?: string
  propertyCity?: string
  propertyState?: string
  propertyCounty?: string
  legalDescription?: string
  acreage?: number
  squareFootage?: number
  lotCount?: number
  unitCount?: number

  // Financial
  purchasePrice: number
  pricePerAcre?: number
  pricePerSquareFoot?: number
  pricePerUnit?: number
  priceAdjustable: boolean
  priceAdjustmentBasis?: string

  // Deposits
  deposits: DepositInfo[]

  // Key Dates
  contractDate?: string
  effectiveDate?: string
  effectiveDateTrigger?: string
  feasibilityPeriodDays?: number
  feasibilityExpiration?: string
  closingDate?: string
  closingDateDays?: number
  closingDateFromEvent?: string
  outsideClosingDate?: string

  // Title & Survey
  titleCompany?: string
  escrowAgent?: string
  titleCommitmentDays?: number
  titleCommitmentDate?: string
  surveyDays?: number
  surveyDate?: string
  titleObjectionDays?: number
  titleObjectionDate?: string
  titleCureDays?: number
  titleCureDate?: string

  // Missing Date Dependencies
  missingDateDependencies?: MissingDateDependency[]

  // Checklists
  preFeasibilityChecklist?: ChecklistItem[]
  preClosingChecklist?: ChecklistItem[]

  // Contingencies
  contingencies: ContingencyInfo[]

  // Due Diligence
  dueDiligenceItems: DueDiligenceItem[]

  // Closing
  closingDocuments: ClosingDocument[]
  closingLocation?: string

  // Prorations
  prorationDate?: string
  prorationItems?: string[]

  // Special Provisions
  specialProvisions?: string[]

  // Post-Closing
  postClosingObligations?: PostClosingObligation[]

  // Key Milestones for timeline import
  keyMilestones?: KeyMilestone[]

  // Metadata
  confidence: number
  warnings?: string[]
  rawText?: string
}

export interface AnalysisJob {
  id: string
  dealId: string
  documentId: string
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
  progress: number
  result?: ContractAnalysisResult
  error?: string
  startedAt: Date
  completedAt?: Date
}

// Helper function to calculate dates when effective date is provided
export function calculateDependentDates(
  analysis: ContractAnalysisResult,
  effectiveDate: Date
): ContractAnalysisResult {
  const result = { ...analysis }
  const addDays = (date: Date, days: number): string => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d.toISOString().split("T")[0]
  }

  // Calculate feasibility expiration
  if (result.feasibilityPeriodDays && !result.feasibilityExpiration) {
    result.feasibilityExpiration = addDays(effectiveDate, result.feasibilityPeriodDays)
  }

  // Calculate closing date
  if (result.closingDateDays && !result.closingDate) {
    result.closingDate = addDays(effectiveDate, result.closingDateDays)
  }

  // Calculate title dates
  if (result.titleCommitmentDays && !result.titleCommitmentDate) {
    result.titleCommitmentDate = addDays(effectiveDate, result.titleCommitmentDays)
  }
  if (result.surveyDays && !result.surveyDate) {
    result.surveyDate = addDays(effectiveDate, result.surveyDays)
  }
  if (result.titleObjectionDays && !result.titleObjectionDate) {
    result.titleObjectionDate = addDays(effectiveDate, result.titleObjectionDays)
  }
  if (result.titleCureDays && !result.titleCureDate) {
    result.titleCureDate = addDays(effectiveDate, result.titleCureDays)
  }

  // Update deposits
  result.deposits = result.deposits.map((deposit) => {
    if (deposit.dueDays && !deposit.dueDate) {
      return { ...deposit, dueDate: addDays(effectiveDate, deposit.dueDays) }
    }
    return deposit
  })

  // Update contingencies
  result.contingencies = result.contingencies.map((contingency) => {
    if (contingency.deadlineDays && !contingency.deadline) {
      return { ...contingency, deadline: addDays(effectiveDate, contingency.deadlineDays) }
    }
    return contingency
  })

  // Update due diligence items
  result.dueDiligenceItems = result.dueDiligenceItems.map((item) => {
    if (item.deadlineDays && !item.deadline) {
      return { ...item, deadline: addDays(effectiveDate, item.deadlineDays) }
    }
    return item
  })

  // Update checklists
  if (result.preFeasibilityChecklist) {
    result.preFeasibilityChecklist = result.preFeasibilityChecklist.map((item) => {
      if (item.deadlineDays && !item.deadline) {
        return { ...item, deadline: addDays(effectiveDate, item.deadlineDays) }
      }
      return item
    })
  }

  if (result.preClosingChecklist) {
    result.preClosingChecklist = result.preClosingChecklist.map((item) => {
      if (item.deadlineDays && !item.deadline) {
        return { ...item, deadline: addDays(effectiveDate, item.deadlineDays) }
      }
      return item
    })
  }

  // Update key milestones
  if (result.keyMilestones) {
    result.keyMilestones = result.keyMilestones.map((milestone) => {
      if (milestone.daysFromEffective && !milestone.date) {
        return { ...milestone, date: addDays(effectiveDate, milestone.daysFromEffective) }
      }
      return milestone
    })
  }

  // Clear missing date dependencies that are now resolved
  result.missingDateDependencies = result.missingDateDependencies?.filter(
    (dep) => dep.dependsOn !== "effectiveDate"
  )

  // Set the effective date
  result.effectiveDate = effectiveDate.toISOString().split("T")[0]

  return result
}
