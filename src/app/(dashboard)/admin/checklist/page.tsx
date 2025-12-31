"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react"

interface CheckItem {
  name: string
  status: "pass" | "fail" | "warning"
  message: string
}

export default function DeploymentChecklistPage() {
  const [checks, setChecks] = useState<CheckItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    runChecks()
  }, [])

  async function runChecks() {
    setIsLoading(true)
    const results: CheckItem[] = []

    // Check database connection
    try {
      const dbRes = await fetch("/api/health/db")
      results.push({
        name: "Database Connection",
        status: dbRes.ok ? "pass" : "fail",
        message: dbRes.ok ? "Connected successfully" : "Connection failed",
      })
    } catch {
      results.push({
        name: "Database Connection",
        status: "fail",
        message: "Could not connect to database",
      })
    }

    // Check S3/R2 connection
    try {
      const s3Res = await fetch("/api/health/storage")
      results.push({
        name: "File Storage (S3/R2)",
        status: s3Res.ok ? "pass" : "fail",
        message: s3Res.ok ? "Storage accessible" : "Storage not accessible",
      })
    } catch {
      results.push({
        name: "File Storage (S3/R2)",
        status: "warning",
        message: "Could not verify storage connection",
      })
    }

    // Check AI API
    try {
      const aiRes = await fetch("/api/health/ai")
      results.push({
        name: "AI Service (Anthropic)",
        status: aiRes.ok ? "pass" : "warning",
        message: aiRes.ok ? "API key valid" : "API key not configured",
      })
    } catch {
      results.push({
        name: "AI Service (Anthropic)",
        status: "warning",
        message: "Could not verify AI service",
      })
    }

    // Check email service
    try {
      const emailRes = await fetch("/api/health/email")
      results.push({
        name: "Email Service (Resend)",
        status: emailRes.ok ? "pass" : "warning",
        message: emailRes.ok ? "Email configured" : "Email not configured",
      })
    } catch {
      results.push({
        name: "Email Service (Resend)",
        status: "warning",
        message: "Email service not configured",
      })
    }

    // Check environment
    results.push({
      name: "Environment",
      status: process.env.NODE_ENV === "production" ? "pass" : "warning",
      message: `Running in ${process.env.NODE_ENV} mode`,
    })

    setChecks(results)
    setIsLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "fail":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const passCount = checks.filter((c) => c.status === "pass").length
  const failCount = checks.filter((c) => c.status === "fail").length

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Deployment Checklist</h1>
        <p className="text-gray-500">
          Verify all services are configured correctly
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="flex gap-4">
            <Badge variant="outline" className="text-green-600">
              {passCount} Passed
            </Badge>
            {failCount > 0 && (
              <Badge variant="destructive">
                {failCount} Failed
              </Badge>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Checks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {checks.map((check, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <p className="font-medium">{check.name}</p>
                      <p className="text-sm text-gray-500">{check.message}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      check.status === "pass"
                        ? "default"
                        : check.status === "fail"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {check.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
