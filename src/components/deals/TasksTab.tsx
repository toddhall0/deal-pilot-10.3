"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  assignee: { id: string; name: string } | null
}

interface TasksTabProps {
  dealId: string
}

export function TasksTab({ dealId }: TasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
  })

  useEffect(() => {
    fetchTasks()
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

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch(`/api/deals/${dealId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      })

      if (response.ok) {
        const task = await response.json()
        setTasks([task, ...tasks])
        setIsDialogOpen(false)
        setNewTask({ title: "", description: "", priority: "MEDIUM", dueDate: "" })
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Tasks ({tasks.length})</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, priority: value })
                    }
                  >
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
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
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
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">No tasks yet. Add your first task!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
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
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {task.dueDate && (
                      <span className="text-sm text-gray-500">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    <Select
                      value={task.status}
                      onValueChange={(value) =>
                        handleStatusChange(task.id, value)
                      }
                    >
                      <SelectTrigger className="w-32">
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
      )}
    </div>
  )
}
