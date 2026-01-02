"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
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
import { useResizableColumns } from "@/hooks/useResizableColumns"
import { AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
  deal: { id: string; name: string; dealNumber: string }
  assignee: { id: string; name: string; email: string } | null
}

type GroupBy = "none" | "status" | "priority" | "deal"
type SortBy = "createdAt" | "dueDate" | "priority" | "status" | "title"

const columnConfig = [
  { key: "checkbox", initialWidth: 40, minWidth: 40 },
  { key: "task", initialWidth: 250, minWidth: 120 },
  { key: "priority", initialWidth: 80, minWidth: 70 },
  { key: "deal", initialWidth: 130, minWidth: 80 },
  { key: "assignee", initialWidth: 120, minWidth: 80 },
  { key: "dueDate", initialWidth: 110, minWidth: 80 },
  { key: "status", initialWidth: 130, minWidth: 100 },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<GroupBy>("status")
  const [sortBy, setSortBy] = useState<SortBy>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const { getColumnWidth, ResizeHandle } = useResizableColumns(columnConfig, "tasks-page")

  useEffect(() => {
    fetchTasks()
  }, [sortBy, sortOrder])

  async function fetchTasks() {
    try {
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
      })
      const response = await fetch(`/api/tasks?${params}`)
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStatusChange(taskId: string, dealId: string, newStatus: string) {
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

  async function handleCompleteTask(taskId: string, dealId: string) {
    await handleStatusChange(taskId, dealId, "COMPLETED")
  }

  const filteredTasks = useMemo(() => {
    if (filterStatus === "all") return tasks
    return tasks.filter((t) => t.status === filterStatus)
  }, [tasks, filterStatus])

  const groupedTasks = useMemo(() => {
    if (groupBy === "none") {
      return { "All Tasks": filteredTasks }
    }

    const groups: Record<string, Task[]> = {}

    filteredTasks.forEach((task) => {
      let key: string
      switch (groupBy) {
        case "status":
          key = task.status.replace("_", " ")
          break
        case "priority":
          key = task.priority
          break
        case "deal":
          key = `${task.deal.dealNumber} - ${task.deal.name}`
          break
        default:
          key = "Other"
      }

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(task)
    })

    // Sort groups
    const sortedGroups: Record<string, Task[]> = {}
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (groupBy === "priority") {
        const priorityOrder = ["URGENT", "HIGH", "MEDIUM", "LOW"]
        return priorityOrder.indexOf(a) - priorityOrder.indexOf(b)
      }
      if (groupBy === "status") {
        const statusOrder = ["TODO", "IN PROGRESS", "IN REVIEW", "BLOCKED", "COMPLETED", "CANCELLED"]
        return statusOrder.indexOf(a) - statusOrder.indexOf(b)
      }
      return a.localeCompare(b)
    })

    sortedKeys.forEach((key) => {
      sortedGroups[key] = groups[key]
    })

    return sortedGroups
  }, [filteredTasks, groupBy])

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Tasks</h1>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Group by:</span>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="deal">Deal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Sort by:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-700"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Filter:</span>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task Count */}
      <p className="text-sm text-slate-400 mb-4">
        Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
      </p>

      {filteredTasks.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-10 text-center">
            <p className="text-slate-400">No tasks found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([group, groupTasks]) => (
            <div key={group}>
              {groupBy !== "none" && (
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
                  {group}
                  <span className="text-sm font-normal text-slate-400">
                    ({groupTasks.length})
                  </span>
                </h2>
              )}
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
                        style={{ width: getColumnWidth("deal") }}
                      >
                        Deal
                        <ResizeHandle columnKey="deal" />
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
                        className="text-left text-xs font-medium text-slate-400 px-3 py-2 relative group"
                        style={{ width: getColumnWidth("status") }}
                      >
                        Status
                        <ResizeHandle columnKey="status" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupTasks.map((task) => (
                      <tr
                        key={task.id}
                        className={`border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50 transition-colors ${
                          task.status === "COMPLETED" ? "opacity-60" : "bg-slate-900"
                        }`}
                      >
                        <td className="px-2 py-2">
                          <Checkbox
                            checked={task.status === "COMPLETED"}
                            onCheckedChange={() => handleCompleteTask(task.id, task.deal.id)}
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
                          <Link
                            href={`/deals/${task.deal.id}`}
                            className="text-sm text-blue-400 hover:underline truncate block"
                            title={task.deal.name}
                          >
                            {task.deal.name}
                          </Link>
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
                        <td className="px-3 py-2">
                          <Select
                            value={task.status}
                            onValueChange={(value) =>
                              handleStatusChange(task.id, task.deal.id, value)
                            }
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
