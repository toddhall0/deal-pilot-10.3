"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useResizableColumns } from "@/hooks/useResizableColumns"
import {
  AlertTriangle,
  ArrowRight,
  CheckSquare,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Task {
  id: string
  title: string
  status: string
}

interface Issue {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  createdAt: string
  deal: {
    id: string
    name: string
    dealNumber: string
  }
  tasks?: Task[]
  _count?: { tasks: number }
}

interface IssuesListProps {
  issues: Issue[]
}

const columnConfig = [
  { key: "issue", initialWidth: 160, minWidth: 100 },
  { key: "priority", initialWidth: 70, minWidth: 60 },
  { key: "status", initialWidth: 85, minWidth: 70 },
  { key: "tasks", initialWidth: 50, minWidth: 40 },
  { key: "deal", initialWidth: 80, minWidth: 60 },
  { key: "created", initialWidth: 90, minWidth: 70 },
]

export function IssuesList({ issues }: IssuesListProps) {
  // Guard against undefined issues
  const safeIssues = issues || []
  const { getColumnWidth, ResizeHandle } = useResizableColumns(columnConfig, "dashboard-issues")

  const priorityColors: Record<string, string> = {
    LOW: "bg-slate-500/20 text-slate-300",
    MEDIUM: "bg-blue-500/20 text-blue-400",
    HIGH: "bg-orange-500/20 text-orange-400",
    CRITICAL: "bg-red-500/20 text-red-400",
  }

  const statusColors: Record<string, string> = {
    OPEN: "bg-red-500/20 text-red-400",
    IN_PROGRESS: "bg-yellow-500/20 text-yellow-400",
    RESOLVED: "bg-green-500/20 text-green-400",
    CLOSED: "bg-slate-500/20 text-slate-400",
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ")
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2 text-white">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          Open Issues
          {safeIssues.length > 0 && (
            <Badge className="bg-red-500/20 text-red-400 ml-1">
              {safeIssues.length}
            </Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-sm text-slate-400 hover:text-white" disabled>
          View All
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {safeIssues.length === 0 ? (
          <div className="text-center py-6 text-slate-500 px-6">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-slate-600" />
            <p>No open issues</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[400px]">
            <table className="min-w-full" style={{ tableLayout: "fixed" }}>
              <thead className="sticky top-0 bg-slate-800 z-10">
                <tr className="border-b border-slate-700">
                  <th
                    className="text-left text-xs font-medium text-slate-400 px-3 py-2 whitespace-nowrap relative group"
                    style={{ width: getColumnWidth("issue") }}
                  >
                    Issue
                    <ResizeHandle columnKey="issue" />
                  </th>
                  <th
                    className="text-left text-xs font-medium text-slate-400 px-3 py-2 whitespace-nowrap relative group"
                    style={{ width: getColumnWidth("priority") }}
                  >
                    Priority
                    <ResizeHandle columnKey="priority" />
                  </th>
                  <th
                    className="text-left text-xs font-medium text-slate-400 px-3 py-2 whitespace-nowrap relative group"
                    style={{ width: getColumnWidth("status") }}
                  >
                    Status
                    <ResizeHandle columnKey="status" />
                  </th>
                  <th
                    className="text-left text-xs font-medium text-slate-400 px-3 py-2 whitespace-nowrap relative group"
                    style={{ width: getColumnWidth("tasks") }}
                  >
                    Tasks
                    <ResizeHandle columnKey="tasks" />
                  </th>
                  <th
                    className="text-left text-xs font-medium text-slate-400 px-3 py-2 whitespace-nowrap relative group"
                    style={{ width: getColumnWidth("deal") }}
                  >
                    Deal
                    <ResizeHandle columnKey="deal" />
                  </th>
                  <th
                    className="text-left text-xs font-medium text-slate-400 px-3 py-2 whitespace-nowrap relative group"
                    style={{ width: getColumnWidth("created") }}
                  >
                    Created
                    <ResizeHandle columnKey="created" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {safeIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {issue.priority === "CRITICAL" && (
                          <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                        )}
                        <Link
                          href={`/issues/${issue.id}`}
                          className="font-medium text-sm text-white hover:underline"
                        >
                          {issue.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Badge className={`${priorityColors[issue.priority]} text-xs`}>
                        {issue.priority}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Badge className={`${statusColors[issue.status]} text-xs`}>
                        {formatStatus(issue.status)}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {(issue._count?.tasks || issue.tasks?.length) ? (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <CheckSquare className="h-3 w-3" />
                          {issue._count?.tasks || issue.tasks?.length}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Link
                        href={`/deals/${issue.deal.id}`}
                        className="text-xs text-blue-400 hover:underline"
                        title={issue.deal.name}
                      >
                        {issue.deal.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                      </span>
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
