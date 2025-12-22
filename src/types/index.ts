export type UserRole = 'ADMIN' | 'ATTORNEY' | 'CLIENT'

export type DealStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'UNDER_CONTRACT'
  | 'IN_DUE_DILIGENCE'
  | 'PENDING_CLOSING'
  | 'CLOSED'
  | 'TERMINATED'
  | 'ON_HOLD'

export type DealType = 'ACQUISITION' | 'DISPOSITION'

export type PropertyType =
  | 'OFFICE'
  | 'RETAIL'
  | 'INDUSTRIAL'
  | 'MULTIFAMILY'
  | 'MIXED_USE'
  | 'LAND'
  | 'HOSPITALITY'
  | 'HEALTHCARE'
  | 'SELF_STORAGE'
  | 'OTHER'

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED'

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'WAIVED'
