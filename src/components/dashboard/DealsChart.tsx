"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Recharts temporarily disabled for debugging
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   Legend,
// } from "recharts"

interface DealsChartProps {
  data: {
    month: string
    count: number
    value: number
  }[]
}

export function DealsChart({ data }: DealsChartProps) {
  // Guard against undefined or empty data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-base text-white">Deal Activity (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-slate-400">
            No deal data available
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter out any malformed items and format valid ones
  const formattedData = data
    .filter((item) => item && typeof item.month === 'string' && typeof item.count === 'number')
    .map((item) => {
      try {
        const date = new Date(item.month + "-01")
        return {
          ...item,
          monthLabel: isNaN(date.getTime()) ? item.month : date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          }),
          valueInMillions: (item.value || 0) / 1000000,
        }
      } catch {
        return null
      }
    })
    .filter(Boolean)

  // Return empty state if no valid data after filtering
  if (formattedData.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-base text-white">Deal Activity (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-slate-400">
            No deal data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (value: number) => {
    if (value >= 1) {
      return `$${value.toFixed(1)}M`
    }
    return `$${(value * 1000).toFixed(0)}K`
  }

  // Charts temporarily disabled - return placeholder
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-base text-white">Deal Activity (Last 12 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center text-slate-400">
          Charts temporarily disabled
        </div>
      </CardContent>
    </Card>
  )
}
