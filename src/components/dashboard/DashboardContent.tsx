"use client"

// BUILD IDENTIFIER: 2026-01-20-v5 - Testing StatCard only
console.log("DashboardContent BUILD: 2026-01-20-v5 - StatCard only")

import { useState, useEffect } from "react"
import { StatCard } from "./StatCard"
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  CircleAlert,
} from "lucide-react"

export function DashboardContent() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="p-4 text-white">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Tasks"
          value={0}
          subtitle="To be completed"
          icon={CheckSquare}
          iconColor="text-purple-400"
        />
        <StatCard
          title="Overdue"
          value={0}
          subtitle="Needs immediate attention"
          icon={AlertTriangle}
          iconColor="text-red-400"
        />
        <StatCard
          title="Due This Week"
          value={0}
          subtitle="Tasks with upcoming deadlines"
          icon={Clock}
          iconColor="text-yellow-400"
        />
        <StatCard
          title="Open Issues"
          value={0}
          subtitle="Issues to resolve"
          icon={CircleAlert}
          iconColor="text-red-400"
        />
      </div>
    </div>
  )
}
