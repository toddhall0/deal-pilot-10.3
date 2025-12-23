"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<GroupBy>("status")
  const [sortBy, setSortBy] = useState<SortBy>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterStatus, setFilterStatus] = useState<string>("all")

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
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800",
  }

  const statusColors: Record<string, string> = {
    TODO: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    IN_REVIEW: "bg-purple-100 text-purple-800",
    BLOCKED: "bg-red-100 text-red-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-500",
  }

  if (isLoading) {
    return <div className="p-4">Loading tasks...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Group by:</span>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="w-32">
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
          <span className="text-sm text-gray-500">Sort by:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-32">
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
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filter:</span>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
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
      <p className="text-sm text-gray-500 mb-4">
        Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
      </p>

      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">No tasks found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([group, groupTasks]) => (
            <div key={group}>
              {groupBy !== "none" && (
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {group}
                  <span className="text-sm font-normal text-gray-500">
                    ({groupTasks.length})
                  </span>
                </h2>
              )}
              <div className="space-y-2">
                {groupTasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{task.title}</span>
                            <Badge className={priorityColors[task.priority]}>
                              {task.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Link
                              href={`/deals/${task.deal.id}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {task.deal.dealNumber}
                            </Link>
                            <span className="text-sm text-gray-500">
                              {task.deal.name}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {task.assignee && (
                            <span className="text-sm text-gray-500">
                              {task.assignee.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-sm text-gray-500">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <Select
                            value={task.status}
                            onValueChange={(value) =>
                              handleStatusChange(task.id, task.deal.id, value)
                            }
                          >
                            <SelectTrigger className="w-36">
                              <Badge className={statusColors[task.status]}>
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
