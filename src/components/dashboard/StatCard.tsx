"use client"

import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-400",
  trend,
}: StatCardProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            )}
            {trend && (
              <div className="mt-2 flex items-center text-sm">
                <span
                  className={
                    trend.isPositive ? "text-green-400" : "text-red-400"
                  }
                >
                  {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                </span>
                <span className="ml-2 text-slate-400">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-slate-700 ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
