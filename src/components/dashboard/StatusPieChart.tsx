"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Recharts temporarily disabled for debugging
// import {
//   PieChart,
//   Pie,
//   Cell,
//   ResponsiveContainer,
//   Legend,
//   Tooltip,
// } from "recharts"

interface StatusPieChartProps {
  data: {
    status: string
    count: number
  }[]
  title?: string
}

export function StatusPieChart({ data, title = "Deals by Status" }: StatusPieChartProps) {
  // Charts temporarily disabled - return placeholder
  const safeData = Array.isArray(data) ? data : []
  const total = safeData.reduce((sum, item) => sum + (item?.count || 0), 0)

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-base text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] flex items-center justify-center text-slate-400">
          Charts temporarily disabled
        </div>
        <div className="text-center mt-2">
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-sm text-slate-400">Total Deals</p>
        </div>
      </CardContent>
    </Card>
  )
}
