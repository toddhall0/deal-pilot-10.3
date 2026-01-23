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
    if (confidence >= 0.8) return "bg-green-100 text-green-800"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <ClipboardList className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-24">Responsible</TableHead>
                <TableHead className="w-40">Deadline</TableHead>
                <TableHead className="w-28">Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx} className={item.isCritical ? "bg-red-50" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.isCritical && (
                        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                      <span>{item.item}</span>
                    </div>
                    {item.contractReference && (
                      <span className="text-xs text-muted-foreground">
                        Ref: {item.contractReference}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.responsible === "BUYER" ? "default" : "secondary"}>
                      {item.responsible}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.deadline ? (
                      formatDate(item.deadline)
                    ) : item.deadlineDays ? (
                      <span className="text-muted-foreground">
                        {item.deadlineDays} days from {item.deadlineFromEvent || "effective date"}
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
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
          <h3 className="text-lg font-semibold">Contract Analysis</h3>
          {analyzedAt && (
            <p className="text-sm text-muted-foreground">
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
        </div>
      </div>

      {/* Missing Date Dependencies - Prominently displayed */}
      {hasMissingDates && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-yellow-800">
              <Clock className="h-4 w-4" />
              Missing Date Dependencies
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Some dates could not be calculated. Provide the missing trigger date to calculate all dependent deadlines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {needsEffectiveDate && (
              <div className="flex items-end gap-4 p-4 bg-white rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="effectiveDate">Effective Date</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={effectiveDateInput}
                    onChange={(e) => setEffectiveDateInput(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleCalculateDates}
                  disabled={!effectiveDateInput || isCalculating}
                >
                  {isCalculating ? "Calculating..." : "Calculate All Dates"}
                </Button>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Depends On</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.missingDateDependencies?.map((dep, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{dep.field}</TableCell>
                    <TableCell>{dep.dependsOn}</TableCell>
                    <TableCell>{dep.daysFromTrigger}</TableCell>
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
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Parties
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Buyer</p>
            <p className="font-medium">{analysis.buyer.name}</p>
            {analysis.buyer.entityType && (
              <p className="text-sm text-muted-foreground">{analysis.buyer.entityType}</p>
            )}
            {analysis.buyer.state && (
              <p className="text-sm text-muted-foreground">{analysis.buyer.state}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Seller</p>
            <p className="font-medium">{analysis.seller.name}</p>
            {analysis.seller.entityType && (
              <p className="text-sm text-muted-foreground">{analysis.seller.entityType}</p>
            )}
            {analysis.seller.state && (
              <p className="text-sm text-muted-foreground">{analysis.seller.state}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Property */}
      {analysis.propertyAddress && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{analysis.propertyAddress}</p>
            <p className="text-sm text-muted-foreground">
              {[analysis.propertyCity, analysis.propertyState, analysis.propertyCounty]
                .filter(Boolean)
                .join(", ")}
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              {analysis.acreage && (
                <span className="text-muted-foreground">{analysis.acreage} acres</span>
              )}
              {analysis.squareFootage && (
                <span className="text-muted-foreground">
                  {analysis.squareFootage.toLocaleString()} SF
                </span>
              )}
              {analysis.lotCount && (
                <span className="text-muted-foreground">{analysis.lotCount} lots</span>
              )}
              {analysis.unitCount && (
                <span className="text-muted-foreground">{analysis.unitCount} units</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="h-4 w-4" />
            Financial Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Purchase Price</p>
            <p className="text-2xl font-bold">{formatCurrency(analysis.purchasePrice)}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
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
              <Badge variant="outline" className="mt-2">
                Price Adjustable: {analysis.priceAdjustmentBasis || "Yes"}
              </Badge>
            )}
          </div>

          {analysis.deposits.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-2">Deposits</p>
                <div className="space-y-2">
                  {analysis.deposits.map((deposit, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{deposit.name}</p>
                        {deposit.dueDate && (
                          <p className="text-sm text-muted-foreground">
                            Due: {formatDate(deposit.dueDate)}
                          </p>
                        )}
                        {deposit.dueDays && !deposit.dueDate && (
                          <p className="text-sm text-muted-foreground">
                            Due: {deposit.dueDays} days from {deposit.dueFromEvent || "effective date"}
                          </p>
                        )}
                        {deposit.refundable !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            {deposit.refundable
                              ? `Refundable${deposit.refundableUntil ? ` until ${deposit.refundableUntil}` : ""}`
                              : "Non-refundable"}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold">{formatCurrency(deposit.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Key Dates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Key Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Effective Date</p>
              <p className={`font-medium ${!analysis.effectiveDate ? "text-yellow-600" : ""}`}>
                {analysis.effectiveDate ? formatDate(analysis.effectiveDate) : "Not yet determined"}
              </p>
              {analysis.effectiveDateTrigger && (
                <p className="text-xs text-muted-foreground">
                  Trigger: {analysis.effectiveDateTrigger}
                </p>
              )}
            </div>
            {analysis.feasibilityPeriodDays && (
              <div>
                <p className="text-xs text-muted-foreground uppercase">Feasibility Period</p>
                <p className="font-medium">{analysis.feasibilityPeriodDays} days</p>
                {analysis.feasibilityExpiration && (
                  <p className="text-sm text-muted-foreground">
                    Expires: {formatDate(analysis.feasibilityExpiration)}
                  </p>
                )}
              </div>
            )}
            {(analysis.closingDate || analysis.closingDateDays) && (
              <div>
                <p className="text-xs text-muted-foreground uppercase">Closing Date</p>
                {analysis.closingDate ? (
                  <p className="font-medium">{formatDate(analysis.closingDate)}</p>
                ) : (
                  <p className="font-medium">
                    {analysis.closingDateDays} days from {analysis.closingDateFromEvent || "effective date"}
                  </p>
                )}
              </div>
            )}
            {analysis.outsideClosingDate && (
              <div>
                <p className="text-xs text-muted-foreground uppercase">Outside Closing Date</p>
                <p className="font-medium">{formatDate(analysis.outsideClosingDate)}</p>
              </div>
            )}
          </div>

          {/* Title & Survey Timeline */}
          {(analysis.titleCommitmentDays || analysis.surveyDays) && (
            <>
              <Separator className="my-4" />
              <div className="grid gap-4 md:grid-cols-2">
                {analysis.titleCommitmentDays && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Title Commitment</p>
                    <p className="font-medium">{analysis.titleCommitmentDays} days</p>
                    {analysis.titleCommitmentDate && (
                      <p className="text-sm text-muted-foreground">
                        Due: {formatDate(analysis.titleCommitmentDate)}
                      </p>
                    )}
                  </div>
                )}
                {analysis.surveyDays && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Survey</p>
                    <p className="font-medium">{analysis.surveyDays} days</p>
                    {analysis.surveyDate && (
                      <p className="text-sm text-muted-foreground">
                        Due: {formatDate(analysis.surveyDate)}
                      </p>
                    )}
                  </div>
                )}
                {analysis.titleObjectionDays && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Title Objection Period</p>
                    <p className="font-medium">{analysis.titleObjectionDays} days</p>
                  </div>
                )}
                {analysis.titleCureDays && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Title Cure Period</p>
                    <p className="font-medium">{analysis.titleCureDays} days</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Key Milestones */}
      {analysis.keyMilestones && analysis.keyMilestones.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CalendarPlus className="h-4 w-4" />
              Key Milestones ({analysis.keyMilestones.length})
            </CardTitle>
            <CardDescription>
              These milestones can be imported into your deal timeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.keyMilestones.map((milestone, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="font-medium">{milestone.name}</div>
                      {milestone.description && (
                        <div className="text-xs text-muted-foreground">{milestone.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {milestone.date
                        ? formatDate(milestone.date)
                        : milestone.daysFromEffective
                          ? `${milestone.daysFromEffective} days from effective`
                          : "TBD"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{milestone.category}</Badge>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Contingencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.contingencies.map((contingency, idx) => (
                <div key={idx} className="border-l-2 border-primary pl-3">
                  <p className="font-medium">{contingency.name}</p>
                  <p className="text-sm text-muted-foreground">{contingency.description}</p>
                  {contingency.deadline ? (
                    <p className="text-sm text-muted-foreground mt-1">
                      Deadline: {formatDate(contingency.deadline)}
                    </p>
                  ) : contingency.deadlineDays ? (
                    <p className="text-sm text-muted-foreground mt-1">
                      Deadline: {contingency.deadlineDays} days from {contingency.deadlineFromEvent || "effective date"}
                    </p>
                  ) : null}
                  {contingency.consequence && (
                    <p className="text-sm text-yellow-600 mt-1">
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Due Diligence Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.dueDiligenceItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Badge variant={item.responsible === "BUYER" ? "default" : "secondary"}>
                    {item.responsible}
                  </Badge>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Special Provisions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {analysis.specialProvisions.map((provision, idx) => (
                <li key={idx}>{provision}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Title Company & Escrow */}
      {(analysis.titleCompany || analysis.escrowAgent) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4" />
              Title & Escrow
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {analysis.titleCompany && (
              <div>
                <p className="text-xs text-muted-foreground uppercase">Title Company</p>
                <p className="font-medium">{analysis.titleCompany}</p>
              </div>
            )}
            {analysis.escrowAgent && (
              <div>
                <p className="text-xs text-muted-foreground uppercase">Escrow Agent</p>
                <p className="font-medium">{analysis.escrowAgent}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Post-Closing Obligations */}
      {analysis.postClosingObligations && analysis.postClosingObligations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Post-Closing Obligations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Obligation</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Survives</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.postClosingObligations.map((obligation, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{obligation.obligation}</TableCell>
                    <TableCell>
                      <Badge variant={obligation.responsible === "BUYER" ? "default" : "secondary"}>
                        {obligation.responsible}
                      </Badge>
                    </TableCell>
                    <TableCell>{obligation.deadline || "N/A"}</TableCell>
                    <TableCell>{obligation.survives || "N/A"}</TableCell>
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
