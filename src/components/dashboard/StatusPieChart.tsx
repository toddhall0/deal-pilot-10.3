"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"

interface StatusPieChartProps {
  data: {
    status: string
    count: number
  }[]
  title?: string
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#9ca3af",
  ACTIVE: "#60a5fa",
  UNDER_CONTRACT: "#a78bfa",
  IN_DUE_DILIGENCE: "#fbbf24",
  PENDING_CLOSING: "#f97316",
  CLOSED: "#10b981",
  TERMINATED: "#ef4444",
  ON_HOLD: "#6b7280",
}

export function StatusPieChart({ data, title = "Deals by Status" }: StatusPieChartProps) {
  // Format status labels
  const formattedData = data.map((item) => ({
    ...item,
    name: item.status.replace(/_/g, " "),
    color: STATUS_COLORS[item.status] || "#6b7280",
  }))

  const total = formattedData.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="count"
                label={({ percent }) =>
                  (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ""
                }
                labelLine={false}
              >
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [value, "Deals"]}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(value) => (
                  <span className="text-xs text-gray-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-2">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-sm text-gray-500">Total Deals</p>
        </div>
      </CardContent>
    </Card>
  )
}
