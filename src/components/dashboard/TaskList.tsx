"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
    dealNumber: string
  }
}

interface TaskListProps {
  tasks: Task[]
  onTaskComplete?: (taskId: string) => void
}

export function TaskList({ tasks, onTaskComplete }: TaskListProps) {
  const priorityColors: Record<string, string> = {
    LOW: "bg-slate-500/20 text-slate-300",
    MEDIUM: "bg-blue-500/20 text-blue-400",
    HIGH: "bg-orange-500/20 text-orange-400",
    URGENT: "bg-red-500/20 text-red-400",
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
    <Card className="bg-slate-900 border-slate-800">
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="w-8 px-3 py-2"></th>
                <th className="text-left text-xs font-medium text-slate-400 px-3 py-2">Task</th>
                <th className="text-left text-xs font-medium text-slate-400 px-3 py-2 w-20">Priority</th>
                <th className="text-left text-xs font-medium text-slate-400 px-3 py-2 w-20">Deal</th>
                <th className="text-left text-xs font-medium text-slate-400 px-3 py-2 w-28">Due</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-3 py-2">
                    <Checkbox
                      className="border-slate-600"
                      onCheckedChange={() => handleCheck(task.id)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white truncate">{task.title}</span>
                      {isOverdue(task.dueDate) && (
                        <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge className={`${priorityColors[task.priority]} text-xs`}>
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/deals/${task.deal.id}`}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      {task.deal.dealNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
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
        )}
      </CardContent>
    </Card>
  )
}
