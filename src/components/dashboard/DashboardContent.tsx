"use client"

// BUILD IDENTIFIER: 2026-01-20-v4 - MINIMAL TEST
console.log("DashboardContent BUILD: 2026-01-20-v4 - MINIMAL TEST")

import { useState, useEffect } from "react"

export function DashboardContent() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="p-4 text-white">Loading...</div>
  }

  // Minimal render - no external components
  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-800 rounded-lg text-white">
        <h2 className="text-xl font-bold">Dashboard Test</h2>
        <p className="text-slate-400">If you see this without errors, the issue is in one of the dashboard components.</p>
      </div>
    </div>
  )
}
