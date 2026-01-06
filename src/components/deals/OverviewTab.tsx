"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { TransactionSummary } from "@/components/analysis/TransactionSummary"
import { AnalyzeButton } from "@/components/analysis/AnalyzeButton"
import {
  Building,
  FileText,
  CheckSquare,
  Calendar,
  RefreshCw,
  DollarSign,
  ArrowRight,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Document {
  id: string
  name: string
  isPrimaryContract: boolean
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
}

interface Milestone {
  id: string
  name: string
  dueDate: string
  status: string
}

interface Issue {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  createdAt: string
}

interface Deposit {
  id: string
  name: string
  amount: number
  paidAmount: number | null
  status: string
}

interface LineItem {
  id: string
  category: string
  amount: number
  type: string
}

interface Financials {
  contractPrice: number | null
  deposits: Deposit[]
  lineItems: LineItem[]
}

// Using a flexible type to accommodate Prisma's Decimal type
type DecimalLike = number | { toNumber(): number } | null

interface TransactionSummaryData {
  buyerName?: string | null
  sellerName?: string | null
  purchasePrice?: DecimalLike
}

interface Timeline {
  id: string
  milestones: Milestone[]
}

interface Deal {
  id: string
  type: string
  propertyName?: string | null
  propertyType?: string | null
  propertyAddress?: string | null
  propertyCity?: string | null
  propertyState?: string | null
  propertyZip?: string | null
  acreage?: DecimalLike
  squareFootage?: DecimalLike
  lotCount?: number | null
  unitCount?: number | null
  documents?: Document[]
  tasks?: Task[]
  issues?: Issue[]
  timeline?: Timeline | null
  transactionSummary?: TransactionSummaryData | null
}

interface OverviewTabProps {
  deal: Deal
}

export function OverviewTab({ deal }: OverviewTabProps) {
  const [summary, setSummary] = useState(deal.transactionSummary)
  const [primaryContract, setPrimaryContract] = useState<Document | null>(null)
  const [financials, setFinancials] = useState<Financials | null>(null)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Find primary contract document
    const contract = deal.documents?.find((d: Document) => d.isPrimaryContract)
    setPrimaryContract(contract || null)
  }, [deal.documents])

  useEffect(() => {
    // Fetch financials
    async function fetchFinancials() {
      try {
        const response = await fetch(`/api/deals/${deal.id}/financials`)
        if (response.ok) {
          const data = await response.json()
          setFinancials(data)
        }
      } catch (error) {
        console.error("Failed to fetch financials:", error)
      }
    }
    fetchFinancials()
  }, [deal.id])

  const handleAnalysisComplete = async () => {
    // Refresh summary
    const response = await fetch(`/api/deals/${deal.id}/summary`)
    if (response.ok) {
      const data = await response.json()
      setSummary(data)
    }
  }

  const handleTaskCheck = async (taskId: string, currentStatus: string) => {
    const isCompleted = completedTasks.has(taskId) || currentStatus === "COMPLETED"
    const newStatus = isCompleted ? "IN_PROGRESS" : "COMPLETED"

    setCompletedTasks((prev) => {
      const next = new Set(prev)
      if (isCompleted) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch (error) {
      console.error("Failed to update task:", error)
    }
  }

  const isTaskCompleted = (task: Task) => {
    return completedTasks.has(task.id) || task.status === "COMPLETED"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const priorityColors: Record<string, string> = {
    LOW: "bg-slate-500/20 text-slate-300",
    MEDIUM: "bg-blue-500/20 text-blue-400",
    HIGH: "bg-orange-500/20 text-orange-400",
    URGENT: "bg-red-500/20 text-red-400",
  }

  const statusColors: Record<string, string> = {
    TODO: "bg-slate-500/20 text-slate-300",
    IN_PROGRESS: "bg-blue-500/20 text-blue-400",
    IN_REVIEW: "bg-purple-500/20 text-purple-400",
    BLOCKED: "bg-red-500/20 text-red-400",
    COMPLETED: "bg-green-500/20 text-green-400",
  }

  const issuePriorityColors: Record<string, string> = {
    LOW: "bg-slate-500/20 text-slate-300",
    MEDIUM: "bg-blue-500/20 text-blue-400",
    HIGH: "bg-orange-500/20 text-orange-400",
    CRITICAL: "bg-red-500/20 text-red-400",
  }

  const issueStatusColors: Record<string, string> = {
    OPEN: "bg-red-500/20 text-red-400",
    IN_PROGRESS: "bg-yellow-500/20 text-yellow-400",
    RESOLVED: "bg-green-500/20 text-green-400",
    CLOSED: "bg-slate-500/20 text-slate-400",
  }

  const stats = {
    tasks: deal.tasks?.length || 0,
    completedTasks: deal.tasks?.filter((t: Task) => t.status === "COMPLETED").length || 0,
    documents: deal.documents?.length || 0,
    milestones: deal.timeline?.milestones?.length || 0,
  }

  // Get active tasks (not completed)
  const activeTasks = (deal.tasks || []).filter((t) => t.status !== "COMPLETED").slice(0, 5)

  // Get open issues
  const openIssues = (deal.issues || []).filter((i) => i.status === "OPEN" || i.status === "IN_PROGRESS")

  // Get upcoming milestones (next 7 days, not completed)
  const upcomingMilestones = (deal.timeline?.milestones || [])
    .filter((m) => {
      if (m.status === "COMPLETED" || m.status === "WAIVED") return false
      const daysUntil = Math.ceil(
        (new Date(m.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      return daysUntil >= -7 && daysUntil <= 14 // Show overdue up to 7 days and upcoming 14 days
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)

  // Calculate financial totals - convert Decimal to number
  const totalDeposits = financials?.deposits?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0
  const depositsPaid = financials?.deposits
    ?.filter((d) => d.status === "PAID" || d.status === "APPLIED_TO_PURCHASE")
    .reduce((sum, d) => sum + Number(d.paidAmount || d.amount || 0), 0) || 0
  const depositsScheduled = financials?.deposits
    ?.filter((d) => d.status === "SCHEDULED" || d.status === "DUE")
    .reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0
  const totalCredits = financials?.lineItems?.filter((l) => l.type === "CREDIT").reduce((sum, l) => sum + Number(l.amount || 0), 0) || 0
  const totalDebits = financials?.lineItems?.filter((l) => l.type === "DEBIT").reduce((sum, l) => sum + Number(l.amount || 0), 0) || 0
  const contractPrice = Number(financials?.contractPrice || 0)

  const getDaysUntil = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats.completedTasks}/{stats.tasks}
                </p>
                <p className="text-sm text-slate-400">Tasks Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.documents}</p>
                <p className="text-sm text-slate-400">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.milestones}</p>
                <p className="text-sm text-slate-400">Milestones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-white">{deal.type}</p>
                <p className="text-sm text-slate-400">Deal Type</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks and Milestones Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deal Tasks */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2 text-white">
              <CheckSquare className="h-5 w-5 text-purple-400" />
              Deal Tasks
            </CardTitle>
            <Link href={`/deals/${deal.id}?tab=tasks`}>
              <Button variant="ghost" size="sm" className="text-sm text-slate-400 hover:text-white">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {activeTasks.length === 0 ? (
              <div className="text-center py-4 text-slate-500 px-6">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                <p>No active tasks</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full" style={{ tableLayout: "auto" }}>
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-2 py-2 w-8"></th>
                      <th className="text-left text-xs font-medium text-slate-400 px-3 py-2 whitespace-nowrap">Task</th>
                      <th className="text-left text-xs font-medium text-slate-400 px-3 py-2 whitespace-nowrap">Priority</th>
                      <th className="text-left text-xs font-medium text-slate-400 px-3 py-2 whitespace-nowrap">Status</th>
                      <th className="text-left text-xs font-medium text-slate-400 px-3 py-2 whitespace-nowrap">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTasks.map((task) => (
                      <tr
                        key={task.id}
                        className={`border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50 transition-colors ${
                          isTaskCompleted(task) ? "opacity-50" : ""
                        }`}
                      >
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div
                            onClick={() => handleTaskCheck(task.id, task.status)}
                            className="cursor-pointer"
                          >
                            <Checkbox
                              className="border-slate-600 pointer-events-none"
                              checked={isTaskCompleted(task)}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm font-medium text-white">{task.title}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Badge className={`${priorityColors[task.priority]} text-xs`}>
                            {task.priority}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Badge className={`${statusColors[task.status]} text-xs`}>
                            {task.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {task.dueDate ? (
                            <span className={`text-xs ${
                              new Date(task.dueDate) < new Date() ? "text-red-400" : "text-slate-400"
                            }`}>
                              {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Milestones */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5 text-orange-400" />
              Upcoming Milestones
            </CardTitle>
            <Link href={`/deals/${deal.id}?tab=timeline`}>
              <Button variant="ghost" size="sm" className="text-sm text-slate-400 hover:text-white">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingMilestones.length === 0 ? (
              <div className="text-center py-4 text-slate-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                <p>No upcoming milestones</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingMilestones.map((milestone) => {
                  const daysUntil = getDaysUntil(milestone.dueDate)
                  const isOverdue = daysUntil < 0
                  const isUrgent = daysUntil <= 1 && daysUntil >= 0

                  return (
                    <div
                      key={milestone.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        isOverdue
                          ? "border-red-500/50 bg-red-500/10"
                          : isUrgent
                          ? "border-orange-500/50 bg-orange-500/10"
                          : "border-slate-700 hover:bg-slate-700/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-white truncate">
                            {milestone.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(milestone.dueDate).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs ml-2">
                          {isOverdue ? (
                            <AlertTriangle className="h-3 w-3 text-red-400" />
                          ) : isUrgent ? (
                            <AlertTriangle className="h-3 w-3 text-orange-400" />
                          ) : (
                            <Clock className="h-3 w-3 text-slate-500" />
                          )}
                          <span
                            className={
                              isOverdue
                                ? "text-red-400 font-medium"
                                : isUrgent
                                ? "text-orange-400 font-medium"
                                : "text-slate-400"
                            }
                          >
                            {isOverdue
                              ? `${Math.abs(daysUntil)} days overdue`
                              : daysUntil === 0
                              ? "Today"
                              : daysUntil === 1
                              ? "Tomorrow"
                              : `${daysUntil} days`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Issues to Resolve */}
      {openIssues.length > 0 && (
        <Card className="bg-slate-800 border-slate-700 border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Issues to Resolve
              <Badge className="bg-red-500/20 text-red-400 ml-2">
                {openIssues.length}
              </Badge>
            </CardTitle>
            <Link href={`/deals/${deal.id}?tab=issues`}>
              <Button variant="ghost" size="sm" className="text-sm text-slate-400 hover:text-white">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {openIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    issue.priority === "CRITICAL"
                      ? "border-red-500/50 bg-red-500/10"
                      : issue.priority === "HIGH"
                      ? "border-orange-500/50 bg-orange-500/10"
                      : "border-slate-700 hover:bg-slate-700/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-white">{issue.title}</p>
                        <Badge className={issuePriorityColors[issue.priority]}>
                          {issue.priority}
                        </Badge>
                        <Badge className={issueStatusColors[issue.status]}>
                          {issue.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {issue.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {issue.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2 text-white">
            <DollarSign className="h-5 w-5 text-green-400" />
            Financial Summary
          </CardTitle>
          <Link href={`/deals/${deal.id}?tab=financials`}>
            <Button variant="ghost" size="sm" className="text-sm text-slate-400 hover:text-white">
              View Details
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-slate-700/50">
              <p className="text-xs text-slate-400">Contract Price</p>
              <p className="text-lg font-bold text-white">
                {contractPrice > 0 ? formatCurrency(contractPrice) : "—"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/50">
              <p className="text-xs text-slate-400">Credits</p>
              <p className="text-lg font-bold text-blue-400">
                {totalCredits > 0 ? formatCurrency(totalCredits) : "—"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/50">
              <p className="text-xs text-slate-400">Debits</p>
              <p className="text-lg font-bold text-orange-400">
                {totalDebits > 0 ? formatCurrency(totalDebits) : "—"}
              </p>
            </div>
          </div>

          {/* Deposits Breakdown */}
          <div className="mt-4 p-3 rounded-lg bg-slate-700/30 border border-slate-600">
            <p className="text-xs text-slate-400 mb-2">Earnest Money Deposits</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-base font-bold text-white">
                  {totalDeposits > 0 ? formatCurrency(totalDeposits) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Paid</p>
                <p className="text-base font-bold text-green-400">
                  {depositsPaid > 0 ? formatCurrency(depositsPaid) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Scheduled</p>
                <p className="text-base font-bold text-yellow-400">
                  {depositsScheduled > 0 ? formatCurrency(depositsScheduled) : "—"}
                </p>
              </div>
            </div>
          </div>

          {contractPrice > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-slate-700/30 border border-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Estimated Balance Due at Closing</span>
                <span className="text-xl font-bold text-white">
                  {formatCurrency(contractPrice - depositsPaid - totalCredits + totalDebits)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Analysis Section */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg text-white">Contract Summary</CardTitle>
          <div className="flex gap-2">
            {summary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAnalysisComplete}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            )}
            {primaryContract ? (
              <AnalyzeButton
                dealId={deal.id}
                documentId={primaryContract.id}
                documentName={primaryContract.name}
                onAnalysisComplete={handleAnalysisComplete}
              />
            ) : (
              <p className="text-sm text-slate-400">
                Upload a contract and mark it as primary to analyze
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <TransactionSummary summary={summary || null} />
        </CardContent>
      </Card>

      {/* Property Details */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white">Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {deal.propertyName && (
              <div>
                <p className="text-sm text-slate-400">Property Name</p>
                <p className="font-medium text-white">{deal.propertyName}</p>
              </div>
            )}
            {deal.propertyType && (
              <div>
                <p className="text-sm text-slate-400">Property Type</p>
                <p className="font-medium text-white">{deal.propertyType}</p>
              </div>
            )}
            {deal.propertyAddress && (
              <div className="col-span-2">
                <p className="text-sm text-slate-400">Address</p>
                <p className="font-medium text-white">
                  {deal.propertyAddress}
                  {deal.propertyCity && `, ${deal.propertyCity}`}
                  {deal.propertyState && `, ${deal.propertyState}`}
                  {deal.propertyZip && ` ${deal.propertyZip}`}
                </p>
              </div>
            )}
            {deal.acreage && (
              <div>
                <p className="text-sm text-slate-400">Acreage</p>
                <p className="font-medium text-white">{Number(deal.acreage).toFixed(2)} acres</p>
              </div>
            )}
            {deal.squareFootage && (
              <div>
                <p className="text-sm text-slate-400">Square Footage</p>
                <p className="font-medium text-white">
                  {Number(deal.squareFootage).toLocaleString()} SF
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
