"use client"

// BUILD IDENTIFIER: 2026-01-20-v1 - If you see this in console, fresh code is deployed
console.log("DashboardContent BUILD: 2026-01-20-v1")

import { useState, useEffect, useCallback } from "react"
import { StatCard } from "./StatCard"
import { UpcomingMilestones } from "./UpcomingMilestones"
import { TaskList } from "./TaskList"
import { IssuesList } from "./IssuesList"
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  CircleAlert,
} from "lucide-react"

// Charts temporarily disabled - see bottom of file
// import dynamic from "next/dynamic"
// const DealsChart = dynamic(() => import("./DealsChart").then(mod => ({ default: mod.DealsChart })), {
//   ssr: false,
//   loading: () => <div className="h-[300px] bg-slate-800 rounded-lg animate-pulse" />,
// })
// const StatusPieChart = dynamic(() => import("./StatusPieChart").then(mod => ({ default: mod.StatusPieChart })), {
//   ssr: false,
//   loading: () => <div className="h-[250px] bg-slate-800 rounded-lg animate-pulse" />,
// })

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
  issue?: {
    id: string
    title: string
    status: string
    priority: string
  } | null
}

interface IssueTask {
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
  tasks?: IssueTask[]
  _count?: { tasks: number }
}

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?status=TODO,IN_PROGRESS,IN_REVIEW,BLOCKED&limit=10")
      if (res.ok) {
        const data = await res.json()
        const taskData = data.tasks || data
        setTasks(Array.isArray(taskData) ? taskData : [])
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    }
  }, [])

  const fetchIssues = useCallback(async () => {
    try {
      const res = await fetch("/api/issues?status=OPEN,IN_PROGRESS&limit=10")
      if (res.ok) {
        const data = await res.json()
        setIssues(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch issues:", error)
    }
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const statsRes = await fetch("/api/dashboard/stats")
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          // Only set stats if it looks like valid data (has expected properties)
          if (statsData && typeof statsData === 'object' && !statsData.error) {
            setStats(statsData)
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    fetchTasks()
    fetchIssues()
  }, [fetchTasks, fetchIssues])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  // Ensure arrays have defaults
  const safeTasks = Array.isArray(tasks) ? tasks : []
  const safeIssues = Array.isArray(issues) ? issues : []

  // Count tasks due this week
  const tasksDueThisWeek = safeTasks.filter((t) => {
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
          title="Open Issues"
          value={safeIssues.length}
          subtitle="Issues to resolve"
          icon={CircleAlert}
          iconColor="text-red-400"
        />
      </div>

      {/* Main Content - Tasks, Issues, and Milestones */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TaskList tasks={safeTasks} onTaskComplete={fetchTasks} />
        <IssuesList issues={safeIssues} />
      </div>

      {/* Milestones - only render if stats loaded */}
      {stats && (
        <UpcomingMilestones milestones={Array.isArray(stats.upcomingMilestones) ? stats.upcomingMilestones : []} />
      )}

      {/* Charts temporarily disabled for debugging */}
      {/* {stats && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DealsChart data={Array.isArray(stats.dealsByMonth) ? stats.dealsByMonth : []} />
          </div>
          <div>
            <StatusPieChart data={Array.isArray(stats.dealsByStatus) ? stats.dealsByStatus : []} />
          </div>
        </div>
      )} */}
    </div>
  )
}
