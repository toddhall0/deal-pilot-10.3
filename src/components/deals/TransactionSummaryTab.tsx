"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Calendar,
  DollarSign,
  Users,
  Building,
  FileText,
  Clock,
  CalendarPlus,
  Save,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TransactionSummary {
  id: string
  dealId: string
  contractDate: string | null
  effectiveDate: string | null
  buyerName: string | null
  buyerEntity: string | null
  buyerAddress: string | null
  sellerName: string | null
  sellerEntity: string | null
  sellerAddress: string | null
  purchasePrice: number | null
  pricePerUnit: number | null
  priceAdjustable: boolean
  priceAdjustmentBasis: string | null
  initialDeposit: number | null
  initialDepositDue: string | null
  additionalDeposits: Deposit[] | null
  feasibilityPeriodDays: number | null
  feasibilityExpiration: string | null
  closingDate: string | null
  outsideClosingDate: string | null
  titleCompany: string | null
  escrowAgent: string | null
  surveyRequirements: string | null
  contingencies: Contingency[] | null
  specialProvisions: string[] | null
  rawAnalysis: RawAnalysis | null
  version: number
  analyzedAt: string
}

interface Deposit {
  name: string
  amount: number
  dueDate?: string
  dueDays?: number
  refundable?: boolean
}

interface Contingency {
  name: string
  description: string
  deadline?: string
  deadlineDays?: number
}

interface RawAnalysis {
  titleCommitmentDays?: number
  surveyDays?: number
  titleObjectionDays?: number
  titleCureDays?: number
  closingDateDays?: number
  titleCommitmentDate?: string
  surveyDate?: string
  titleObjectionDate?: string
  keyMilestones?: KeyMilestone[]
}

interface KeyMilestone {
  name: string
  date?: string
  daysFromEffective?: number
  category: string
  description?: string
}

interface EditableDates {
  effectiveDate: string
  feasibilityExpiration: string
  closingDate: string
  outsideClosingDate: string
  initialDepositDue: string
  titleCommitmentDate: string
  surveyDate: string
  titleObjectionDate: string
}

interface TransactionSummaryTabProps {
  dealId: string
}

