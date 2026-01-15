"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

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

  // Format month labels
  const formattedData = data.map((item) => {
    const date = new Date(item.month + "-01")
    return {
      ...item,
      monthLabel: date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      valueInMillions: item.value / 1000000,
    }
  })

  const formatCurrency = (value: number) => {
    if (value >= 1) {
      return `$${value.toFixed(1)}M`
    }
    return `$${(value * 1000).toFixed(0)}K`
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-base text-white">Deal Activity (Last 12 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickLine={false}
                stroke="#334155"
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#f1f5f9" }}
                itemStyle={{ color: "#94a3b8" }}
                formatter={(value, name) => {
                  if (value === undefined) return [0, name || ""]
                  if (name === "Value") {
                    return [`$${(Number(value) * 1000000).toLocaleString()}`, "Value"]
                  }
                  return [value, "Deals"]
                }}
              />
              <Legend wrapperStyle={{ color: "#94a3b8" }} />
              <Bar
                yAxisId="left"
                dataKey="count"
                name="Deals"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="valueInMillions"
                name="Value"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
