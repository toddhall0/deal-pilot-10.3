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
  condition?: string
  refundable?: boolean
}

export interface ContingencyInfo {
  name: string
  description: string
  deadline?: string
  deadlineDays?: number
  conditions?: string
}

export interface DueDiligenceItem {
  name: string
  description?: string
  deadline?: string
  deadlineDays?: number
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
  feasibilityPeriodDays?: number
  feasibilityExpiration?: string
  closingDate?: string
  outsideClosingDate?: string

  // Title & Survey
  titleCompany?: string
  escrowAgent?: string
  titleCommitmentDays?: number
  surveyDays?: number
  titleObjectionDays?: number
  titleCureDays?: number

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
  postClosingObligations?: string[]

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