export function TransactionSummaryTab({ dealId }: TransactionSummaryTabProps) {
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [editableDates, setEditableDates] = useState<EditableDates>({
    effectiveDate: "",
    feasibilityExpiration: "",
    closingDate: "",
    outsideClosingDate: "",
    initialDepositDue: "",
    titleCommitmentDate: "",
    surveyDate: "",
    titleObjectionDate: "",
  })
  const { toast } = useToast()

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`/api/deals/${dealId}/summary`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
        if (data) {
          setEditableDates({
            effectiveDate: formatDateForInput(data.effectiveDate),
            feasibilityExpiration: formatDateForInput(data.feasibilityExpiration),
            closingDate: formatDateForInput(data.closingDate),
            outsideClosingDate: formatDateForInput(data.outsideClosingDate),
            initialDepositDue: formatDateForInput(data.initialDepositDue),
            titleCommitmentDate: formatDateForInput(data.rawAnalysis?.titleCommitmentDate),
            surveyDate: formatDateForInput(data.rawAnalysis?.surveyDate),
            titleObjectionDate: formatDateForInput(data.rawAnalysis?.titleObjectionDate),
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch transaction summary:", error)
    } finally {
      setIsLoading(false)
    }
  }, [dealId])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const formatDateForInput = (date: string | null | undefined): string => {
    if (!date) return ""
    try {
      return new Date(date).toISOString().split("T")[0]
    } catch {
      return ""
    }
  }

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return "Not set"
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return "Invalid date"
    }
  }

  const formatCurrency = (amount: number | null | undefined): string => {
    if (!amount) return "$0"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleDateChange = (field: keyof EditableDates, value: string) => {
    setEditableDates((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const recalculateDependentDates = () => {
    if (!editableDates.effectiveDate || !summary) return

    const effectiveDate = new Date(editableDates.effectiveDate)
    const newDates = { ...editableDates }

    // Calculate feasibility expiration
    if (summary.feasibilityPeriodDays && !editableDates.feasibilityExpiration) {
      const feasibility = new Date(effectiveDate)
      feasibility.setDate(feasibility.getDate() + summary.feasibilityPeriodDays)
      newDates.feasibilityExpiration = feasibility.toISOString().split("T")[0]
    }

    // Calculate closing date from days
    if (summary.rawAnalysis?.closingDateDays && !editableDates.closingDate) {
      const closing = new Date(effectiveDate)
      closing.setDate(closing.getDate() + summary.rawAnalysis.closingDateDays)
      newDates.closingDate = closing.toISOString().split("T")[0]
    }

    // Calculate title commitment date
    if (summary.rawAnalysis?.titleCommitmentDays && !editableDates.titleCommitmentDate) {
      const titleCommitment = new Date(effectiveDate)
      titleCommitment.setDate(titleCommitment.getDate() + summary.rawAnalysis.titleCommitmentDays)
      newDates.titleCommitmentDate = titleCommitment.toISOString().split("T")[0]
    }

    // Calculate survey date
    if (summary.rawAnalysis?.surveyDays && !editableDates.surveyDate) {
      const survey = new Date(effectiveDate)
      survey.setDate(survey.getDate() + summary.rawAnalysis.surveyDays)
      newDates.surveyDate = survey.toISOString().split("T")[0]
    }

    // Calculate title objection date
    if (summary.rawAnalysis?.titleObjectionDays && !editableDates.titleObjectionDate) {
      const titleObjection = new Date(effectiveDate)
      titleObjection.setDate(titleObjection.getDate() + summary.rawAnalysis.titleObjectionDays)
      newDates.titleObjectionDate = titleObjection.toISOString().split("T")[0]
    }

    setEditableDates(newDates)
    setHasChanges(true)

    toast({
      title: "Dates Calculated",
      description: "Dependent dates have been calculated from the effective date.",
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/deals/${dealId}/summary`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          effectiveDate: editableDates.effectiveDate || null,
          feasibilityExpiration: editableDates.feasibilityExpiration || null,
          closingDate: editableDates.closingDate || null,
          outsideClosingDate: editableDates.outsideClosingDate || null,
          initialDepositDue: editableDates.initialDepositDue || null,
        }),
      })

      if (response.ok) {
        const updatedSummary = await response.json()
        setSummary(updatedSummary)
        setHasChanges(false)
        toast({
          title: "Saved",
          description: "Transaction summary has been updated.",
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transaction summary.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleImportToMilestones = async () => {
    setIsImporting(true)
    try {
      const milestones = []

      if (editableDates.effectiveDate) {
        milestones.push({
          name: "Contract Effective Date",
          date: editableDates.effectiveDate,
          category: "CONTRACT",
          description: "The date the contract becomes effective",
        })
      }

      if (editableDates.feasibilityExpiration) {
        milestones.push({
          name: "Feasibility Period Expiration",
          date: editableDates.feasibilityExpiration,
          category: "FEASIBILITY",
          description: `${summary?.feasibilityPeriodDays || ""} days from effective date`,
        })
      }

      if (editableDates.closingDate) {
        milestones.push({
          name: "Closing Date",
          date: editableDates.closingDate,
          category: "CLOSING",
          description: "Scheduled closing date",
        })
      }

      if (editableDates.outsideClosingDate) {
        milestones.push({
          name: "Outside Closing Date",
          date: editableDates.outsideClosingDate,
          category: "CLOSING",
          description: "Final deadline for closing",
        })
      }

      if (editableDates.initialDepositDue) {
        milestones.push({
          name: "Initial Deposit Due",
          date: editableDates.initialDepositDue,
          category: "CONTRACT",
          description: `Initial deposit: ${formatCurrency(summary?.initialDeposit)}`,
        })
      }

      if (editableDates.titleCommitmentDate) {
        milestones.push({
          name: "Title Commitment Due",
          date: editableDates.titleCommitmentDate,
          category: "TITLE",
          description: `${summary?.rawAnalysis?.titleCommitmentDays || ""} days from effective date`,
        })
      }

      if (editableDates.surveyDate) {
        milestones.push({
          name: "Survey Due",
          date: editableDates.surveyDate,
          category: "SURVEY",
          description: `${summary?.rawAnalysis?.surveyDays || ""} days from effective date`,
        })
      }

      if (editableDates.titleObjectionDate) {
        milestones.push({
          name: "Title Objection Deadline",
          date: editableDates.titleObjectionDate,
          category: "TITLE",
          description: `${summary?.rawAnalysis?.titleObjectionDays || ""} days from effective date`,
        })
      }

      // Add additional deposits
      summary?.additionalDeposits?.forEach((deposit, idx) => {
        if (deposit.dueDate) {
          milestones.push({
            name: `${deposit.name || `Additional Deposit ${idx + 1}`} Due`,
            date: deposit.dueDate,
            category: "CONTRACT",
            description: `Deposit amount: ${formatCurrency(deposit.amount)}`,
          })
        }
      })

      // Add key milestones from raw analysis
      summary?.rawAnalysis?.keyMilestones?.forEach((milestone) => {
        if (milestone.date) {
          milestones.push({
            name: milestone.name,
            date: milestone.date,
            category: milestone.category,
            description: milestone.description || "",
          })
        }
      })

      if (milestones.length === 0) {
        toast({
          title: "No Dates to Import",
          description: "Please enter dates before importing to milestones.",
          variant: "destructive",
        })
        return
      }

      // Use existing milestones API
      const response = await fetch(`/api/deals/${dealId}/milestones/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestones }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Milestones Imported",
          description: `Successfully imported ${data.count || milestones.length} milestones to the timeline.`,
        })
      } else {
        throw new Error("Failed to import milestones")
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import dates to milestones.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!summary) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-500 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Transaction Summary</h3>
          <p className="text-slate-400 mb-4 max-w-md mx-auto">
            Upload and analyze a contract document to generate a transaction summary,
            or upload a PDF transaction summary document.
          </p>
        </CardContent>
      </Card>
    )
  }

  const hasDateDependencies =
    summary.feasibilityPeriodDays ||
    summary.rawAnalysis?.closingDateDays ||
    summary.rawAnalysis?.titleCommitmentDays ||
    summary.rawAnalysis?.surveyDays

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-slate-400">
            Version {summary.version}
          </Badge>
          <span className="text-sm text-slate-500">
            Last updated: {formatDate(summary.analyzedAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge className="bg-amber-500/20 text-amber-400">Unsaved changes</Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportToMilestones}
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CalendarPlus className="mr-2 h-4 w-4" />
            )}
            Import to Milestones
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Effective Date & Auto-Calculate Section */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-blue-400" />
            Effective Date & Auto-Calculate
          </CardTitle>
          <CardDescription className="text-blue-300/70">
            Set the effective date to auto-calculate all dependent dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <Label className="text-slate-300">Effective Date</Label>
              <Input
                type="date"
                value={editableDates.effectiveDate}
                onChange={(e) => handleDateChange("effectiveDate", e.target.value)}
                className="bg-slate-800 border-slate-600 text-white [color-scheme:dark]"
              />
            </div>
            {hasDateDependencies && (
              <Button onClick={recalculateDependentDates} variant="secondary">
                <RefreshCw className="mr-2 h-4 w-4" />
                Calculate Dependent Dates
              </Button>
            )}
          </div>
          {hasDateDependencies && (
            <div className="mt-4 flex flex-wrap gap-2">
              {summary.feasibilityPeriodDays && (
                <Badge variant="outline" className="text-slate-300">
                  Feasibility: {summary.feasibilityPeriodDays} days
                </Badge>
              )}
              {summary.rawAnalysis?.closingDateDays && (
                <Badge variant="outline" className="text-slate-300">
                  Closing: {summary.rawAnalysis.closingDateDays} days
                </Badge>
              )}
              {summary.rawAnalysis?.titleCommitmentDays && (
                <Badge variant="outline" className="text-slate-300">
                  Title Commitment: {summary.rawAnalysis.titleCommitmentDays} days
                </Badge>
              )}
              {summary.rawAnalysis?.surveyDays && (
                <Badge variant="outline" className="text-slate-300">
                  Survey: {summary.rawAnalysis.surveyDays} days
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Dates & Deadlines */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2 text-white">
            <Clock className="h-5 w-5 text-amber-400" />
            Key Dates & Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Date Name</TableHead>
                <TableHead className="text-slate-300">Date</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-slate-700">
                <TableCell className="text-white font-medium">Effective Date</TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={editableDates.effectiveDate}
                    onChange={(e) => handleDateChange("effectiveDate", e.target.value)}
                    className="w-40 h-8 bg-slate-700 border-slate-600 text-white [color-scheme:dark]"
                  />
                </TableCell>
                <TableCell>
                  {editableDates.effectiveDate ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </TableCell>
              </TableRow>

              <TableRow className="border-slate-700">
                <TableCell className="text-white font-medium">
                  Feasibility Expiration
                  {summary.feasibilityPeriodDays && (
                    <span className="text-slate-400 text-sm ml-2">
                      ({summary.feasibilityPeriodDays} days)
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={editableDates.feasibilityExpiration}
                    onChange={(e) => handleDateChange("feasibilityExpiration", e.target.value)}
                    className="w-40 h-8 bg-slate-700 border-slate-600 text-white [color-scheme:dark]"
                  />
                </TableCell>
                <TableCell>
                  {editableDates.feasibilityExpiration ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </TableCell>
              </TableRow>

              <TableRow className="border-slate-700">
                <TableCell className="text-white font-medium">
                  Closing Date
                  {summary.rawAnalysis?.closingDateDays && (
                    <span className="text-slate-400 text-sm ml-2">
                      ({summary.rawAnalysis.closingDateDays} days)
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={editableDates.closingDate}
                    onChange={(e) => handleDateChange("closingDate", e.target.value)}
                    className="w-40 h-8 bg-slate-700 border-slate-600 text-white [color-scheme:dark]"
                  />
                </TableCell>
                <TableCell>
                  {editableDates.closingDate ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </TableCell>
              </TableRow>

              <TableRow className="border-slate-700">
                <TableCell className="text-white font-medium">Outside Closing Date</TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={editableDates.outsideClosingDate}
                    onChange={(e) => handleDateChange("outsideClosingDate", e.target.value)}
                    className="w-40 h-8 bg-slate-700 border-slate-600 text-white [color-scheme:dark]"
                  />
                </TableCell>
                <TableCell>
                  {editableDates.outsideClosingDate ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Info className="h-4 w-4 text-slate-500" />
                  )}
                </TableCell>
              </TableRow>

              <TableRow className="border-slate-700">
                <TableCell className="text-white font-medium">
                  Title Commitment Due
                  {summary.rawAnalysis?.titleCommitmentDays && (
                    <span className="text-slate-400 text-sm ml-2">
                      ({summary.rawAnalysis.titleCommitmentDays} days)
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={editableDates.titleCommitmentDate}
                    onChange={(e) => handleDateChange("titleCommitmentDate", e.target.value)}
                    className="w-40 h-8 bg-slate-700 border-slate-600 text-white [color-scheme:dark]"
                  />
                </TableCell>
                <TableCell>
                  {editableDates.titleCommitmentDate ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Info className="h-4 w-4 text-slate-500" />
                  )}
                </TableCell>
              </TableRow>

              <TableRow className="border-slate-700">
                <TableCell className="text-white font-medium">
                  Survey Due
                  {summary.rawAnalysis?.surveyDays && (
                    <span className="text-slate-400 text-sm ml-2">
                      ({summary.rawAnalysis.surveyDays} days)
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={editableDates.surveyDate}
                    onChange={(e) => handleDateChange("surveyDate", e.target.value)}
                    className="w-40 h-8 bg-slate-700 border-slate-600 text-white [color-scheme:dark]"
                  />
                </TableCell>
                <TableCell>
                  {editableDates.surveyDate ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Info className="h-4 w-4 text-slate-500" />
                  )}
                </TableCell>
              </TableRow>

              <TableRow className="border-slate-700">
                <TableCell className="text-white font-medium">
                  Title Objection Deadline
                  {summary.rawAnalysis?.titleObjectionDays && (
                    <span className="text-slate-400 text-sm ml-2">
                      ({summary.rawAnalysis.titleObjectionDays} days)
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={editableDates.titleObjectionDate}
                    onChange={(e) => handleDateChange("titleObjectionDate", e.target.value)}
                    className="w-40 h-8 bg-slate-700 border-slate-600 text-white [color-scheme:dark]"
                  />
                </TableCell>
                <TableCell>
                  {editableDates.titleObjectionDate ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Info className="h-4 w-4 text-slate-500" />
                  )}
                </TableCell>
              </TableRow>

              <TableRow className="border-slate-700">
                <TableCell className="text-white font-medium">Initial Deposit Due</TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={editableDates.initialDepositDue}
                    onChange={(e) => handleDateChange("initialDepositDue", e.target.value)}
                    className="w-40 h-8 bg-slate-700 border-slate-600 text-white [color-scheme:dark]"
                  />
                </TableCell>
                <TableCell>
                  {editableDates.initialDepositDue ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Info className="h-4 w-4 text-slate-500" />
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Parties */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-purple-400" />
              Parties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-400 text-xs uppercase">Buyer</Label>
              <p className="text-white font-medium">{summary.buyerName || "Not specified"}</p>
              {summary.buyerEntity && (
                <p className="text-slate-400 text-sm">{summary.buyerEntity}</p>
              )}
              {summary.buyerAddress && (
                <p className="text-slate-500 text-sm">{summary.buyerAddress}</p>
              )}
            </div>
            <Separator className="bg-slate-700" />
            <div>
              <Label className="text-slate-400 text-xs uppercase">Seller</Label>
              <p className="text-white font-medium">{summary.sellerName || "Not specified"}</p>
              {summary.sellerEntity && (
                <p className="text-slate-400 text-sm">{summary.sellerEntity}</p>
              )}
              {summary.sellerAddress && (
                <p className="text-slate-500 text-sm">{summary.sellerAddress}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Terms */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2 text-white">
              <DollarSign className="h-5 w-5 text-green-400" />
              Financial Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-400 text-xs uppercase">Purchase Price</Label>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(summary.purchasePrice)}
              </p>
              {summary.priceAdjustable && (
                <p className="text-amber-400 text-sm">
                  Price adjustable: {summary.priceAdjustmentBasis || "Yes"}
                </p>
              )}
            </div>
            <Separator className="bg-slate-700" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400 text-xs uppercase">Initial Deposit</Label>
                <p className="text-white font-medium">{formatCurrency(summary.initialDeposit)}</p>
              </div>
              {summary.pricePerUnit && (
                <div>
                  <Label className="text-slate-400 text-xs uppercase">Price Per Unit</Label>
                  <p className="text-white font-medium">{formatCurrency(summary.pricePerUnit)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Deposits */}
      {summary.additionalDeposits && summary.additionalDeposits.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2 text-white">
              <DollarSign className="h-5 w-5 text-green-400" />
              Additional Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Deposit</TableHead>
                  <TableHead className="text-slate-300">Amount</TableHead>
                  <TableHead className="text-slate-300">Due Date</TableHead>
                  <TableHead className="text-slate-300">Refundable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.additionalDeposits.map((deposit, idx) => (
                  <TableRow key={idx} className="border-slate-700">
                    <TableCell className="text-white">{deposit.name || `Deposit ${idx + 2}`}</TableCell>
                    <TableCell className="text-white">{formatCurrency(deposit.amount)}</TableCell>
                    <TableCell className="text-slate-400">
                      {deposit.dueDate
                        ? formatDate(deposit.dueDate)
                        : deposit.dueDays
                        ? `${deposit.dueDays} days from effective`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {deposit.refundable ? (
                        <Badge className="bg-green-500/20 text-green-400">Yes</Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400">No</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Title & Escrow */}
      {(summary.titleCompany || summary.escrowAgent) && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2 text-white">
              <Building className="h-5 w-5 text-blue-400" />
              Title & Escrow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {summary.titleCompany && (
                <div>
                  <Label className="text-slate-400 text-xs uppercase">Title Company</Label>
                  <p className="text-white">{summary.titleCompany}</p>
                </div>
              )}
              {summary.escrowAgent && (
                <div>
                  <Label className="text-slate-400 text-xs uppercase">Escrow Agent</Label>
                  <p className="text-white">{summary.escrowAgent}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contingencies */}
      {summary.contingencies && summary.contingencies.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Contingencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.contingencies.map((contingency, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-700 bg-slate-800/50"
                >
                  <p className="text-white font-medium">{contingency.name}</p>
                  <p className="text-slate-400 text-sm mt-1">{contingency.description}</p>
                  {(contingency.deadline || contingency.deadlineDays) && (
                    <p className="text-amber-400 text-sm mt-1">
                      Deadline:{" "}
                      {contingency.deadline
                        ? formatDate(contingency.deadline)
                        : `${contingency.deadlineDays} days from effective date`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Special Provisions */}
      {summary.specialProvisions && summary.specialProvisions.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-slate-400" />
              Special Provisions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.specialProvisions.map((provision, idx) => (
                <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                  <span className="text-slate-500">•</span>
                  {provision}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
