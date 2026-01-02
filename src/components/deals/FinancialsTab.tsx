"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { DepositsManager } from "@/components/financials/DepositsManager"
import { LineItemsManager } from "@/components/financials/LineItemsManager"
import { FinancialSummary } from "@/components/financials/FinancialSummary"
import { DollarSign, Save, Loader2 } from "lucide-react"

interface FinancialsTabProps {
  dealId: string
}

export function FinancialsTab({ dealId }: FinancialsTabProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [financials, setFinancials] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [contractPrice, setContractPrice] = useState("")

  useEffect(() => {
    fetchFinancials()
  }, [dealId])

  async function fetchFinancials() {
    try {
      const response = await fetch(`/api/deals/${dealId}/financials`)
      const data = await response.json()
      setFinancials(data)
      setContractPrice(data.contractPrice?.toString() || "")
    } catch (error) {
      console.error("Failed to fetch financials:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveContractPrice() {
    setIsSaving(true)
    try {
      await fetch(`/api/deals/${dealId}/financials`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractPrice: parseFloat(contractPrice) || 0,
        }),
      })
      fetchFinancials()
    } catch (error) {
      console.error("Failed to save:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return <div className="p-4">Loading financials...</div>
  }

  const price = parseFloat(contractPrice) || 0

  return (
    <div className="space-y-6">
      {/* Contract Price */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-white">
            <DollarSign className="h-4 w-4" />
            Contract Price
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="contractPrice" className="text-slate-300">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                <Input
                  id="contractPrice"
                  type="number"
                  value={contractPrice}
                  onChange={(e) => setContractPrice(e.target.value)}
                  className="pl-7 bg-slate-800 border-slate-700 text-white"
                  placeholder="0"
                />
              </div>
            </div>
            <Button onClick={handleSaveContractPrice} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
          {price > 0 && (
            <p className="mt-2 text-lg font-semibold text-white">
              {formatCurrency(price)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary */}
      {price > 0 && (
        <FinancialSummary
          contractPrice={price}
          deposits={financials?.deposits || []}
          lineItems={financials?.lineItems || []}
        />
      )}

      {/* Deposits */}
      <DepositsManager
        dealId={dealId}
        deposits={financials?.deposits || []}
        onUpdate={fetchFinancials}
      />

      {/* Line Items */}
      <LineItemsManager
        dealId={dealId}
        lineItems={financials?.lineItems || []}
        onUpdate={fetchFinancials}
      />
    </div>
  )
}
