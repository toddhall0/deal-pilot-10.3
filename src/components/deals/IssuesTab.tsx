"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react"

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
}

interface Issue {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  author: { id: string; name: string }
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  tasks?: Task[]
  _count?: { tasks: number }
}

interface IssuesTabProps {
  dealId: string
}

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open", icon: AlertTriangle, color: "bg-red-500/20 text-red-400" },
  { value: "IN_PROGRESS", label: "In Progress", icon: Clock, color: "bg-yellow-500/20 text-yellow-400" },
  { value: "RESOLVED", label: "Resolved", icon: CheckCircle, color: "bg-green-500/20 text-green-400" },
  { value: "CLOSED", label: "Closed", icon: XCircle, color: "bg-slate-500/20 text-slate-400" },
]

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low", color: "bg-slate-500/20 text-slate-300" },
  { value: "MEDIUM", label: "Medium", color: "bg-blue-500/20 text-blue-400" },
  { value: "HIGH", label: "High", color: "bg-orange-500/20 text-orange-400" },
  { value: "CRITICAL", label: "Critical", color: "bg-red-500/20 text-red-400" },
]

export function IssuesTab({ dealId }: IssuesTabProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "OPEN",
  })

  useEffect(() => {
    fetchIssues()
  }, [dealId, statusFilter])

  async function fetchIssues() {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "ALL") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/deals/${dealId}/issues?${params.toString()}`)
      const data = await response.json()
      setIssues(data)
    } catch (error) {
      console.error("Failed to fetch issues:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      title: "",
      description: "",
      priority: "MEDIUM",
      status: "OPEN",
    })
    setEditingIssue(null)
  }

  function handleEdit(issue: Issue) {
    setEditingIssue(issue)
    setFormData({
      title: issue.title,
      description: issue.description || "",
      priority: issue.priority,
      status: issue.status,
    })
    setIsDialogOpen(true)
  }

  function handleNewIssue() {
    resetForm()
    setIsDialogOpen(true)
  }

  async function handleSave() {
    const url = editingIssue
      ? `/api/deals/${dealId}/issues/${editingIssue.id}`
      : `/api/deals/${dealId}/issues`

    const response = await fetch(url, {
      method: editingIssue ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })

    if (response.ok) {
      setIsDialogOpen(false)
      resetForm()
      fetchIssues()
    }
  }

  async function handleDelete(issueId: string) {
    if (!confirm("Are you sure you want to delete this issue?")) return

    try {
      await fetch(`/api/deals/${dealId}/issues/${issueId}`, {
        method: "DELETE",
      })
      setIssues(issues.filter((i) => i.id !== issueId))
    } catch (error) {
      console.error("Failed to delete issue:", error)
    }
  }

  async function handleStatusChange(issueId: string, newStatus: string) {
    try {
      await fetch(`/api/deals/${dealId}/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchIssues()
    } catch (error) {
      console.error("Failed to update status:", error)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  function getStatusConfig(status: string) {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0]
  }

  function getPriorityConfig(priority: string) {
    return PRIORITY_OPTIONS.find((p) => p.value === priority) || PRIORITY_OPTIONS[1]
  }

  if (isLoading) {
    return <div className="p-4">Loading issues...</div>
  }

  const openIssues = issues.filter((i) => i.status === "OPEN" || i.status === "IN_PROGRESS").length

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">
            Issues ({issues.length})
            {openIssues > 0 && (
              <span className="ml-2 text-sm text-red-400">
                {openIssues} open
              </span>
            )}
          </h2>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleNewIssue}>
          <Plus className="mr-2 h-4 w-4" />
          Add Issue
        </Button>
      </div>

      {/* Issues List */}
      {issues.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-10 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-slate-600 mb-2" />
            <p className="text-slate-400 mb-4">No issues to resolve</p>
            <Button onClick={handleNewIssue}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first issue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => {
            const statusConfig = getStatusConfig(issue.status)
            const priorityConfig = getPriorityConfig(issue.priority)
            const StatusIcon = statusConfig.icon

            return (
              <Card
                key={issue.id}
                className={`group bg-slate-900 border-slate-800 ${
                  issue.status === "RESOLVED" || issue.status === "CLOSED"
                    ? "opacity-60"
                    : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <StatusIcon className={`h-5 w-5 mt-0.5 ${statusConfig.color.split(" ")[1]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-medium text-white">{issue.title}</h3>
                          <Badge className={priorityConfig.color}>
                            {priorityConfig.label}
                          </Badge>
                          <Badge className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                        </div>

                        {issue.description && (
                          <p className="text-sm text-slate-300 mb-2">
                            {issue.description}
                          </p>
                        )}

                        {/* Assigned Tasks */}
                        {issue.tasks && issue.tasks.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-700">
                            <p className="text-xs text-slate-500 mb-1">
                              Assigned Tasks ({issue._count?.tasks || issue.tasks.length})
                            </p>
                            <div className="space-y-1">
                              {issue.tasks.slice(0, 3).map((task) => (
                                <Link
                                  key={task.id}
                                  href={`/tasks/${task.id}`}
                                  className="flex items-center gap-2 text-xs text-slate-300 hover:text-blue-400"
                                >
                                  <Badge className={`text-xs py-0 ${
                                    task.status === "IN_PROGRESS" ? "bg-blue-500/20 text-blue-400" :
                                    task.status === "BLOCKED" ? "bg-red-500/20 text-red-400" :
                                    "bg-slate-500/20 text-slate-400"
                                  }`}>
                                    {task.status.replace(/_/g, " ")}
                                  </Badge>
                                  <span className="truncate">{task.title}</span>
                                </Link>
                              ))}
                              {(issue._count?.tasks || issue.tasks.length) > 3 && (
                                <p className="text-xs text-slate-500">
                                  +{(issue._count?.tasks || issue.tasks.length) - 3} more
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-slate-400 mt-2">
                          {issue.author.name} • {formatDate(issue.createdAt)}
                          {issue.resolvedAt && ` • Resolved ${formatDate(issue.resolvedAt)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {(issue.status === "OPEN" || issue.status === "IN_PROGRESS") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(issue.id, "RESOLVED")}
                          className="text-green-400 border-green-400/50 hover:bg-green-400/10"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(issue)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {issue.status === "RESOLVED" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(issue.id, "OPEN")}
                            >
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Reopen
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(issue.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Issue Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIssue ? "Edit Issue" : "Add Issue"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Describe the issue briefly"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add more details about the issue..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!formData.title.trim()}>
                {editingIssue ? "Save Changes" : "Add Issue"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
