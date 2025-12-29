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

interface TransactionSummaryData {
  buyerName?: string
  sellerName?: string
  purchasePrice?: number
  // Add other fields as needed
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
  acreage?: number | null
  squareFootage?: number | null
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
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {stats.completedTasks}/{stats.tasks}
                </p>
                <p className="text-sm text-gray-500">Tasks Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.documents}</p>
                <p className="text-sm text-gray-500">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.milestones}</p>
                <p className="text-sm text-gray-500">Milestones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{deal.type}</p>
                <p className="text-sm text-gray-500">Deal Type</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Analysis Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Contract Summary</CardTitle>
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
              <p className="text-sm text-gray-500">
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {deal.propertyName && (
              <div>
                <p className="text-sm text-gray-500">Property Name</p>
                <p className="font-medium">{deal.propertyName}</p>
              </div>
            )}
            {deal.propertyType && (
              <div>
                <p className="text-sm text-gray-500">Property Type</p>
                <p className="font-medium">{deal.propertyType}</p>
              </div>
            )}
            {deal.propertyAddress && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">
                  {deal.propertyAddress}
                  {deal.propertyCity && `, ${deal.propertyCity}`}
                  {deal.propertyState && `, ${deal.propertyState}`}
                  {deal.propertyZip && ` ${deal.propertyZip}`}
                </p>
              </div>
            )}
            {deal.acreage && (
              <div>
                <p className="text-sm text-gray-500">Acreage</p>
                <p className="font-medium">{Number(deal.acreage).toFixed(2)} acres</p>
              </div>
            )}
            {deal.squareFootage && (
              <div>
                <p className="text-sm text-gray-500">Square Footage</p>
                <p className="font-medium">
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
