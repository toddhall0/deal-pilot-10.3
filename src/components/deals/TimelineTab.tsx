"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MilestoneItem } from "@/components/timeline/MilestoneItem"
import { MilestoneEditor } from "@/components/timeline/MilestoneEditor"
import { Plus, Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react"

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
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Milestones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
                <p className="text-sm text-gray-500">Due This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-sm text-gray-500">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <Button onClick={handleNewMilestone}>
          <Plus className="mr-2 h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      {/* Milestones List */}
      {allMilestones.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Calendar className="mx-auto h-10 w-10 text-gray-300 mb-2" />
            <p className="text-gray-500 mb-4">No milestones yet</p>
            <Button onClick={handleNewMilestone}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first milestone
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
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
