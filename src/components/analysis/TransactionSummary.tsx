"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building,
  Users,
  DollarSign,
  Calendar,
  FileText,
  AlertTriangle,
} from "lucide-react"

interface Deposit {
  name: string
  amount: number
}

interface Contingency {
  name: string
  description?: string
  deadline?: string
}

interface DueDiligenceItem {
  name: string
  responsible: string
}

interface RawAnalysis {
  contingencies?: Contingency[]
  dueDiligenceItems?: DueDiligenceItem[]
  warnings?: string[]
}

interface Summary {
  buyerName?: string | null
  buyerEntity?: string | null
  sellerName?: string | null
  sellerEntity?: string | null
  purchasePrice?: number | null
  priceAdjustable?: boolean | null
  initialDeposit?: number | null
  initialDepositDue?: string | null
  additionalDeposits?: Deposit[] | null
  effectiveDate?: string | null
  closingDate?: string | null
  feasibilityPeriodDays?: number | null
  feasibilityExpiration?: string | null
  titleCompany?: string | null
  escrowAgent?: string | null
  rawAnalysis?: RawAnalysis | null
}

interface TransactionSummaryProps {
  summary: Summary | null
}

export function TransactionSummary({ summary }: TransactionSummaryProps) {
  if (!summary) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-gray-300 mb-2" />
          <p className="text-gray-500">
            No contract has been analyzed yet. Upload a purchase agreement and click &quot;Analyze with AI&quot;.
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const rawAnalysis = summary.rawAnalysis || {}

  return (
    <div className="space-y-6">
      {/* Parties */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Parties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Buyer</p>
              <p className="font-medium">{summary.buyerName || "—"}</p>
              {summary.buyerEntity && (
                <p className="text-sm text-gray-600">{summary.buyerEntity}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Seller</p>
              <p className="font-medium">{summary.sellerName || "—"}</p>
              {summary.sellerEntity && (
                <p className="text-sm text-gray-600">{summary.sellerEntity}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financial Terms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Purchase Price</p>
              <p className="text-xl font-bold">
                {summary.purchasePrice
                  ? formatCurrency(Number(summary.purchasePrice))
                  : "—"}
              </p>
              {summary.priceAdjustable && (
                <Badge variant="outline" className="mt-1">
                  Adjustable
                </Badge>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Initial Deposit</p>
              <p className="text-lg font-semibold">
                {summary.initialDeposit
                  ? formatCurrency(Number(summary.initialDeposit))
                  : "—"}
              </p>
              {summary.initialDepositDue && (
                <p className="text-sm text-gray-600">
                  Due: {formatDate(summary.initialDepositDue)}
                </p>
              )}
            </div>
          </div>

          {/* Additional Deposits */}
          {summary.additionalDeposits && summary.additionalDeposits.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Additional Deposits</p>
              <div className="space-y-2">
                {summary.additionalDeposits.map((deposit: Deposit, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{deposit.name}</span>
                    <span className="font-medium">
                      {formatCurrency(deposit.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Dates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Key Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Effective Date</p>
              <p className="font-medium">{formatDate(summary.effectiveDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Closing Date</p>
              <p className="font-medium">{formatDate(summary.closingDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Feasibility Period</p>
              <p className="font-medium">
                {summary.feasibilityPeriodDays
                  ? `${summary.feasibilityPeriodDays} days`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Feasibility Expires</p>
              <p className="font-medium">
                {formatDate(summary.feasibilityExpiration)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Title & Escrow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-4 w-4" />
            Title & Escrow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Title Company</p>
              <p className="font-medium">{summary.titleCompany || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Escrow Agent</p>
              <p className="font-medium">{summary.escrowAgent || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contingencies */}
      {rawAnalysis.contingencies && rawAnalysis.contingencies.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contingencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rawAnalysis.contingencies.map((c: Contingency, index: number) => (
                <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <p className="font-medium">{c.name}</p>
                    {c.deadline && (
                      <Badge variant="outline">{formatDate(c.deadline)}</Badge>
                    )}
                  </div>
                  {c.description && (
                    <p className="text-sm text-gray-600 mt-1">{c.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due Diligence Items */}
      {rawAnalysis.dueDiligenceItems && rawAnalysis.dueDiligenceItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Due Diligence Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rawAnalysis.dueDiligenceItems.map((item: DueDiligenceItem, index: number) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span>{item.name}</span>
                  <Badge variant={item.responsible === "BUYER" ? "default" : "secondary"}>
                    {item.responsible}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {rawAnalysis.warnings && rawAnalysis.warnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              Analysis Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
              {rawAnalysis.warnings.map((warning: string, index: number) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
