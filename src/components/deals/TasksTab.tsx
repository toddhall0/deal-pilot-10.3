"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog"
import { useResizableColumns } from "@/hooks/useResizableColumns"
import {
  MessageSquare,
  Paperclip,
  AlertTriangle,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  startDate: string | null
  dueDate: string | null
  assignee: { id: string; name: string; email: string } | null
  createdBy: { id: string; name: string; email: string }
  _count?: {
    comments: number
    documents: number
  }
}

interface TeamMember {
  id: string
  name: string
  email: string
}

interface TasksTabProps {
  dealId: string
}

const columnConfig = [
  { key: "checkbox", initialWidth: 40, minWidth: 40 },
  { key: "task", initialWidth: 250, minWidth: 120 },
  { key: "priority", initialWidth: 80, minWidth: 70 },
  { key: "assignee", initialWidth: 120, minWidth: 80 },
  { key: "dueDate", initialWidth: 110, minWidth: 80 },
  { key: "comments", initialWidth: 50, minWidth: 40 },
  { key: "docs", initialWidth: 50, minWidth: 40 },
  { key: "status", initialWidth: 130, minWidth: 100 },
]

export function TasksTab({ dealId }: TasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    assigneeId: "",
  })
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)

  const { getColumnWidth, ResizeHandle } = useResizableColumns(columnConfig, `deal-tasks-${dealId}`)

  useEffect(() => {
    fetchTasks()
    fetchTeamMembers()
  }, [dealId])

  async function fetchTasks() {
    try {
      const response = await fetch(`/api/deals/${dealId}/tasks`)
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchTeamMembers() {
    try {
      const response = await fetch("/api/team-members")
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data)
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error)
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    try {
      const taskData = {
        ...newTask,
        assigneeId: newTask.assigneeId || undefined,
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
      }
      const response = await fetch(`/api/deals/${dealId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      })

      if (response.ok) {
        await fetchTasks()
        setIsDialogOpen(false)
        setNewTask({
          title: "",
          description: "",
          status: "TODO",
          priority: "MEDIUM",
          assigneeId: "",
        })
        setStartDate(undefined)
        setDueDate(undefined)
      }
    } catch (error) {
      console.error("Failed to create task:", error)
    }
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    try {
      await fetch(`/api/deals/${dealId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      setTasks(
        tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      )
    } catch (error) {
      console.error("Failed to update task:", error)
    }
  }

  async function handleCompleteTask(taskId: string) {
    await handleStatusChange(taskId, "COMPLETED")
  }

  function openTaskDetail(taskId: string) {
    setSelectedTaskId(taskId)
    setIsDetailOpen(true)
  }

  const priorityColors: Record<string, string> = {
    LOW: "bg-slate-500/20 text-slate-300",
    MEDIUM: "bg-blue-500/20 text-blue-400",
    HIGH: "bg-orange-500/20 text-orange-400",
    URGENT: "bg-red-500/20 text-red-400",
  }

  const statusColors: Record<string, string> = {
    TODO: "bg-slate-500/20 text-slate-300",
    IN_PROGRESS: "bg-blue-500/20 text-blue-400",
    IN_REVIEW: "bg-purple-500/20 text-purple-400",
    BLOCKED: "bg-red-500/20 text-red-400",
    COMPLETED: "bg-green-500/20 text-green-400",
    CANCELLED: "bg-slate-500/20 text-slate-500",
  }

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "COMPLETED" || status === "CANCELLED") return false
    return new Date(dueDate) < new Date()
  }

  if (isLoading) {
    return <div className="p-4 text-slate-400">Loading tasks...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Tasks ({tasks.length})</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Task</Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Title *</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Description</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Assign To</Label>
                <Select
                  value={newTask.assigneeId}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, assigneeId: value })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select assignee (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Status</Label>
                  <Select
                    value={newTask.status}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, status: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="IN_REVIEW">In Review</SelectItem>
                      <SelectItem value="BLOCKED">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, priority: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Start Date</Label>
                  <DatePicker
                    date={startDate}
                    onDateChange={setStartDate}
                    placeholder="Select start date"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Due Date</Label>
                  <DatePicker
                    date={dueDate}
                    onDateChange={setDueDate}
                    placeholder="Select due date"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Create Task
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-10 text-center">
            <p className="text-slate-400">No tasks yet. Add your first task!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-slate-800 overflow-x-auto">
          <table className="w-full" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800">
                <th
                  className="text-left text-xs font-medium text-slate-400 px-2 py-2 relative group"
                  style={{ width: getColumnWidth("checkbox") }}
                >
                  <ResizeHandle columnKey="checkbox" />
                </th>
                <th
                  className="text-left text-xs font-medium text-slate-400 px-3 py-2 relative group"
                  style={{ width: getColumnWidth("task") }}
                >
                  Task
                  <ResizeHandle columnKey="task" />
                </th>
                <th
                  className="text-left text-xs font-medium text-slate-400 px-3 py-2 relative group"
                  style={{ width: getColumnWidth("priority") }}
                >
                  Priority
                  <ResizeHandle columnKey="priority" />
                </th>
                <th
                  className="text-left text-xs font-medium text-slate-400 px-3 py-2 relative group"
                  style={{ width: getColumnWidth("assignee") }}
                >
                  Assignee
                  <ResizeHandle columnKey="assignee" />
                </th>
                <th
                  className="text-left text-xs font-medium text-slate-400 px-3 py-2 relative group"
                  style={{ width: getColumnWidth("dueDate") }}
                >
                  Due Date
                  <ResizeHandle columnKey="dueDate" />
                </th>
                <th
                  className="text-center text-xs font-medium text-slate-400 px-2 py-2 relative group"
                  style={{ width: getColumnWidth("comments") }}
                >
                  <MessageSquare className="h-3 w-3 mx-auto" />
                  <ResizeHandle columnKey="comments" />
                </th>
                <th
                  className="text-center text-xs font-medium text-slate-400 px-2 py-2 relative group"
                  style={{ width: getColumnWidth("docs") }}
                >
                  <Paperclip className="h-3 w-3 mx-auto" />
                  <ResizeHandle columnKey="docs" />
                </th>
                <th
                  className="text-left text-xs font-medium text-slate-400 px-3 py-2 relative group"
                  style={{ width: getColumnWidth("status") }}
                >
                  Status
                  <ResizeHandle columnKey="status" />
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className={`border-b border-slate-800 last:border-b-0 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                    task.status === "COMPLETED" ? "opacity-60" : "bg-slate-900"
                  }`}
                  onClick={() => openTaskDetail(task.id)}
                >
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={task.status === "COMPLETED"}
                      onCheckedChange={() => handleCompleteTask(task.id)}
                      className="border-slate-600"
                    />
                  </td>
                  <td className="px-3 py-2 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium truncate ${task.status === "COMPLETED" ? "line-through text-slate-500" : "text-white"}`}>
                        {task.title}
                      </span>
                      {isOverdue(task.dueDate, task.status) && (
                        <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge className={`${priorityColors[task.priority]} text-xs`}>
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 overflow-hidden">
                    {task.assignee ? (
                      <span className="text-sm text-slate-300 truncate block">
                        {task.assignee.name}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {task.dueDate ? (
                      <span className={`text-sm ${isOverdue(task.dueDate, task.status) ? "text-red-400" : "text-slate-400"}`}>
                        {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span className="text-xs text-slate-500">
                      {task._count?.comments || 0}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span className="text-xs text-slate-500">
                      {task._count?.documents || 0}
                    </span>
                  </td>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={task.status}
                      onValueChange={(value) => handleStatusChange(task.id, value)}
                    >
                      <SelectTrigger className="w-full h-7 bg-slate-800 border-slate-700 text-xs">
                        <Badge className={`${statusColors[task.status]} text-xs`}>
                          {task.status.replace("_", " ")}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="IN_REVIEW">In Review</SelectItem>
                        <SelectItem value="BLOCKED">Blocked</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        taskId={selectedTaskId}
        dealId={dealId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onTaskUpdated={fetchTasks}
      />
    </div>
  )
}
