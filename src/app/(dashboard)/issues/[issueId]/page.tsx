"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  User,
} from "lucide-react"
import { IssueNotes } from "@/components/issues/IssueNotes"
import { IssueTasks } from "@/components/issues/IssueTasks"
import { IssueDocuments } from "@/components/issues/IssueDocuments"
import { formatDistanceToNow, format } from "date-fns"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  assignee: {
    id: string
    name: string
    email: string
  } | null
}

interface Issue {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  deal: {
    id: string
    name: string
    dealNumber: string
  }
  author: {
    id: string
    name: string
    email: string
  }
  tasks: Task[]
  _count: {
    tasks: number
  }
}

const priorityColors: Record<string, string> = {
  LOW: "bg-slate-500/20 text-slate-300",
  MEDIUM: "bg-blue-500/20 text-blue-400",
  HIGH: "bg-orange-500/20 text-orange-400",
  CRITICAL: "bg-red-500/20 text-red-400",
}

const statusConfig: Record<string, { color: string; icon: typeof AlertTriangle; label: string }> = {
  OPEN: { color: "bg-red-500/20 text-red-400", icon: AlertTriangle, label: "Open" },
  IN_PROGRESS: { color: "bg-yellow-500/20 text-yellow-400", icon: Clock, label: "In Progress" },
  RESOLVED: { color: "bg-green-500/20 text-green-400", icon: CheckCircle, label: "Resolved" },
  CLOSED: { color: "bg-slate-500/20 text-slate-400", icon: XCircle, label: "Closed" },
}


export default function IssueDetailPage({
  params,
}: {
  params: Promise<{ issueId: string }>
}) {
  const { issueId } = use(params)
  const router = useRouter()
  const [issue, setIssue] = useState<Issue | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIssue()
  }, [issueId])

  async function fetchIssue() {
    try {
      const response = await fetch(`/api/issues/${issueId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError("Issue not found")
        } else {
          setError("Failed to load issue")
        }
        return
      }
      const data = await response.json()
      setIssue(data)
    } catch (err) {
      console.error("Failed to fetch issue:", err)
      setError("Failed to load issue")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!issue) return
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        const updatedIssue = await response.json()
        setIssue(updatedIssue)
      }
    } catch (err) {
      console.error("Failed to update status:", err)
    }
  }

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

  if (error || !issue) {
    return (
      <div className="p-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-10 text-center">
            <p className="text-slate-400">{error || "Issue not found"}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const StatusIcon = statusConfig[issue.status]?.icon || AlertTriangle
  const isResolved = issue.status === "RESOLVED" || issue.status === "CLOSED"

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
              href={`/deals/${issue.deal.id}`}
              className="hover:text-blue-400 transition-colors"
            >
              {issue.deal.name}
            </Link>
            <span>/</span>
            <Link
              href={`/deals/${issue.deal.id}?tab=issues`}
              className="hover:text-blue-400 transition-colors"
            >
              Issues
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <StatusIcon className={`h-6 w-6 ${statusConfig[issue.status]?.color.split(" ")[1]}`} />
            <span className={isResolved ? "text-slate-400" : ""}>
              {issue.title}
            </span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-white">
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              {issue.description ? (
                <p className="text-slate-300 whitespace-pre-wrap">
                  {issue.description}
                </p>
              ) : (
                <p className="text-slate-500 italic">No description provided</p>
              )}
            </CardContent>
          </Card>

          {/* Tasks */}
          <IssueTasks
            issueId={issueId}
            dealId={issue.deal.id}
            tasks={issue.tasks}
            onTaskCreated={fetchIssue}
          />

          {/* Documents */}
          <IssueDocuments issueId={issueId} dealId={issue.deal.id} />

          {/* Notes */}
          <IssueNotes issueId={issueId} />
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
                <Select value={issue.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <Badge className={statusConfig[issue.status]?.color}>
                      {statusConfig[issue.status]?.label}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Priority</label>
                <Badge className={priorityColors[issue.priority]}>
                  {issue.priority}
                </Badge>
              </div>

              {/* Resolved At */}
              {issue.resolvedAt && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Resolved
                  </label>
                  <p className="text-sm text-green-400">
                    {format(new Date(issue.resolvedAt), "MMM d, yyyy")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Author */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                Reported By
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-white">
                  {issue.author.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-white">{issue.author.name}</p>
                  <p className="text-xs text-slate-500">{issue.author.email}</p>
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
                href={`/deals/${issue.deal.id}`}
                className="flex items-center justify-between p-3 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-white">{issue.deal.name}</p>
                  <p className="text-xs text-slate-500">{issue.deal.dealNumber}</p>
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
                  {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Updated</span>
                <span className="text-slate-300">
                  {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
