"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  ArrowRight,
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
    dealNumber: string
  }
}

interface TaskListProps {
  tasks: Task[]
  onTaskComplete?: (taskId: string) => void
}

export function TaskList({ tasks, onTaskComplete }: TaskListProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-600 bg-red-50"
      case "HIGH":
        return "text-orange-600 bg-orange-50"
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const handleCheck = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      })
      onTaskComplete?.(taskId)
    } catch (error) {
      console.error("Failed to complete task:", error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-purple-600" />
          My Tasks
        </CardTitle>
        <Link href="/tasks">
          <Button variant="ghost" size="sm" className="text-sm">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <CheckSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No pending tasks</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  className="mt-1"
                  onCheckedChange={() => handleCheck(task.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      <Link
                        href={`/deals/${task.deal.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {task.deal.dealNumber}
                      </Link>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs shrink-0 ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  {task.dueDate && (
                    <div
                      className={`flex items-center gap-1 mt-1 text-xs ${
                        isOverdue(task.dueDate) ? "text-red-600" : "text-gray-500"
                      }`}
                    >
                      {isOverdue(task.dueDate) ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {isOverdue(task.dueDate)
                        ? `Overdue by ${formatDistanceToNow(new Date(task.dueDate))}`
                        : `Due ${formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
