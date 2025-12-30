"use client"

import { useEffect, useState } from "react"
import { StatCard } from "./StatCard"
import { DealsChart } from "./DealsChart"
import { StatusPieChart } from "./StatusPieChart"
import { UpcomingMilestones } from "./UpcomingMilestones"
import { RecentActivity } from "./RecentActivity"
import { Building2, DollarSign, Clock, CheckCircle } from "lucide-react"

interface DashboardStats {
  activeDeals: number
  activeDealsChange: number
  totalValue: number
  totalValueChange: number
  pendingTasks: number
  pendingTasksChange: number
  closedThisMonth: number
  closedThisMonthChange: number
  chartData: {
    month: string
    count: number
    value: number
  }[]
  statusData: {
    status: string
    count: number
  }[]
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

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/activity"),
        ])

        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
          // Extract milestones from stats if included
          if (data.upcomingMilestones) {
            setMilestones(data.upcomingMilestones)
          }
        }

        if (activityRes.ok) {
          const data = await activityRes.json()
          setActivities(data)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value}`
  }

  if (loading) {
    return <div className="animate-pulse">Loading dashboard data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Deals"
          value={stats?.activeDeals ?? 0}
          icon={Building2}
          iconColor="text-blue-600"
          trend={
            stats?.activeDealsChange
              ? {
                  value: Math.abs(stats.activeDealsChange),
                  label: "vs last month",
                  isPositive: stats.activeDealsChange >= 0,
                }
              : undefined
          }
        />
        <StatCard
          title="Total Value"
          value={formatCurrency(stats?.totalValue ?? 0)}
          icon={DollarSign}
          iconColor="text-green-600"
          trend={
            stats?.totalValueChange
              ? {
                  value: Math.abs(stats.totalValueChange),
                  label: "vs last month",
                  isPositive: stats.totalValueChange >= 0,
                }
              : undefined
          }
        />
        <StatCard
          title="Pending Tasks"
          value={stats?.pendingTasks ?? 0}
          icon={Clock}
          iconColor="text-orange-600"
          trend={
            stats?.pendingTasksChange
              ? {
                  value: Math.abs(stats.pendingTasksChange),
                  label: "vs last month",
                  isPositive: stats.pendingTasksChange <= 0, // Less pending is positive
                }
              : undefined
          }
        />
        <StatCard
          title="Closed This Month"
          value={stats?.closedThisMonth ?? 0}
          icon={CheckCircle}
          iconColor="text-emerald-600"
          trend={
            stats?.closedThisMonthChange
              ? {
                  value: Math.abs(stats.closedThisMonthChange),
                  label: "vs last month",
                  isPositive: stats.closedThisMonthChange >= 0,
                }
              : undefined
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DealsChart data={stats?.chartData ?? []} />
        </div>
        <div>
          <StatusPieChart data={stats?.statusData ?? []} />
        </div>
      </div>

      {/* Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingMilestones milestones={milestones} />
        <RecentActivity activities={activities} />
      </div>
    </div>
  )
}
