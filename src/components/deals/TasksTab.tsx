"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { useResizableColumns } from "@/hooks/useResizableColumns"
import {
  MessageSquare,
  Paperclip,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  FolderPlus,
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
  taskListId: string | null
  assignee: { id: string; name: string; email: string } | null
  createdBy: { id: string; name: string; email: string }
  _count?: {
    comments: number
    documents: number
  }
}

interface TaskList {
  id: string
  name: string
  description: string | null
  color: string | null
  isCollapsed: boolean
  tasks: Task[]
  _count: {
    tasks: number
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

const defaultColors = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
]

export function TasksTab({ dealId }: TasksTabProps) {
  const [taskLists, setTaskLists] = useState<TaskList[]>([])
  const [uncategorizedTasks, setUncategorizedTasks] = useState<Task[]>([])
  const [collapsedLists, setCollapsedLists] = useState<Set<string>>(new Set())
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Task dialog state
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [selectedTaskListId, setSelectedTaskListId] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    assigneeId: "",
  })
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)

  // Task list dialog state
  const [isListDialogOpen, setIsListDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<TaskList | null>(null)
  const [newListName, setNewListName] = useState("")
  const [newListColor, setNewListColor] = useState(defaultColors[0])

  const { getColumnWidth, ResizeHandle } = useResizableColumns(columnConfig, `deal-tasks-${dealId}`)

  useEffect(() => {
    fetchTaskLists()
    fetchTeamMembers()
  }, [dealId])

  async function fetchTaskLists() {
    try {
      const response = await fetch(`/api/deals/${dealId}/task-lists`)
      const data = await response.json()
      setTaskLists(data.taskLists || [])
      setUncategorizedTasks(data.uncategorizedTasks || [])
    } catch (error) {
      console.error("Failed to fetch task lists:", error)
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
        taskListId: selectedTaskListId,
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
      }
      const response = await fetch(`/api/deals/${dealId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      })

      if (response.ok) {
        await fetchTaskLists()
        setIsTaskDialogOpen(false)
        resetTaskForm()
      }
    } catch (error) {
      console.error("Failed to create task:", error)
    }
  }

  function resetTaskForm() {
    setNewTask({
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      assigneeId: "",
    })
    setStartDate(undefined)
    setDueDate(undefined)
    setSelectedTaskListId(null)
  }

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch(`/api/deals/${dealId}/task-lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName,
          color: newListColor,
        }),
      })

      if (response.ok) {
        await fetchTaskLists()
        setIsListDialogOpen(false)
        setNewListName("")
        setNewListColor(defaultColors[0])
      }
    } catch (error) {
      console.error("Failed to create task list:", error)
    }
  }

  async function handleUpdateList(e: React.FormEvent) {
    e.preventDefault()
    if (!editingList) return

    try {
      const response = await fetch(`/api/deals/${dealId}/task-lists/${editingList.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName,
          color: newListColor,
        }),
      })

      if (response.ok) {
        await fetchTaskLists()
        setIsListDialogOpen(false)
        setEditingList(null)
        setNewListName("")
        setNewListColor(defaultColors[0])
      }
    } catch (error) {
      console.error("Failed to update task list:", error)
    }
  }

  async function handleDeleteList(listId: string) {
    if (!confirm("Are you sure? Tasks in this list will become uncategorized.")) return

    try {
      await fetch(`/api/deals/${dealId}/task-lists/${listId}`, {
        method: "DELETE",
      })
      await fetchTaskLists()
    } catch (error) {
      console.error("Failed to delete task list:", error)
    }
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    try {
      await fetch(`/api/deals/${dealId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      await fetchTaskLists()
    } catch (error) {
      console.error("Failed to update task:", error)
    }
  }

  async function handleCompleteTask(taskId: string) {
    await handleStatusChange(taskId, "COMPLETED")
  }

  function toggleListCollapse(listId: string) {
    setCollapsedLists((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(listId)) {
        newSet.delete(listId)
      } else {
        newSet.add(listId)
      }
      return newSet
    })
  }

  function openEditListDialog(list: TaskList) {
    setEditingList(list)
    setNewListName(list.name)
    setNewListColor(list.color || defaultColors[0])
    setIsListDialogOpen(true)
  }

  function openAddTaskDialog(listId: string | null) {
    setSelectedTaskListId(listId)
    setIsTaskDialogOpen(true)
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

  const totalTasks = taskLists.reduce((sum, list) => sum + list.tasks.length, 0) + uncategorizedTasks.length

  function renderTaskTable(tasks: Task[], listId: string | null) {
    if (tasks.length === 0) {
      return (
        <div className="px-4 py-3 text-sm text-slate-500 italic">
          No tasks in this list.{" "}
          <button
            onClick={() => openAddTaskDialog(listId)}
            className="text-blue-400 hover:underline"
          >
            Add one
          </button>
        </div>
      )
    }

    return (
      <table className="w-full" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr className="bg-slate-800/30 border-b border-slate-800">
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
              className={`border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50 transition-colors ${
                task.status === "COMPLETED" ? "opacity-60" : ""
              }`}
            >
              <td className="px-2 py-2">
                <Checkbox
                  checked={task.status === "COMPLETED"}
                  onCheckedChange={() => handleCompleteTask(task.id)}
                  className="border-slate-600"
                />
              </td>
              <td className="px-3 py-2 overflow-hidden">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/tasks/${task.id}`}
                    className={`font-medium truncate hover:underline ${task.status === "COMPLETED" ? "line-through text-slate-500" : "text-white"}`}
                  >
                    {task.title}
                  </Link>
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
              <td className="px-3 py-2">
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
    )
  }

  if (isLoading) {
    return <div className="p-4 text-slate-400">Loading tasks...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Tasks ({totalTasks})</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingList(null)
              setNewListName("")
              setNewListColor(defaultColors[taskLists.length % defaultColors.length])
              setIsListDialogOpen(true)
            }}
            className="border-slate-700"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New List
          </Button>
          <Button size="sm" onClick={() => openAddTaskDialog(null)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Task Lists */}
      {taskLists.map((list) => (
        <div key={list.id} className="rounded-lg border border-slate-800 overflow-hidden">
          {/* List Header */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-slate-800/50 cursor-pointer"
            onClick={() => toggleListCollapse(list.id)}
          >
            <div className="flex items-center gap-3">
              {collapsedLists.has(list.id) ? (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: list.color || defaultColors[0] }}
              />
              <span className="font-medium text-white">{list.name}</span>
              <span className="text-sm text-slate-400">({list.tasks.length})</span>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => openAddTaskDialog(list.id)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditListDialog(list)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit List
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteList(list.id)}
                    className="text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Task Table */}
          {!collapsedLists.has(list.id) && (
            <div className="overflow-x-auto bg-slate-900">
              {renderTaskTable(list.tasks, list.id)}
            </div>
          )}
        </div>
      ))}

      {/* Uncategorized Tasks */}
      {uncategorizedTasks.length > 0 && (
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 bg-slate-800/50 cursor-pointer"
            onClick={() => toggleListCollapse("uncategorized")}
          >
            <div className="flex items-center gap-3">
              {collapsedLists.has("uncategorized") ? (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
              <span className="font-medium text-slate-300">Uncategorized</span>
              <span className="text-sm text-slate-400">({uncategorizedTasks.length})</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={(e) => {
                e.stopPropagation()
                openAddTaskDialog(null)
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {!collapsedLists.has("uncategorized") && (
            <div className="overflow-x-auto bg-slate-900">
              {renderTaskTable(uncategorizedTasks, null)}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {taskLists.length === 0 && uncategorizedTasks.length === 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-10 text-center">
            <p className="text-slate-400 mb-4">No tasks yet. Create a task list to organize your work!</p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingList(null)
                  setNewListName("")
                  setNewListColor(defaultColors[0])
                  setIsListDialogOpen(true)
                }}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Create List
              </Button>
              <Button onClick={() => openAddTaskDialog(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task List Dialog */}
      <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingList ? "Edit Task List" : "Create Task List"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editingList ? handleUpdateList : handleCreateList} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Name *</Label>
              <Input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g., Contract Negotiation"
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newListColor === color ? "border-white scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewListColor(color)}
                  />
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full">
              {editingList ? "Save Changes" : "Create List"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Title *</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Task List</Label>
              <Select
                value={selectedTaskListId || "none"}
                onValueChange={(value) => setSelectedTaskListId(value === "none" ? null : value)}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select list (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No list (Uncategorized)</SelectItem>
                  {taskLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: list.color || defaultColors[0] }}
                        />
                        {list.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Assign To</Label>
              <Select
                value={newTask.assigneeId}
                onValueChange={(value) => setNewTask({ ...newTask, assigneeId: value })}
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
                  onValueChange={(value) => setNewTask({ ...newTask, status: value })}
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
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
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
  )
}
