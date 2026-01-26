"use client"

import { useState } from "react"
import { ContractAnalysisResult, ChecklistItem, calculateDependentDates } from "@/types/analysis"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImportMilestonesDialog } from "./ImportMilestonesDialog"
import {
  Building2,
  DollarSign,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Users,
  MapPin,
  Download,
  CalendarPlus,
  ClipboardList,
  Clock,
  FileInput,
  Loader2,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface AnalysisResultsProps {
  analysis: ContractAnalysisResult
  analyzedAt?: string
  dealId: string
  documentId: string
  onAnalysisUpdate?: (analysis: ContractAnalysisResult) => void
}

export function AnalysisResults({
  analysis,
  analyzedAt,
  dealId,
  documentId,
  onAnalysisUpdate
}: AnalysisResultsProps) {
  const [effectiveDateInput, setEffectiveDateInput] = useState("")
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSavingHtml, setIsSavingHtml] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isImportingToDeal, setIsImportingToDeal] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return "Not specified"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500/20 text-green-400"
    if (confidence >= 0.6) return "bg-yellow-500/20 text-yellow-400"
    return "bg-red-500/20 text-red-400"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500/20 text-red-400"
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400"
      case "LOW":
        return "bg-blue-500/20 text-blue-400"
      default:
        return "bg-slate-500/20 text-slate-400"
    }
  }

  const handleCalculateDates = () => {
    if (!effectiveDateInput) return
    setIsCalculating(true)
    try {
      const effectiveDate = new Date(effectiveDateInput)
      const updatedAnalysis = calculateDependentDates(analysis, effectiveDate)
      onAnalysisUpdate?.(updatedAnalysis)
    } catch (error) {
      console.error("Error calculating dates:", error)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleSaveAsHtml = async () => {
    setIsSavingHtml(true)
    try {
      const response = await fetch(
        `/api/deals/${dealId}/documents/${documentId}/analyze/export-html`,
        { method: "POST" }
      )
      if (response.ok) {
        const data = await response.json()
        window.open(`/api/deals/${dealId}/documents/${data.documentId}/download`, "_blank")
      }
    } catch (error) {
      console.error("Error saving HTML:", error)
    } finally {
      setIsSavingHtml(false)
    }
  }

  const handleImportComplete = (count: number) => {
    alert(`Successfully imported ${count} milestone${count !== 1 ? "s" : ""}!`)
  }

  const handleImportToDeal = async () => {
    setIsImportingToDeal(true)
    try {
      const response = await fetch(`/api/deals/${dealId}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: analysis }),
      })

      if (response.ok) {
        alert("Analysis imported to deal successfully! View the Transaction Summary tab to see the details.")
      } else {
        throw new Error("Failed to import")
      }
    } catch (error) {
      alert("Failed to import analysis to deal")
    } finally {
      setIsImportingToDeal(false)
    }
  }

  // Check if there are any dates to import
  const hasImportableDates = !!(
    analysis.keyMilestones?.some(m => m.date) ||
    analysis.effectiveDate ||
    analysis.feasibilityExpiration ||
    analysis.closingDate ||
    analysis.outsideClosingDate ||
    analysis.titleCommitmentDate ||
    analysis.surveyDate ||
    analysis.deposits?.some(d => d.dueDate)
  )

  const renderChecklistTable = (items: ChecklistItem[] | undefined, title: string) => {
    if (!items || items.length === 0) return null

    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
            <ClipboardList className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Item</TableHead>
                <TableHead className="w-24 text-slate-300">Responsible</TableHead>
                <TableHead className="w-40 text-slate-300">Deadline</TableHead>
                <TableHead className="w-28 text-slate-300">Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx} className={`border-slate-700 ${item.isCritical ? "bg-red-500/10" : ""}`}>
                  <TableCell className="text-white">
                    <div className="flex items-center gap-2">
                      {item.isCritical && (
                        <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                      )}
                      <span>{item.item}</span>
                    </div>
                    {item.contractReference && (
                      <span className="text-xs text-slate-400">
                        Ref: {item.contractReference}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={item.responsible === "BUYER" ? "bg-blue-500/20 text-blue-400" : "bg-slate-600 text-slate-200"}>
                      {item.responsible}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {item.deadline ? (
                      formatDate(item.deadline)
                    ) : item.deadlineDays ? (
                      <span className="text-slate-400">
                        {item.deadlineDays} days from {item.deadlineFromEvent || "effective date"}
                      </span>
                    ) : (
                      <span className="text-slate-500">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">{item.category}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  const hasMissingDates = analysis.missingDateDependencies && analysis.missingDateDependencies.length > 0
  const needsEffectiveDate = hasMissingDates &&
    analysis.missingDateDependencies?.some(dep => dep.dependsOn === "effectiveDate")

  return (
    <div className="space-y-6">
      {/* Header with confidence and actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Contract Analysis</h3>
          {analyzedAt && (
            <p className="text-sm text-slate-400">
              Analyzed on {formatDate(analyzedAt)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getConfidenceColor(analysis.confidence)}>
            {Math.round(analysis.confidence * 100)}% Confidence
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAsHtml}
            disabled={isSavingHtml}
          >
            <Download className="mr-2 h-4 w-4" />
            {isSavingHtml ? "Saving..." : "Save as HTML"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportDialogOpen(true)}
            disabled={!hasImportableDates}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Import to Milestones
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleImportToDeal}
            disabled={isImportingToDeal}
          >
            {isImportingToDeal ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileInput className="mr-2 h-4 w-4" />
            )}
            Import to Deal
          </Button>
        </div>
      </div>

      {/* Missing Date Dependencies - Prominently displayed */}
      {hasMissingDates && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
              <Clock className="h-4 w-4 text-amber-400" />
              Missing Trigger Dates
            </CardTitle>
            <CardDescription className="text-amber-300/70">
              Enter the trigger dates below to auto-calculate dependent deadlines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trigger Date Input Section */}
            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="effectiveDate" className="text-slate-300">Effective Date (Primary Trigger)</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={effectiveDateInput}
                    onChange={(e) => setEffectiveDateInput(e.target.value)}
                    className="mt-1 bg-slate-700 border-slate-600 text-white [color-scheme:dark]"
                  />
                </div>
                <Button
                  onClick={handleCalculateDates}
                  disabled={!effectiveDateInput || isCalculating}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  {isCalculating ? "Calculating..." : "Calculate All Dates"}
                </Button>
              </div>
            </div>

            {/* Dependencies Table */}
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Field</TableHead>
                  <TableHead className="text-slate-300">Depends On</TableHead>
                  <TableHead className="text-slate-300">Days</TableHead>
                  <TableHead className="text-slate-300">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.missingDateDependencies?.map((dep, idx) => (
                  <TableRow key={idx} className="border-slate-700">
                    <TableCell className="font-medium text-white">{dep.field}</TableCell>
                    <TableCell className="text-slate-300">{dep.dependsOn}</TableCell>
                    <TableCell className="text-slate-300">+{dep.daysFromTrigger}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(dep.priority)}>
                        {dep.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-amber-300/80">
              {analysis.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Checklists in Accordion */}
      <Accordion type="multiple" defaultValue={["pre-feasibility", "pre-closing"]} className="space-y-4">
        {analysis.preFeasibilityChecklist && analysis.preFeasibilityChecklist.length > 0 && (
          <AccordionItem value="pre-feasibility" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span>Pre-Feasibility Checklist ({analysis.preFeasibilityChecklist.length} items)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {renderChecklistTable(analysis.preFeasibilityChecklist, "Items to Complete Before Feasibility Period Ends")}
            </AccordionContent>
          </AccordionItem>
        )}

        {analysis.preClosingChecklist && analysis.preClosingChecklist.length > 0 && (
          <AccordionItem value="pre-closing" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span>Pre-Closing Checklist ({analysis.preClosingChecklist.length} items)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {renderChecklistTable(analysis.preClosingChecklist, "Items to Complete Before Closing")}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Parties */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
            <Users className="h-4 w-4 text-purple-400" />
            Parties
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-slate-400 uppercase">Buyer</p>
            <p className="font-medium text-white">{analysis.buyer.name}</p>
            {analysis.buyer.entityType && (
              <p className="text-sm text-slate-400">{analysis.buyer.entityType}</p>
            )}
            {analysis.buyer.state && (
              <p className="text-sm text-slate-400">{analysis.buyer.state}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Seller</p>
            <p className="font-medium text-white">{analysis.seller.name}</p>
            {analysis.seller.entityType && (
              <p className="text-sm text-slate-400">{analysis.seller.entityType}</p>
            )}
            {analysis.seller.state && (
              <p className="text-sm text-slate-400">{analysis.seller.state}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Property */}
      {analysis.propertyAddress && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
              <MapPin className="h-4 w-4 text-blue-400" />
              Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-white">{analysis.propertyAddress}</p>
            <p className="text-sm text-slate-400">
              {[analysis.propertyCity, analysis.propertyState, analysis.propertyCounty]
                .filter(Boolean)
                .join(", ")}
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              {analysis.acreage && (
                <span className="text-slate-400">{analysis.acreage} acres</span>
              )}
              {analysis.squareFootage && (
                <span className="text-slate-400">
                  {analysis.squareFootage.toLocaleString()} SF
                </span>
              )}
              {analysis.lotCount && (
                <span className="text-slate-400">{analysis.lotCount} lots</span>
              )}
              {analysis.unitCount && (
                <span className="text-slate-400">{analysis.unitCount} units</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
            <DollarSign className="h-4 w-4 text-green-400" />
            Financial Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-slate-400 uppercase">Purchase Price</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(analysis.purchasePrice)}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-400">
              {analysis.pricePerAcre && (
                <span>{formatCurrency(analysis.pricePerAcre)}/acre</span>
              )}
              {analysis.pricePerSquareFoot && (
                <span>{formatCurrency(analysis.pricePerSquareFoot)}/SF</span>
              )}
              {analysis.pricePerUnit && (
                <span>{formatCurrency(analysis.pricePerUnit)}/unit</span>
              )}
            </div>
            {analysis.priceAdjustable && (
              <Badge variant="outline" className="mt-2 border-amber-500/50 text-amber-400">
                Price Adjustable: {analysis.priceAdjustmentBasis || "Yes"}
              </Badge>
            )}
          </div>

          {analysis.deposits.length > 0 && (
            <>
              <Separator className="bg-slate-700" />
              <div>
                <p className="text-xs text-slate-400 uppercase mb-2">Deposits</p>
                <div className="space-y-2">
                  {analysis.deposits.map((deposit, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-white">{deposit.name}</p>
                        {deposit.dueDate && (
                          <p className="text-sm text-slate-400">
                            Due: {formatDate(deposit.dueDate)}
                          </p>
                        )}
                        {deposit.dueDays && !deposit.dueDate && (
                          <p className="text-sm text-slate-400">
                            Due: {deposit.dueDays} days from {deposit.dueFromEvent || "effective date"}
                          </p>
                        )}
                        {deposit.refundable !== undefined && (
                          <p className="text-xs text-slate-500">
                            {deposit.refundable
                              ? `Refundable${deposit.refundableUntil ? ` until ${deposit.refundableUntil}` : ""}`
                              : "Non-refundable"}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold text-white">{formatCurrency(deposit.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Key Dates */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
            <Calendar className="h-4 w-4 text-blue-400" />
            Key Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-slate-400 uppercase">Effective Date</p>
              <p className={`font-medium ${!analysis.effectiveDate ? "text-amber-400" : "text-white"}`}>
                {analysis.effectiveDate ? formatDate(analysis.effectiveDate) : "Not yet determined"}
              </p>
              {analysis.effectiveDateTrigger && (
                <p className="text-xs text-slate-500">
                  Trigger: {analysis.effectiveDateTrigger}
                </p>
              )}
            </div>
            {analysis.feasibilityPeriodDays && (
              <div>
                <p className="text-xs text-slate-400 uppercase">Feasibility Period</p>
                <p className="font-medium text-white">{analysis.feasibilityPeriodDays} days</p>
                {analysis.feasibilityExpiration && (
                  <p className="text-sm text-slate-400">
                    Expires: {formatDate(analysis.feasibilityExpiration)}
                  </p>
                )}
              </div>
            )}
            {(analysis.closingDate || analysis.closingDateDays) && (
              <div>
                <p className="text-xs text-slate-400 uppercase">Closing Date</p>
                {analysis.closingDate ? (
                  <p className="font-medium text-white">{formatDate(analysis.closingDate)}</p>
                ) : (
                  <p className="font-medium text-white">
                    {analysis.closingDateDays} days from {analysis.closingDateFromEvent || "effective date"}
                  </p>
                )}
              </div>
            )}
            {analysis.outsideClosingDate && (
              <div>
                <p className="text-xs text-slate-400 uppercase">Outside Closing Date</p>
                <p className="font-medium text-white">{formatDate(analysis.outsideClosingDate)}</p>
              </div>
            )}
          </div>

          {/* Title & Survey Timeline */}
          {(analysis.titleCommitmentDays || analysis.surveyDays) && (
            <>
              <Separator className="my-4 bg-slate-700" />
              <div className="grid gap-4 md:grid-cols-2">
                {analysis.titleCommitmentDays && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Title Commitment</p>
                    <p className="font-medium text-white">{analysis.titleCommitmentDays} days</p>
                    {analysis.titleCommitmentDate && (
                      <p className="text-sm text-slate-400">
                        Due: {formatDate(analysis.titleCommitmentDate)}
                      </p>
                    )}
                  </div>
                )}
                {analysis.surveyDays && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Survey</p>
                    <p className="font-medium text-white">{analysis.surveyDays} days</p>
                    {analysis.surveyDate && (
                      <p className="text-sm text-slate-400">
                        Due: {formatDate(analysis.surveyDate)}
                      </p>
                    )}
                  </div>
                )}
                {analysis.titleObjectionDays && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Title Objection Period</p>
                    <p className="font-medium text-white">{analysis.titleObjectionDays} days</p>
                  </div>
                )}
                {analysis.titleCureDays && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Title Cure Period</p>
                    <p className="font-medium text-white">{analysis.titleCureDays} days</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Key Milestones */}
      {analysis.keyMilestones && analysis.keyMilestones.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
              <CalendarPlus className="h-4 w-4 text-blue-400" />
              Key Milestones ({analysis.keyMilestones.length})
            </CardTitle>
            <CardDescription className="text-slate-400">
              These milestones can be imported into your deal timeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Milestone</TableHead>
                  <TableHead className="text-slate-300">Date</TableHead>
                  <TableHead className="text-slate-300">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.keyMilestones.map((milestone, idx) => (
                  <TableRow key={idx} className="border-slate-700">
                    <TableCell>
                      <div className="font-medium text-white">{milestone.name}</div>
                      {milestone.description && (
                        <div className="text-xs text-slate-400">{milestone.description}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {milestone.date
                        ? formatDate(milestone.date)
                        : milestone.daysFromEffective
                          ? `${milestone.daysFromEffective} days from effective`
                          : "TBD"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">{milestone.category}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Contingencies */}
      {analysis.contingencies.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
              <FileText className="h-4 w-4 text-amber-400" />
              Contingencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.contingencies.map((contingency, idx) => (
                <div key={idx} className="border-l-2 border-blue-500 pl-3">
                  <p className="font-medium text-white">{contingency.name}</p>
                  <p className="text-sm text-slate-400">{contingency.description}</p>
                  {contingency.deadline ? (
                    <p className="text-sm text-slate-400 mt-1">
                      Deadline: {formatDate(contingency.deadline)}
                    </p>
                  ) : contingency.deadlineDays ? (
                    <p className="text-sm text-slate-400 mt-1">
                      Deadline: {contingency.deadlineDays} days from {contingency.deadlineFromEvent || "effective date"}
                    </p>
                  ) : null}
                  {contingency.consequence && (
                    <p className="text-sm text-amber-400 mt-1">
                      Consequence: {contingency.consequence}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due Diligence Items */}
      {analysis.dueDiligenceItems.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Due Diligence Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.dueDiligenceItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Badge className={item.responsible === "BUYER" ? "bg-blue-500/20 text-blue-400" : "bg-slate-600 text-slate-200"}>
                    {item.responsible}
                  </Badge>
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-slate-400">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Special Provisions */}
      {analysis.specialProvisions && analysis.specialProvisions.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Special Provisions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
              {analysis.specialProvisions.map((provision, idx) => (
                <li key={idx}>{provision}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Title Company & Escrow */}
      {(analysis.titleCompany || analysis.escrowAgent) && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
              <Building2 className="h-4 w-4 text-blue-400" />
              Title & Escrow
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {analysis.titleCompany && (
              <div>
                <p className="text-xs text-slate-400 uppercase">Title Company</p>
                <p className="font-medium text-white">{analysis.titleCompany}</p>
              </div>
            )}
            {analysis.escrowAgent && (
              <div>
                <p className="text-xs text-slate-400 uppercase">Escrow Agent</p>
                <p className="font-medium text-white">{analysis.escrowAgent}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Post-Closing Obligations */}
      {analysis.postClosingObligations && analysis.postClosingObligations.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Post-Closing Obligations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Obligation</TableHead>
                  <TableHead className="text-slate-300">Responsible</TableHead>
                  <TableHead className="text-slate-300">Deadline</TableHead>
                  <TableHead className="text-slate-300">Survives</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.postClosingObligations.map((obligation, idx) => (
                  <TableRow key={idx} className="border-slate-700">
                    <TableCell className="text-white">{obligation.obligation}</TableCell>
                    <TableCell>
                      <Badge className={obligation.responsible === "BUYER" ? "bg-blue-500/20 text-blue-400" : "bg-slate-600 text-slate-200"}>
                        {obligation.responsible}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{obligation.deadline || "N/A"}</TableCell>
                    <TableCell className="text-slate-300">{obligation.survives || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Import Milestones Dialog */}
      <ImportMilestonesDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        analysis={analysis}
        dealId={dealId}
        documentId={documentId}
        onImportComplete={handleImportComplete}
      />
    </div>
  )
}
