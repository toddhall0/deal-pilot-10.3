"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TransactionSummary } from "@/components/analysis/TransactionSummary"
import { AnalyzeButton } from "@/components/analysis/AnalyzeButton"
import {
  Building,
  FileText,
  CheckSquare,
  Calendar,
  RefreshCw,
} from "lucide-react"

interface Document {
  id: string
  name: string
  isPrimaryContract: boolean
}

interface Task {
  status: string
}

// Using a flexible type to accommodate Prisma's Decimal type
type DecimalLike = number | { toNumber(): number } | null

interface TransactionSummaryData {
  buyerName?: string | null
  sellerName?: string | null
  purchasePrice?: DecimalLike
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
  timeline?: {
    milestones?: unknown[]
  } | null
  transactionSummary?: TransactionSummaryData | null
}

interface OverviewTabProps {
  deal: Deal
}

export function OverviewTab({ deal }: OverviewTabProps) {
  const [summary, setSummary] = useState(deal.transactionSummary)
  const [primaryContract, setPrimaryContract] = useState<Document | null>(null)

  useEffect(() => {
    // Find primary contract document
    const contract = deal.documents?.find((d: Document) => d.isPrimaryContract)
    setPrimaryContract(contract || null)
  }, [deal.documents])

  const handleAnalysisComplete = async () => {
    // Refresh summary
    const response = await fetch(`/api/deals/${deal.id}/summary`)
    if (response.ok) {
      const data = await response.json()
      setSummary(data)
    }
  }

  const stats = {
    tasks: deal.tasks?.length || 0,
    completedTasks: deal.tasks?.filter((t: Task) => t.status === "COMPLETED").length || 0,
    documents: deal.documents?.length || 0,
    milestones: deal.timeline?.milestones?.length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
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
        <Card className="bg-slate-900 border-slate-800">
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
        <Card className="bg-slate-900 border-slate-800">
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
        <Card className="bg-slate-900 border-slate-800">
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

      {/* Contract Analysis Section */}
      <Card className="bg-slate-900 border-slate-800">
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
      <Card className="bg-slate-900 border-slate-800">
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
