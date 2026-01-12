"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Plus,
  CheckSquare,
  Loader2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  assignee: {
    id: string
    name: string
    email: string
  } | null
}

interface IssueTasksProps {
  issueId: string
  dealId: string
  tasks: Task[]
  onTaskCreated?: () => void
}

const statusColors: Record<string, string> = {
  TODO: "bg-slate-500/20 text-slate-300",
  IN_PROGRESS: "bg-blue-500/20 text-blue-400",
  IN_REVIEW: "bg-purple-500/20 text-purple-400",
  BLOCKED: "bg-red-500/20 text-red-400",
  COMPLETED: "bg-green-500/20 text-green-400",
  CANCELLED: "bg-slate-500/20 text-slate-500",
}

const priorityColors: Record<string, string> = {
  LOW: "bg-slate-500/20 text-slate-300",
  MEDIUM: "bg-blue-500/20 text-blue-400",
  HIGH: "bg-orange-500/20 text-orange-400",
  URGENT: "bg-red-500/20 text-red-400",
}

export function IssueTasks({ issueId, dealId, tasks, onTaskCreated }: IssueTasksProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("MEDIUM")
  const [dueDate, setDueDate] = useState("")

  async function handleCreateTask() {
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      const taskData: Record<string, string> = {
        title,
        priority,
        issueId,
      }
      if (description) taskData.description = description
      if (dueDate) taskData.dueDate = dueDate

      const response = await fetch(`/api/deals/${dealId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      })

      if (response.ok) {
        setTitle("")
        setDescription("")
        setPriority("MEDIUM")
        setDueDate("")
        setIsDialogOpen(false)
        onTaskCreated?.()
      }
    } catch (error) {
      console.error("Failed to create task:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-white flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-slate-400" />
            Tasks ({tasks.length})
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-slate-500 text-center py-4">
            No tasks assigned to this issue. Create a task to track work items.
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center justify-between p-3 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge className={`${statusColors[task.status]} text-xs`}>
                    {task.status.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-sm text-white">{task.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  {task.assignee && (
                    <span className="text-xs text-slate-400">
                      {task.assignee.name}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className={`text-xs ${
                      new Date(task.dueDate) < new Date() ? "text-red-400" : "text-slate-400"
                    }`}>
                      {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                    </span>
                  )}
                  <Badge className={`${priorityColors[task.priority]} text-xs`}>
                    {task.priority}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Task for Issue</DialogTitle>
            <DialogDescription>
              Create a new task to track work related to this issue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                placeholder="Enter task title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter task description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
