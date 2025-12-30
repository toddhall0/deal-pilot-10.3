"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  CheckSquare,
  MessageSquare,
  Activity,
  Folder,
} from "lucide-react"
import Link from "next/link"

interface ActivityItem {
  id: string
  action: string
  entityType: string
  entityId: string
  entityName: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any
  createdAt: string
  userId: string | null
  dealId: string | null
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (entityType: string) => {
    switch (entityType) {
      case "DOCUMENT":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "TASK":
        return <CheckSquare className="h-4 w-4 text-green-500" />
      case "NOTE":
        return <MessageSquare className="h-4 w-4 text-purple-500" />
      case "MILESTONE":
        return <Activity className="h-4 w-4 text-orange-500" />
      default:
        return <Folder className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const formatAction = (action: string) => {
    return action
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="mt-0.5">{getActivityIcon(activity.entityType)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="text-gray-600">
                      {formatAction(activity.action)}
                    </span>
                    {activity.entityName && (
                      <span className="font-medium"> {activity.entityName}</span>
                    )}
                  </p>
                  {activity.dealId && (
                    <Link
                      href={`/deals/${activity.dealId}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View Deal
                    </Link>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
