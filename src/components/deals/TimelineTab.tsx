"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MilestoneItem } from "@/components/timeline/MilestoneItem"
import { MilestoneEditor } from "@/components/timeline/MilestoneEditor"
import { Plus, Calendar, CheckCircle, Clock, AlertTriangle, Sparkles, Loader2 } from "lucide-react"

interface Milestone {
  id: string
  name: string
  description: string | null
  dueDate: string
  completedDate: string | null
  status: string
  parentId: string | null
  children?: Milestone[]
}

interface Timeline {
  id: string
  dealId: string
  milestones: Milestone[]
}

interface TimelineTabProps {
  dealId: string
}

export function TimelineTab({ dealId }: TimelineTabProps) {
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchTimeline()
  }, [dealId])

  async function fetchTimeline() {
    try {
      const response = await fetch(`/api/deals/${dealId}/milestones`)
      const data = await response.json()
      setTimeline(data)
    } catch (error) {
      console.error("Failed to fetch timeline:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleEdit(milestone: Milestone) {
    setEditingMilestone(milestone)
    setParentIdForNew(null)
    setIsEditorOpen(true)
  }

  function handleAddChild(parentId: string) {
    setEditingMilestone(null)
    setParentIdForNew(parentId)
    setIsEditorOpen(true)
  }

  function handleNewMilestone() {
    setEditingMilestone(null)
    setParentIdForNew(null)
    setIsEditorOpen(true)
  }

  async function handleGenerateFromAnalysis() {
    if (!confirm("This will create milestones based on the contract analysis. Continue?")) {
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch(`/api/deals/${dealId}/generate-timeline`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        fetchTimeline()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to generate timeline")
      }
    } catch (error) {
      console.error("Failed to generate timeline:", error)
      alert("Failed to generate timeline")
    } finally {
      setIsGenerating(false)
    }
  }

  // Calculate stats
  const allMilestones = timeline?.milestones || []
  const flatMilestones: Milestone[] = []

  function flatten(milestones: Milestone[]) {
    milestones.forEach((m) => {
      flatMilestones.push(m)
      if (m.children) flatten(m.children)
    })
  }
  flatten(allMilestones)

  const stats = {
    total: flatMilestones.length,
    completed: flatMilestones.filter((m) => m.status === "COMPLETED").length,
    upcoming: flatMilestones.filter((m) => {
      const days = Math.ceil(
        (new Date(m.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      return m.status !== "COMPLETED" && days >= 0 && days <= 7
    }).length,
    overdue: flatMilestones.filter((m) => {
      const days = Math.ceil(
        (new Date(m.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      return m.status !== "COMPLETED" && m.status !== "WAIVED" && days < 0
    }).length,
  }

  if (isLoading) {
    return <div className="p-4">Loading timeline...</div>
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-slate-400">Total Milestones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
                <p className="text-sm text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.upcoming}</p>
                <p className="text-sm text-slate-400">Due This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.overdue}</p>
                <p className="text-sm text-slate-400">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Timeline</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateFromAnalysis}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate from Contract
              </>
            )}
          </Button>
          <Button onClick={handleNewMilestone}>
            <Plus className="mr-2 h-4 w-4" />
            Add Milestone
          </Button>
        </div>
      </div>

      {/* Milestones List */}
      {allMilestones.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-10 text-center">
            <Calendar className="mx-auto h-10 w-10 text-slate-600 mb-2" />
            <p className="text-slate-400 mb-4">No milestones yet</p>
            <Button onClick={handleNewMilestone}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first milestone
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-4">
            {allMilestones.map((milestone) => (
              <MilestoneItem
                key={milestone.id}
                milestone={milestone}
                dealId={dealId}
                onUpdate={fetchTimeline}
                onEdit={handleEdit}
                onAddChild={handleAddChild}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Milestone Editor */}
      <MilestoneEditor
        dealId={dealId}
        milestone={editingMilestone}
        parentId={parentIdForNew}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingMilestone(null)
          setParentIdForNew(null)
        }}
        onSave={fetchTimeline}
      />
    </div>
  )
}
