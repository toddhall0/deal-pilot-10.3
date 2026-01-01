"use client"

import { useState, useEffect, useCallback } from "react"
import { StatCard } from "./StatCard"
import { DealsChart } from "./DealsChart"
import { StatusPieChart } from "./StatusPieChart"
import { UpcomingMilestones } from "./UpcomingMilestones"
import { RecentActivity } from "./RecentActivity"
import { TaskList } from "./TaskList"
import {
  Briefcase,
  DollarSign,
  CheckSquare,
  AlertTriangle,
} from "lucide-react"

interface DealsByStatus {
  status: string
  count: number
}

interface DealsByMonth {
  month: string
  count: number
  value: number
}

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

interface ActivityItem {
  id: string
  action: string
  entityType: string
  entityId: string
  entityName: string | null
  metadata: unknown
  createdAt: string
  userId: string | null
  dealId: string | null
}

interface DashboardStats {
  totalDeals: number
  totalValue: number
  pendingTasks: number
  overdueTasks: number
  dealsByStatus: DealsByStatus[]
  dealsByMonth: DealsByMonth[]
  upcomingMilestones: Milestone[]
}

interface ActivityData {
  activities: ActivityItem[]
}

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

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?status=TODO,IN_PROGRESS&limit=5")
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || data)
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    }
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/activity"),
        ])

        const statsData = await statsRes.json()
        const activityData = await activityRes.json()

        setStats(statsData)
        setActivity(activityData)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    fetchTasks()
  }, [fetchTasks])

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`
    }
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount}`
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const activeDeals = stats?.dealsByStatus
    ?.filter((d) => !["CLOSED", "TERMINATED"].includes(d.status))
    .reduce((sum, d) => sum + d.count, 0) || 0

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Deals"
          value={stats?.totalDeals || 0}
          subtitle={`${activeDeals} active`}
          icon={Briefcase}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Value"
          value={formatCurrency(stats?.totalValue || 0)}
          subtitle="All deals"
          icon={DollarSign}
          iconColor="text-green-600"
        />
        <StatCard
          title="Pending Tasks"
          value={stats?.pendingTasks || 0}
          subtitle="To be completed"
          icon={CheckSquare}
          iconColor="text-purple-600"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overdueTasks || 0}
          subtitle="Needs attention"
          icon={AlertTriangle}
          iconColor="text-red-600"
        />
      </div>

      {/* Task List */}
      <TaskList tasks={tasks} onTaskComplete={fetchTasks} />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DealsChart data={stats?.dealsByMonth || []} />
        </div>
        <div>
          <StatusPieChart data={stats?.dealsByStatus || []} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingMilestones milestones={stats?.upcomingMilestones || []} />
        <RecentActivity activities={activity?.activities || []} />
      </div>
    </div>
  )
}
