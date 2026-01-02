"use client"

import { useState, useEffect, useCallback } from "react"
import { StatCard } from "./StatCard"
import { DealsChart } from "./DealsChart"
import { StatusPieChart } from "./StatusPieChart"
import { UpcomingMilestones } from "./UpcomingMilestones"
import { TaskList } from "./TaskList"
import {
  CheckSquare,
  AlertTriangle,
  Calendar,
  Clock,
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

interface DashboardStats {
  totalDeals: number
  totalValue: number
  pendingTasks: number
  overdueTasks: number
  dealsByStatus: DealsByStatus[]
  dealsByMonth: DealsByMonth[]
  upcomingMilestones: Milestone[]
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  deal: {
    id: string
    name: string
    dealNumber: string
  }
}

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?status=TODO,IN_PROGRESS,IN_REVIEW,BLOCKED&limit=10")
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
        const statsRes = await fetch("/api/dashboard/stats")
        const statsData = await statsRes.json()
        setStats(statsData)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    fetchTasks()
  }, [fetchTasks])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  // Count tasks due this week
  const tasksDueThisWeek = tasks.filter((t) => {
    if (!t.dueDate) return false
    const dueDate = new Date(t.dueDate)
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return dueDate >= now && dueDate <= weekFromNow
  }).length

  return (
    <div className="space-y-6">
      {/* Stat Cards - Task Focused */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Tasks"
          value={stats?.pendingTasks || 0}
          subtitle="To be completed"
          icon={CheckSquare}
          iconColor="text-purple-400"
        />
        <StatCard
          title="Overdue"
          value={stats?.overdueTasks || 0}
          subtitle="Needs immediate attention"
          icon={AlertTriangle}
          iconColor="text-red-400"
        />
        <StatCard
          title="Due This Week"
          value={tasksDueThisWeek}
          subtitle="Tasks with upcoming deadlines"
          icon={Clock}
          iconColor="text-yellow-400"
        />
        <StatCard
          title="Upcoming Milestones"
          value={stats?.upcomingMilestones?.length || 0}
          subtitle="Key dates this week"
          icon={Calendar}
          iconColor="text-blue-400"
        />
      </div>

      {/* Main Content - Tasks and Milestones Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TaskList tasks={tasks} onTaskComplete={fetchTasks} />
        <UpcomingMilestones milestones={stats?.upcomingMilestones || []} />
      </div>

      {/* Charts - Secondary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DealsChart data={stats?.dealsByMonth || []} />
        </div>
        <div>
          <StatusPieChart data={stats?.dealsByStatus || []} />
        </div>
      </div>
    </div>
  )
}
