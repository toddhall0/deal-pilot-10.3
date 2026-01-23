"use client"

import { useState, useEffect } from "react"
import { ContractAnalysisResult, KeyMilestone } from "@/types/analysis"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CalendarPlus, Trash2, Plus, Loader2 } from "lucide-react"

interface EditableMilestone {
  id: string
  name: string
  description: string
  date: string
  category: string
  selected: boolean
}

interface ImportMilestonesDialogProps {
  isOpen: boolean
  onClose: () => void
  analysis: ContractAnalysisResult
  dealId: string
  documentId: string
  onImportComplete?: (count: number) => void
}

const MILESTONE_CATEGORIES = [
  { value: "CONTRACT", label: "Contract" },
  { value: "FEASIBILITY", label: "Feasibility" },
  { value: "TITLE", label: "Title" },
  { value: "SURVEY", label: "Survey" },
  { value: "FINANCING", label: "Financing" },
  { value: "CLOSING", label: "Closing" },
  { value: "POST_CLOSING", label: "Post-Closing" },
]

export function ImportMilestonesDialog({
  isOpen,
  onClose,
  analysis,
  dealId,
  documentId,
  onImportComplete,
}: ImportMilestonesDialogProps) {
  const [milestones, setMilestones] = useState<EditableMilestone[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize milestones from analysis when dialog opens
  useEffect(() => {
    if (isOpen && analysis) {
      const editableMilestones: EditableMilestone[] = []
      let idCounter = 0

      // Add key milestones from analysis
      if (analysis.keyMilestones) {
        analysis.keyMilestones.forEach((m) => {
          if (m.date) {
            editableMilestones.push({
              id: `km-${idCounter++}`,
              name: m.name,
              description: m.description || "",
              date: m.date,
              category: m.category,
              selected: true,
            })
          }
        })
      }

      // Add key dates as milestones
      if (analysis.effectiveDate) {
        editableMilestones.push({
          id: `kd-${idCounter++}`,
          name: "Contract Effective Date",
          description: "The date the contract becomes effective",
          date: analysis.effectiveDate,
          category: "CONTRACT",
          selected: true,
        })
      }

      if (analysis.feasibilityExpiration) {
        editableMilestones.push({
          id: `kd-${idCounter++}`,
          name: "Feasibility Period Expiration",
          description: "Last day to terminate under feasibility contingency",
          date: analysis.feasibilityExpiration,
          category: "FEASIBILITY",
          selected: true,
        })
      }

      if (analysis.closingDate) {
        editableMilestones.push({
          id: `kd-${idCounter++}`,
          name: "Closing Date",
          description: "Scheduled closing date",
          date: analysis.closingDate,
          category: "CLOSING",
          selected: true,
        })
      }

      if (analysis.outsideClosingDate) {
        editableMilestones.push({
          id: `kd-${idCounter++}`,
          name: "Outside Closing Date",
          description: "Final deadline for closing",
          date: analysis.outsideClosingDate,
          category: "CLOSING",
          selected: true,
        })
      }

      if (analysis.titleCommitmentDate) {
        editableMilestones.push({
          id: `kd-${idCounter++}`,
          name: "Title Commitment Due",
          description: "Deadline for title commitment delivery",
          date: analysis.titleCommitmentDate,
          category: "TITLE",
          selected: true,
        })
      }

      if (analysis.surveyDate) {
        editableMilestones.push({
          id: `kd-${idCounter++}`,
          name: "Survey Due",
          description: "Deadline for survey delivery",
          date: analysis.surveyDate,
          category: "SURVEY",
          selected: true,
        })
      }

      if (analysis.titleObjectionDate) {
        editableMilestones.push({
          id: `kd-${idCounter++}`,
          name: "Title Objection Deadline",
          description: "Last day to raise title objections",
          date: analysis.titleObjectionDate,
          category: "TITLE",
          selected: true,
        })
      }

      // Add deposits with due dates
      analysis.deposits?.forEach((deposit) => {
        if (deposit.dueDate) {
          editableMilestones.push({
            id: `dep-${idCounter++}`,
            name: `${deposit.name} Due`,
            description: `Deposit amount: $${deposit.amount.toLocaleString()}`,
            date: deposit.dueDate,
            category: "CONTRACT",
            selected: true,
          })
        }
      })

      // Sort by date
      editableMilestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setMilestones(editableMilestones)
      setError(null)
    }
  }, [isOpen, analysis])

  const handleUpdateMilestone = (id: string, field: keyof EditableMilestone, value: string | boolean) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    )
  }

  const handleRemoveMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id))
  }

  const handleAddMilestone = () => {
    const newId = `new-${Date.now()}`
    setMilestones((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        description: "",
        date: "",
        category: "CONTRACT",
        selected: true,
      },
    ])
  }

  const handleSelectAll = (checked: boolean) => {
    setMilestones((prev) => prev.map((m) => ({ ...m, selected: checked })))
  }

  const handleImport = async () => {
    const selectedMilestones = milestones.filter((m) => m.selected && m.name && m.date)

    if (selectedMilestones.length === 0) {
      setError("Please select at least one milestone with a name and date")
      return
    }

    setIsImporting(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/deals/${dealId}/documents/${documentId}/analyze/import-milestones`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            milestones: selectedMilestones.map((m) => ({
              name: m.name,
              description: m.description,
              date: m.date,
              category: m.category,
            })),
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to import milestones")
      }

      const data = await response.json()
      onImportComplete?.(data.count)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import milestones")
    } finally {
      setIsImporting(false)
    }
  }

  const selectedCount = milestones.filter((m) => m.selected).length
  const allSelected = milestones.length > 0 && milestones.every((m) => m.selected)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            Import Milestones to Timeline
          </DialogTitle>
          <DialogDescription>
            Review and modify the extracted dates before importing them as milestones.
            You can edit names, descriptions, dates, and categories.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {milestones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No dates were extracted from the document. You can add milestones manually.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Milestone Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-36">Date</TableHead>
                  <TableHead className="w-36">Category</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestones.map((milestone) => (
                  <TableRow
                    key={milestone.id}
                    className={!milestone.selected ? "opacity-50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={milestone.selected}
                        onCheckedChange={(checked) =>
                          handleUpdateMilestone(milestone.id, "selected", checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={milestone.name}
                        onChange={(e) =>
                          handleUpdateMilestone(milestone.id, "name", e.target.value)
                        }
                        placeholder="Milestone name"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={milestone.description}
                        onChange={(e) =>
                          handleUpdateMilestone(milestone.id, "description", e.target.value)
                        }
                        placeholder="Description (optional)"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={milestone.date}
                        onChange={(e) =>
                          handleUpdateMilestone(milestone.id, "date", e.target.value)
                        }
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={milestone.category}
                        onValueChange={(value) =>
                          handleUpdateMilestone(milestone.id, "category", value)
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MILESTONE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveMilestone(milestone.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={handleAddMilestone}>
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {selectedCount} of {milestones.length} milestones selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isImporting || selectedCount === 0}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Import {selectedCount} Milestone{selectedCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
