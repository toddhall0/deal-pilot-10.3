"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Clock,
  AlertTriangle,
  Send,
  Download,
  ExternalLink,
  Edit2,
  CheckCircle2,
  Circle,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
}

interface Document {
  id: string
  name: string
  originalName: string
  fileType: string
  fileSize: number
  fileUrl: string
  category: string
  createdAt: string
  uploadedBy: {
    id: string
    name: string
  }
}

interface Subtask {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  assignee: {
    id: string
    name: string
    email: string
  } | null
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  startDate: string | null
  completedAt: string | null
  category: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
  deal: {
    id: string
    name: string
    dealNumber: string
  }
  assignee: {
    id: string
    name: string
    email: string
  } | null
  createdBy: {
    id: string
    name: string
    email: string
  }
  comments: Comment[]
  documents: Document[]
  subtasks: Subtask[]
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

const statusLabels: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = use(params)
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  useEffect(() => {
    fetchTask()
  }, [taskId])

  async function fetchTask() {
    try {
      const response = await fetch(`/api/tasks/${taskId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError("Task not found")
        } else {
          setError("Failed to load task")
        }
        return
      }
      const data = await response.json()
      setTask(data)
    } catch (err) {
      console.error("Failed to fetch task:", err)
      setError("Failed to load task")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!task) return
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        const updatedTask = await response.json()
        setTask((prev) => (prev ? { ...prev, ...updatedTask } : null))
      }
    } catch (err) {
      console.error("Failed to update status:", err)
    }
  }

  async function handleAddComment() {
    if (!newComment.trim() || !task) return
    setIsSubmittingComment(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })
      if (response.ok) {
        const comment = await response.json()
        setTask((prev) =>
          prev ? { ...prev, comments: [comment, ...prev.comments] } : null
        )
        setNewComment("")
      }
    } catch (err) {
      console.error("Failed to add comment:", err)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const isOverdue =
    task?.dueDate &&
    task.status !== "COMPLETED" &&
    task.status !== "CANCELLED" &&
    new Date(task.dueDate) < new Date()

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-800 rounded w-1/4"></div>
          <div className="h-32 bg-slate-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="p-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-10 text-center">
            <p className="text-slate-400">{error || "Task not found"}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/tasks")}
            >
              Back to Tasks
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <span>/</span>
            <Link
              href={`/deals/${task.deal.id}`}
              className="hover:text-blue-400 transition-colors"
            >
              {task.deal.name}
            </Link>
            <span>/</span>
            <span className="text-slate-300">Task</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            {task.status === "COMPLETED" ? (
              <CheckCircle2 className="h-6 w-6 text-green-400" />
            ) : (
              <Circle className="h-6 w-6 text-slate-400" />
            )}
            <span
              className={task.status === "COMPLETED" ? "line-through text-slate-400" : ""}
            >
              {task.title}
            </span>
            {isOverdue && (
              <AlertTriangle className="h-5 w-5 text-red-400" />
            )}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              {task.description ? (
                <p className="text-slate-300 whitespace-pre-wrap">
                  {task.description}
                </p>
              ) : (
                <p className="text-slate-500 italic">No description provided</p>
              )}
            </CardContent>
          </Card>

          {/* Subtasks */}
          {task.subtasks.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-400" />
                  Subtasks ({task.subtasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center justify-between p-2 rounded bg-slate-800/50"
                    >
                      <div className="flex items-center gap-2">
                        {subtask.status === "COMPLETED" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-400" />
                        )}
                        <span
                          className={`text-sm ${
                            subtask.status === "COMPLETED"
                              ? "text-slate-400 line-through"
                              : "text-white"
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </div>
                      <Badge className={`${priorityColors[subtask.priority]} text-xs`}>
                        {subtask.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-400" />
                Comments ({task.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Comment Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Comments List */}
              {task.comments.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No comments yet</p>
              ) : (
                <div className="space-y-4">
                  {task.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3 rounded bg-slate-800/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-white">
                            {comment.author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white">
                            {comment.author.name}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                Documents ({task.documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {task.documents.length === 0 ? (
                <p className="text-slate-500 text-center py-4">
                  No documents attached
                </p>
              ) : (
                <div className="space-y-2">
                  {task.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-white">
                            {doc.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(doc.fileSize)} | Uploaded by{" "}
                            {doc.uploadedBy.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <a
                          href={doc.fileUrl}
                          download={doc.originalName}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-white">
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Status</label>
                <Select value={task.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <Badge className={`${statusColors[task.status]}`}>
                      {statusLabels[task.status]}
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

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Priority</label>
                <Badge className={`${priorityColors[task.priority]}`}>
                  {task.priority}
                </Badge>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due Date
                </label>
                {task.dueDate ? (
                  <p
                    className={`text-sm ${
                      isOverdue ? "text-red-400" : "text-slate-300"
                    }`}
                  >
                    {format(new Date(task.dueDate), "MMM d, yyyy")}
                    {isOverdue && " (Overdue)"}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">Not set</p>
                )}
              </div>

              {/* Start Date */}
              {task.startDate && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Start Date
                  </label>
                  <p className="text-sm text-slate-300">
                    {format(new Date(task.startDate), "MMM d, yyyy")}
                  </p>
                </div>
              )}

              {/* Completed At */}
              {task.completedAt && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </label>
                  <p className="text-sm text-green-400">
                    {format(new Date(task.completedAt), "MMM d, yyyy")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* People */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                People
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assignee */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Assignee</label>
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-white">
                      {task.assignee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-white">{task.assignee.name}</p>
                      <p className="text-xs text-slate-500">{task.assignee.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Unassigned</p>
                )}
              </div>

              {/* Created By */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Created by</label>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-white">
                    {task.createdBy.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-white">{task.createdBy.name}</p>
                    <p className="text-xs text-slate-500">{task.createdBy.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deal Info */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-white">
                Deal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/deals/${task.deal.id}`}
                className="flex items-center justify-between p-3 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-white">{task.deal.name}</p>
                  <p className="text-xs text-slate-500">{task.deal.dealNumber}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </Link>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-white">
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Created</span>
                <span className="text-slate-300">
                  {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Updated</span>
                <span className="text-slate-300">
                  {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
