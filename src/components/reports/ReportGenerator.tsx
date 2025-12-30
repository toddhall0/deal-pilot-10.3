"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  CheckSquare,
  Flag,
  Download,
  Loader2,
} from "lucide-react"
import { REPORT_CONFIGS, ReportType, ReportFormat } from "@/types/reports"
import { generateDealSummaryPDF, generateDealSummaryExcel } from "@/lib/reports/dealSummaryReport"
import { generatePipelinePDF, generatePipelineExcel } from "@/lib/reports/pipelineReport"
import { downloadPDF } from "@/lib/reports/pdfGenerator"
import { downloadExcel } from "@/lib/reports/excelGenerator"
import { downloadCSV, generateCSV } from "@/lib/reports/csvGenerator"

const ICONS: Record<string, any> = {
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  CheckSquare,
  Flag,
}

interface ReportGeneratorProps {
  dealId?: string
  clientId?: string
  deals?: { id: string; dealNumber: string; propertyName: string }[]
  clients?: { id: string; name: string }[]
}

export function ReportGenerator({
  dealId,
  clientId,
  deals = [],
  clients = [],
}: ReportGeneratorProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>("PDF")
  const [selectedDealId, setSelectedDealId] = useState(dealId || "")
  const [selectedClientId, setSelectedClientId] = useState(clientId || "")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleGenerate = async () => {
    if (!selectedReport) return

    setIsGenerating(true)

    try {
      const config = REPORT_CONFIGS[selectedReport]

      // Fetch report data
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedReport,
          format: selectedFormat,
          dealId: config.requiresDealId ? selectedDealId : undefined,
          clientId: config.requiresClientId ? selectedClientId : undefined,
          startDate: config.requiresDateRange ? startDate : undefined,
          endDate: config.requiresDateRange ? endDate : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate report")
      }

      const reportData = await response.json()
      const timestamp = new Date().toISOString().slice(0, 10)
      const filename = `${selectedReport.toLowerCase()}_${timestamp}`

      // Generate and download based on format
      switch (selectedFormat) {
        case "PDF":
          let pdf
          if (selectedReport === "DEAL_SUMMARY" || selectedReport === "DEAL_TIMELINE" || selectedReport === "DEAL_FINANCIALS") {
            pdf = generateDealSummaryPDF(reportData.data)
          } else if (selectedReport === "PIPELINE_SUMMARY") {
            pdf = generatePipelinePDF(reportData.data)
          }
          if (pdf) {
            downloadPDF(pdf, `${filename}.pdf`)
          }
          break

        case "EXCEL":
          let workbook
          if (selectedReport === "DEAL_SUMMARY" || selectedReport === "DEAL_TIMELINE" || selectedReport === "DEAL_FINANCIALS") {
            workbook = await generateDealSummaryExcel(reportData.data)
          } else if (selectedReport === "PIPELINE_SUMMARY") {
            workbook = await generatePipelineExcel(reportData.data)
          }
          if (workbook) {
            await downloadExcel(workbook, `${filename}.xlsx`)
          }
          break

        case "CSV":
          if (selectedReport === "TASK_LIST") {
            const csv = generateCSV(
              [
                { header: "Task", key: "title" },
                { header: "Status", key: "status" },
                { header: "Priority", key: "priority" },
                { header: "Due Date", key: "dueDate" },
                { header: "Assigned To", key: "assignee" },
              ],
              reportData.data.tasks.map((t: any) => ({
                title: t.title,
                status: t.status,
                priority: t.priority,
                dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "",
                assignee: t.assignee?.name || "",
              }))
            )
            downloadCSV(csv, `${filename}.csv`)
          }
          break
      }

      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error generating report:", error)
      alert("Failed to generate report")
    } finally {
      setIsGenerating(false)
    }
  }

  const config = selectedReport ? REPORT_CONFIGS[selectedReport] : null

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.values(REPORT_CONFIGS).map((report) => {
          const Icon = ICONS[report.icon] || FileText
          const isAvailable =
            (!report.requiresDealId || dealId || deals.length > 0) &&
            (!report.requiresClientId || clientId || clients.length > 0)

          return (
            <Card
              key={report.type}
              className={`cursor-pointer transition-all hover:shadow-md ${
                !isAvailable ? "opacity-50" : ""
              }`}
              onClick={() => {
                if (isAvailable) {
                  setSelectedReport(report.type)
                  setSelectedFormat(report.formats[0])
                  setIsDialogOpen(true)
                }
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{report.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {report.description}
                    </p>
                    <div className="flex gap-1 mt-2">
                      {report.formats.map((format) => (
                        <span
                          key={format}
                          className="text-xs bg-gray-100 px-2 py-0.5 rounded"
                        >
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Report Options Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{config?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select
                value={selectedFormat}
                onValueChange={(v) => setSelectedFormat(v as ReportFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {config?.formats.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deal Selection */}
            {config?.requiresDealId && !dealId && deals.length > 0 && (
              <div className="space-y-2">
                <Label>Select Deal</Label>
                <Select value={selectedDealId} onValueChange={setSelectedDealId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a deal" />
                  </SelectTrigger>
                  <SelectContent>
                    {deals.map((deal) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.dealNumber} - {deal.propertyName || "Untitled"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Client Selection */}
            {config?.requiresClientId && !clientId && clients.length > 0 && (
              <div className="space-y-2">
                <Label>Select Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range */}
            {config?.requiresDateRange && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
