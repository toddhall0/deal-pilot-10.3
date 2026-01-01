"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  User,
  Clock,
  MessageSquare,
  Paperclip,
  Send,
  Trash2,
  Loader2,
  CheckSquare,
  AlertTriangle,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import Link from "next/link"

interface TaskComment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string
    email: string
  }
}

interface TaskDocument {
  id: string
  name: string
  originalName: string
  fileType: string
  fileSize: number
  fileUrl: string
  createdAt: string
}

interface TaskDetail {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  startDate: string | null
  dueDate: string | null
  completedAt: string | null
  createdAt: string
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
  comments: TaskComment[]
  documents: TaskDocument[]
}

interface TeamMember {
  id: string
  name: string
  email: string
}

interface TaskDetailDialogProps {
  taskId: string | null
  dealId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated?: () => void
}

export function TaskDetailDialog({
  taskId,
  dealId,
  open,
  onOpenChange,
  onTaskUpdated,
}: TaskDetailDialogProps) {
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isAddingComment, setIsAddingComment] = useState(false)

  // Edit states
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [editPriority, setEditPriority] = useState("")
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined)
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(undefined)
  const [editAssigneeId, setEditAssigneeId] = useState("")

  useEffect(() => {
    if (open && taskId) {
      fetchTask()
      fetchTeamMembers()
    }
  }, [open, taskId])

  useEffect(() => {
    if (task) {
      setEditTitle(task.title)
      setEditDescription(task.description || "")
      setEditStatus(task.status)
      setEditPriority(task.priority)
      setEditStartDate(task.startDate ? new Date(task.startDate) : undefined)
      setEditDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
      setEditAssigneeId(task.assignee?.id || "")
    }
  }, [task])

  async function fetchTeamMembers() {
    try {
      const res = await fetch("/api/team-members")
      if (res.ok) {
        const data = await res.json()
        setTeamMembers(data)
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error)
    }
  }

  async function fetchTask() {
    if (!taskId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/deals/${dealId}/tasks/${taskId}`)
      if (res.ok) {
        const data = await res.json()
        setTask(data)
      }
    } catch (error) {
      console.error("Failed to fetch task:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    if (!task) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/deals/${dealId}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          status: editStatus,
          priority: editPriority,
          startDate: editStartDate ? format(editStartDate, "yyyy-MM-dd") : null,
          dueDate: editDueDate ? format(editDueDate, "yyyy-MM-dd") : null,
          assigneeId: editAssigneeId || null,
        }),
      })

      if (res.ok) {
        await fetchTask()
        onTaskUpdated?.()
      }
    } catch (error) {
      console.error("Failed to save task:", error)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAddComment() {
    if (!task || !newComment.trim()) return
    setIsAddingComment(true)
    try {
      const res = await fetch(`/api/deals/${dealId}/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })

      if (res.ok) {
        setNewComment("")
        await fetchTask()
      }
    } catch (error) {
      console.error("Failed to add comment:", error)
    } finally {
      setIsAddingComment(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!task) return
    try {
      const res = await fetch(
        `/api/deals/${dealId}/tasks/${task.id}/comments/${commentId}`,
        { method: "DELETE" }
      )
      if (res.ok) {
        await fetchTask()
      }
    } catch (error) {
      console.error("Failed to delete comment:", error)
    }
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

  const isOverdue = task?.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-slate-900 border-slate-800">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : task ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-purple-400" />
                Task Details
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-120px)]">
              <div className="space-y-6 pr-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-slate-400">Title</Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                {/* Status & Priority Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-400">Status</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
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
                  <div className="space-y-2">
                    <Label className="text-slate-400">Priority</Label>
                    <Select value={editPriority} onValueChange={setEditPriority}>
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

                {/* Dates Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-400">Start Date</Label>
                    <DatePicker
                      date={editStartDate}
                      onDateChange={setEditStartDate}
                      placeholder="Select start date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400 flex items-center gap-2">
                      Due Date
                      {isOverdue && (
                        <span className="text-red-400 text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Overdue
                        </span>
                      )}
                    </Label>
                    <DatePicker
                      date={editDueDate}
                      onDateChange={setEditDueDate}
                      placeholder="Select due date"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-slate-400">Description</Label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Add a description..."
                    className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                  />
                </div>

                {/* Save Button */}
                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>

                <Separator className="bg-slate-800" />

                {/* People Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    People
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">Created by</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs">
                            {task.createdBy.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-white">{task.createdBy.name}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400">Assigned to</Label>
                      <Select
                        value={editAssigneeId}
                        onValueChange={setEditAssigneeId}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Deal Link */}
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">Deal</p>
                  <Link href={`/deals/${task.deal.id}`} className="text-blue-400 hover:underline">
                    {task.deal.dealNumber} - {task.deal.name}
                  </Link>
                </div>

                {/* Timestamps */}
                <div className="flex gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                  </div>
                  {task.completedAt && (
                    <div className="flex items-center gap-1 text-green-400">
                      <CheckSquare className="h-3 w-3" />
                      Completed {format(new Date(task.completedAt), "MMM d, yyyy")}
                    </div>
                  )}
                </div>

                <Separator className="bg-slate-800" />

                {/* Documents Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-slate-400" />
                    Documents ({task.documents.length})
                  </h3>
                  {task.documents.length === 0 ? (
                    <p className="text-sm text-slate-500">No documents attached</p>
                  ) : (
                    <div className="space-y-2">
                      {task.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-white">{doc.name}</span>
                            <span className="text-xs text-slate-500">
                              ({(doc.fileSize / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 text-sm hover:underline"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator className="bg-slate-800" />

                {/* Comments Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                    Notes & Comments ({task.comments.length})
                  </h3>

                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a note or comment..."
                      className="bg-slate-800 border-slate-700 text-white min-h-[60px]"
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={isAddingComment || !newComment.trim()}
                      size="icon"
                      className="h-auto"
                    >
                      {isAddingComment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3">
                    {task.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-slate-600 text-slate-300 text-xs">
                                {comment.author.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-white">
                              {comment.author.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-red-400"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="text-center py-12 text-slate-400">
            Task not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
