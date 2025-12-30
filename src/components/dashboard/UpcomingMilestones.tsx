"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface Milestone {
  id: string
  name: string
  dueDate: string
  status: string
  timeline: {
    deal: {
      id: string
      dealNumber: string
      propertyName: string | null
    }
  }
}

interface UpcomingMilestonesProps {
  milestones: Milestone[]
}

export function UpcomingMilestones({ milestones }: UpcomingMilestonesProps) {
  const getDaysUntil = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Upcoming Milestones
        </CardTitle>
        <Badge variant="secondary">{milestones.length}</Badge>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            No upcoming milestones this week
          </p>
        ) : (
          <div className="space-y-3">
            {milestones.map((milestone) => {
              const daysUntil = getDaysUntil(milestone.dueDate)
              const isUrgent = daysUntil <= 1

              return (
                <Link
                  key={milestone.id}
                  href={`/deals/${milestone.timeline.deal.id}?tab=timeline`}
                  className="block"
                >
                  <div
                    className={`p-3 rounded-lg border hover:bg-gray-50 transition-colors ${
                      isUrgent ? "border-orange-200 bg-orange-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {milestone.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {milestone.timeline.deal.dealNumber}
                          {milestone.timeline.deal.propertyName &&
                            ` • ${milestone.timeline.deal.propertyName}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs ml-2">
                        {isUrgent ? (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        ) : (
                          <Clock className="h-3 w-3 text-gray-400" />
                        )}
                        <span
                          className={
                            isUrgent
                              ? "text-orange-600 font-medium"
                              : "text-gray-500"
                          }
                        >
                          {daysUntil === 0
                            ? "Today"
                            : daysUntil === 1
                            ? "Tomorrow"
                            : `${daysUntil} days`}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(milestone.dueDate)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
