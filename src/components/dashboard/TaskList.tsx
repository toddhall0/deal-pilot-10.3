"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useResizableColumns } from "@/hooks/useResizableColumns"
import {
  CheckSquare,
  ArrowRight,
  AlertTriangle,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  deal: {
    id: string
    name: string
    dealNumber: string
  }
}

interface TaskListProps {
  tasks: Task[]
  onTaskComplete?: (taskId: string) => void
}

const columnConfig = [
  { key: "checkbox", initialWidth: 36, minWidth: 36 },
  { key: "task", initialWidth: 180, minWidth: 100 },
  { key: "priority", initialWidth: 70, minWidth: 60 },
  { key: "status", initialWidth: 85, minWidth: 70 },
  { key: "deal", initialWidth: 80, minWidth: 60 },
  { key: "due", initialWidth: 100, minWidth: 70 },
]

export function TaskList({ tasks, onTaskComplete }: TaskListProps) {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())

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
    CANCELLED: "bg-gray-500/20 text-gray-400",
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ")
  }

  const { getColumnWidth, ResizeHandle } = useResizableColumns(columnConfig, "dashboard-tasks")

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const handleCheck = async (taskId: string, currentStatus: string) => {
    const isCompleted = completedTasks.has(taskId) || currentStatus === "COMPLETED"
    const newStatus = isCompleted ? "IN_PROGRESS" : "COMPLETED"

    // Toggle local state
    setCompletedTasks((prev) => {
      const next = new Set(prev)
      if (isCompleted) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })

    // Update in database
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      onTaskComplete?.(taskId)
    } catch (error) {
      console.error("Failed to update task:", error)
      // Revert on error
      setCompletedTasks((prev) => {
        const next = new Set(prev)
        if (isCompleted) {
          next.add(taskId)
        } else {
          next.delete(taskId)
        }
        return next
      })
    }
  }

  const isTaskCompleted = (task: Task) => {
    return completedTasks.has(task.id) || task.status === "COMPLETED"
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2 text-white">
          <CheckSquare className="h-5 w-5 text-purple-400" />
          My Tasks
        </CardTitle>
        <Link href="/tasks">
          <Button variant="ghost" size="sm" className="text-sm text-slate-400 hover:text-white">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-slate-500 px-6">
            <CheckSquare className="h-8 w-8 mx-auto mb-2 text-slate-600" />
            <p>No pending tasks</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full" style={{ tableLayout: "auto" }}>
              <thead>
                <tr className="border-b border-slate-800">
                  <th
                    className="px-2 py-2 relative group whitespace-nowrap"
                    style={{ width: getColumnWidth("checkbox") }}
                  >
                    <ResizeHandle columnKey="checkbox" />
                  </th>
                  <th
                    className="text-left text-xs font-medium text-slate-400 px-3 py-2 relative group whitespace-nowrap"
                    style={{ minWidth: getColumnWidth("task") }}
                  >
                    Task
                    <ResizeHandle columnKey="task" />
                  </th>
                  <th
                    className="text-left text-xs font-medium text-slate-400 px-3 py-2 relative group whitespace-nowrap"
                    style={{ minWidth: getColumnWidth("priority") }}
                  >
                    Priority
                    <ResizeHandle columnKey="priority" />
                  </th>
                  <th
                    className="text-left text-xs font-medium text-slate-400 px-3 py-2 relative group whitespace-nowrap"
                    style={{ minWidth: getColumnWidth("status") }}
                  >
                    Status
                    <ResizeHandle columnKey="status" />
                  </th>
                  <th
                    className="text-left text-xs font-medium text-slate-400 px-3 py-2 relative group whitespace-nowrap"
                    style={{ minWidth: getColumnWidth("deal") }}
                  >
                    Deal
                    <ResizeHandle columnKey="deal" />
                  </th>
                  <th
                    className="text-left text-xs font-medium text-slate-400 px-3 py-2 relative group whitespace-nowrap"
                    style={{ minWidth: getColumnWidth("due") }}
                  >
                    Due
                    <ResizeHandle columnKey="due" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50 transition-colors ${
                      isTaskCompleted(task) ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div
                        onClick={() => handleCheck(task.id, task.status)}
                        className="cursor-pointer"
                      >
                        <Checkbox
                          className="border-slate-600 pointer-events-none"
                          checked={isTaskCompleted(task)}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-medium text-sm text-white hover:underline"
                        >
                          {task.title}
                        </Link>
                        {isOverdue(task.dueDate) && (
                          <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Badge className={`${priorityColors[task.priority]} text-xs`}>
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Badge className={`${statusColors[task.status]} text-xs`}>
                        {formatStatus(task.status)}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Link
                        href={`/deals/${task.deal.id}`}
                        className="text-xs text-blue-400 hover:underline"
                        title={task.deal.name}
                      >
                        {task.deal.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {task.dueDate ? (
                        <span className={`text-xs ${isOverdue(task.dueDate) ? "text-red-400" : "text-slate-400"}`}>
                          {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
