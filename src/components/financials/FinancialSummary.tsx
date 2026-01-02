"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DollarSign, TrendingUp, Receipt } from "lucide-react"

interface Deposit {
  amount: number
  paidAmount: number | null
  status: string
}

interface LineItem {
  estimatedAmount: number | null
  actualAmount: number | null
  category: string
}

interface FinancialSummaryProps {
  contractPrice: number | null
  deposits: Deposit[]
  lineItems: LineItem[]
}

export function FinancialSummary({
  contractPrice,
  deposits,
  lineItems,
}: FinancialSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const price = contractPrice || 0

  // Calculate deposit totals
  const totalDeposits = deposits.reduce((sum, d) => sum + Number(d.amount), 0)
  const paidDeposits = deposits
    .filter((d) => d.status === "PAID" || d.status === "APPLIED_TO_PURCHASE")
    .reduce((sum, d) => sum + Number(d.paidAmount || d.amount), 0)

  // Calculate line item totals by category
  const estimatedClosingCosts = lineItems
    .filter((item) => item.category === "CLOSING_COST")
    .reduce((sum, item) => sum + Number(item.estimatedAmount || 0), 0)

  const actualClosingCosts = lineItems
    .filter((item) => item.category === "CLOSING_COST")
    .reduce((sum, item) => sum + Number(item.actualAmount || 0), 0)

  const estimatedProrations = lineItems
    .filter((item) => item.category === "PRORATION")
    .reduce((sum, item) => sum + Number(item.estimatedAmount || 0), 0)

  const actualProrations = lineItems
    .filter((item) => item.category === "PRORATION")
    .reduce((sum, item) => sum + Number(item.actualAmount || 0), 0)

  const estimatedCredits = lineItems
    .filter((item) => item.category === "CREDIT")
    .reduce((sum, item) => sum + Number(item.estimatedAmount || 0), 0)

  const actualCredits = lineItems
    .filter((item) => item.category === "CREDIT")
    .reduce((sum, item) => sum + Number(item.actualAmount || 0), 0)

  const totalEstimated = lineItems.reduce(
    (sum, item) => sum + Number(item.estimatedAmount || 0),
    0
  )

  const totalActual = lineItems.reduce(
    (sum, item) => sum + Number(item.actualAmount || 0),
    0
  )

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Purchase Summary */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-white">
            <DollarSign className="h-4 w-4 text-blue-400" />
            Purchase Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400">Contract Price</span>
            <span className="font-medium text-white">{formatCurrency(price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total Deposits Required</span>
            <span className="font-medium text-white">{formatCurrency(totalDeposits)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Deposits Paid</span>
            <span className="font-medium text-green-400">
              {formatCurrency(paidDeposits)}
            </span>
          </div>
          <Separator className="bg-slate-700" />
          <div className="flex justify-between text-lg">
            <span className="font-semibold text-white">Balance Due at Closing</span>
            <span className="font-bold text-blue-400">
              {formatCurrency(price - paidDeposits)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Costs Summary */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-white">
            <Receipt className="h-4 w-4 text-green-400" />
            Costs & Adjustments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400">Closing Costs</span>
            <div className="text-right">
              <span className="font-medium text-white">{formatCurrency(actualClosingCosts || estimatedClosingCosts)}</span>
              {actualClosingCosts > 0 && estimatedClosingCosts > 0 && actualClosingCosts !== estimatedClosingCosts && (
                <p className="text-xs text-slate-500">Est: {formatCurrency(estimatedClosingCosts)}</p>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Prorations</span>
            <span className="font-medium text-white">{formatCurrency(actualProrations || estimatedProrations)}</span>
          </div>
          {(estimatedCredits > 0 || actualCredits > 0) && (
            <div className="flex justify-between">
              <span className="text-slate-400">Credits</span>
              <span className="font-medium text-green-400">
                -{formatCurrency(actualCredits || estimatedCredits)}
              </span>
            </div>
          )}
          <Separator className="bg-slate-700" />
          <div className="flex justify-between text-lg">
            <span className="font-semibold text-white">Total Costs</span>
            <span className="font-bold text-white">
              {formatCurrency(totalActual || totalEstimated)}
            </span>
          </div>
          {totalActual > 0 && totalEstimated > 0 && totalActual !== totalEstimated && (
            <p className="text-xs text-slate-500 text-right">
              Estimated: {formatCurrency(totalEstimated)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
