"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface Milestone {
  id: string
  name: string
  description: string | null
  dueDate: string
  status: string
  parentId: string | null
}

interface MilestoneEditorProps {
  dealId: string
  milestone?: Milestone | null
  parentId?: string | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function MilestoneEditor({
  dealId,
  milestone,
  parentId,
  isOpen,
  onClose,
  onSave,
}: MilestoneEditorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [status, setStatus] = useState("PENDING")
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = !!milestone

  useEffect(() => {
    if (milestone) {
      setName(milestone.name)
      setDescription(milestone.description || "")
      setDueDate(milestone.dueDate.split("T")[0])
      setStatus(milestone.status)
    } else {
      setName("")
      setDescription("")
      setDueDate("")
      setStatus("PENDING")
    }
  }, [milestone, isOpen])

  const handleSave = async () => {
    if (!name.trim() || !dueDate) {
      alert("Please enter a name and due date")
      return
    }

    setIsSaving(true)

    try {
      const url = isEditing
        ? `/api/deals/${dealId}/milestones/${milestone.id}`
        : `/api/deals/${dealId}/milestones`

      const body: any = {
        name,
        description: description || null,
        dueDate,
      }

      if (isEditing) {
        body.status = status
      } else if (parentId) {
        body.parentId = parentId
      }

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        onSave()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to save milestone")
      }
    } catch (error) {
      console.error("Failed to save milestone:", error)
      alert("Failed to save milestone")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Milestone" : parentId ? "Add Sub-Milestone" : "New Milestone"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Feasibility Period Expires"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details about this milestone..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="MISSED">Missed</SelectItem>
                    <SelectItem value="WAIVED">Waived</SelectItem>
                    <SelectItem value="NOT_APPLICABLE">N/A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Milestone"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
