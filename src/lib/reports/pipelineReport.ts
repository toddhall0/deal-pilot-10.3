import { generatePDF, PDFSection } from "./pdfGenerator"
import { generateExcel, ExcelSheet } from "./excelGenerator"
import jsPDF from "jspdf"
import ExcelJS from "exceljs"

interface PipelineData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deals: any[]
  summary: {
    totalDeals: number
    totalValue: number
    byStatus: { status: string; count: number; value: number }[]
    byType: { type: string; count: number; value: number }[]
  }
  dateRange: {
    start: string
    end: string
  }
}

export function generatePipelinePDF(data: PipelineData): jsPDF {
  const { deals, summary, dateRange } = data

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount || 0)

  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString() : "—"

  const sections: PDFSection[] = [
    {
      type: "text",
      content: `Report Period: ${formatDate(dateRange.start)} to ${formatDate(dateRange.end)}`,
    },
    { type: "spacer" },
    {
      type: "keyValue",
      title: "Pipeline Summary",
      keyValues: [
        { label: "Total Deals", value: summary.totalDeals.toString() },
        { label: "Total Value", value: formatCurrency(summary.totalValue) },
        { label: "Average Deal Size", value: formatCurrency(summary.totalValue / summary.totalDeals || 0) },
      ],
    },
    { type: "spacer" },
    {
      type: "table",
      title: "Deals by Status",
      columns: [
        { header: "Status", dataKey: "status" },
        { header: "Count", dataKey: "count" },
        { header: "Total Value", dataKey: "value" },
      ],
      data: summary.byStatus.map((s) => ({
        status: s.status.replace(/_/g, " "),
        count: s.count.toString(),
        value: formatCurrency(s.value),
      })),
    },
    { type: "spacer" },
    {
      type: "table",
      title: "Active Deals",
      columns: [
        { header: "Deal #", dataKey: "dealNumber" },
        { header: "Property", dataKey: "property" },
        { header: "Status", dataKey: "status" },
        { header: "Value", dataKey: "value" },
        { header: "Closing", dataKey: "closing" },
      ],
      data: deals.slice(0, 25).map((d) => ({
        dealNumber: d.dealNumber,
        property: d.propertyName || d.propertyAddress || "—",
        status: d.status.replace(/_/g, " "),
        value: formatCurrency(d.transactionSummary?.purchasePrice || 0),
        closing: formatDate(d.transactionSummary?.closingDate),
      })),
    },
  ]

  return generatePDF(
    "Pipeline Summary Report",
    "Commercial Real Estate Deal Pipeline",
    sections,
    { orientation: "landscape", footer: "Deal Pilot - Confidential" }
  )
}

export async function generatePipelineExcel(data: PipelineData): Promise<ExcelJS.Workbook> {
  const { deals, summary, dateRange } = data

  const formatCurrency = (amount: number) =>
    amount ? `$${amount.toLocaleString()}` : ""

  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString() : ""

  const sheets: ExcelSheet[] = [
    {
      name: "Summary",
      title: "Pipeline Summary Report",
      subtitle: `${formatDate(dateRange.start)} to ${formatDate(dateRange.end)}`,
      columns: [
        { header: "Metric", key: "metric", width: 25 },
        { header: "Value", key: "value", width: 20 },
      ],
      data: [
        { metric: "Total Deals", value: summary.totalDeals },
        { metric: "Total Value", value: formatCurrency(summary.totalValue) },
        { metric: "Average Deal Size", value: formatCurrency(summary.totalValue / summary.totalDeals || 0) },
      ],
    },
    {
      name: "By Status",
      columns: [
        { header: "Status", key: "status", width: 20 },
        { header: "Count", key: "count", width: 10 },
        { header: "Total Value", key: "value", width: 20 },
        { header: "% of Total", key: "percentage", width: 12 },
      ],
      data: summary.byStatus.map((s) => ({
        status: s.status.replace(/_/g, " "),
        count: s.count,
        value: formatCurrency(s.value),
        percentage: `${((s.value / summary.totalValue) * 100).toFixed(1)}%`,
      })),
    },
    {
      name: "All Deals",
      columns: [
        { header: "Deal #", key: "dealNumber", width: 15 },
        { header: "Property", key: "property", width: 30 },
        { header: "Client", key: "client", width: 25 },
        { header: "Type", key: "type", width: 12 },
        { header: "Status", key: "status", width: 15 },
        { header: "Value", key: "value", width: 15 },
        { header: "Closing Date", key: "closing", width: 12 },
      ],
      data: deals.map((d) => ({
        dealNumber: d.dealNumber,
        property: d.propertyName || d.propertyAddress || "",
        client: d.client?.name || "",
        type: d.type,
        status: d.status.replace(/_/g, " "),
        value: formatCurrency(d.transactionSummary?.purchasePrice || 0),
        closing: formatDate(d.transactionSummary?.closingDate),
      })),
    },
  ]

  return generateExcel(sheets, { title: "Pipeline Report" })
}
