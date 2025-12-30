"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, Table, Loader2 } from "lucide-react"
import { generateDealSummaryPDF, generateDealSummaryExcel } from "@/lib/reports/dealSummaryReport"
import { downloadPDF } from "@/lib/reports/pdfGenerator"
import { downloadExcel } from "@/lib/reports/excelGenerator"

interface QuickExportProps {
  dealId: string
}

export function QuickExport({ dealId }: QuickExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<"PDF" | "EXCEL" | null>(null)

  const handleExport = async (format: "PDF" | "EXCEL") => {
    setIsExporting(true)
    setExportType(format)

    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DEAL_SUMMARY",
          format,
          dealId,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate report")

      const reportData = await response.json()
      const timestamp = new Date().toISOString().slice(0, 10)
      const filename = `deal_summary_${timestamp}`

      if (format === "PDF") {
        const pdf = generateDealSummaryPDF(reportData.data)
        downloadPDF(pdf, `${filename}.pdf`)
      } else {
        const workbook = await generateDealSummaryExcel(reportData.data)
        await downloadExcel(workbook, `${filename}.xlsx`)
      }
    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to export report")
    } finally {
      setIsExporting(false)
      setExportType(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("PDF")}>
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("EXCEL")}>
          <Table className="mr-2 h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
