import { generatePDF, PDFSection } from "./pdfGenerator"
import { generateExcel, ExcelSheet } from "./excelGenerator"
import jsPDF from "jspdf"
import ExcelJS from "exceljs"

interface DealData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deal: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  summary: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  milestones: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deposits: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasks: any[]
}

export function generateDealSummaryPDF(data: DealData): jsPDF {
  const { deal, summary, milestones, deposits } = data

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
      type: "keyValue",
      title: "Deal Information",
      keyValues: [
        { label: "Deal Number", value: deal.dealNumber },
        { label: "Status", value: deal.status.replace(/_/g, " ") },
        { label: "Type", value: deal.type },
        { label: "Property", value: deal.propertyName || deal.propertyAddress || "—" },
        { label: "Created", value: formatDate(deal.createdAt) },
      ],
    },
    { type: "spacer" },
    {
      type: "keyValue",
      title: "Parties",
      keyValues: [
        { label: "Buyer", value: summary?.buyerName || "—" },
        { label: "Seller", value: summary?.sellerName || "—" },
      ],
    },
    { type: "spacer" },
    {
      type: "keyValue",
      title: "Financial Terms",
      keyValues: [
        { label: "Purchase Price", value: formatCurrency(summary?.purchasePrice || 0) },
        { label: "Initial Deposit", value: formatCurrency(summary?.initialDeposit) },
        { label: "Effective Date", value: formatDate(summary?.effectiveDate) },
        { label: "Closing Date", value: formatDate(summary?.closingDate) },
      ],
    },
  ]

  // Add milestones table if present
  if (milestones && milestones.length > 0) {
    sections.push({ type: "spacer" })
    sections.push({
      type: "table",
      title: "Key Milestones",
      columns: [
        { header: "Milestone", dataKey: "name" },
        { header: "Due Date", dataKey: "dueDate" },
        { header: "Status", dataKey: "status" },
      ],
      data: milestones.slice(0, 10).map((m) => ({
        name: m.name,
        dueDate: formatDate(m.dueDate),
        status: m.status.replace(/_/g, " "),
      })),
    })
  }

  // Add deposits table if present
  if (deposits && deposits.length > 0) {
    sections.push({ type: "spacer" })
    sections.push({
      type: "table",
      title: "Deposits",
      columns: [
        { header: "Name", dataKey: "name" },
        { header: "Amount", dataKey: "amount" },
        { header: "Status", dataKey: "status" },
        { header: "Due Date", dataKey: "dueDate" },
      ],
      data: deposits.map((d) => ({
        name: d.name,
        amount: formatCurrency(d.amount),
        status: d.status,
        dueDate: formatDate(d.dueDate),
      })),
    })
  }

  return generatePDF(
    `Deal Summary: ${deal.dealNumber}`,
    deal.propertyName || deal.propertyAddress || "Commercial Real Estate Transaction",
    sections,
    { footer: "Deal Pilot - Confidential" }
  )
}

export async function generateDealSummaryExcel(data: DealData): Promise<ExcelJS.Workbook> {
  const { deal, summary, milestones, deposits, tasks } = data

  const formatCurrency = (amount: number) =>
    amount ? `$${amount.toLocaleString()}` : ""

  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString() : ""

  const sheets: ExcelSheet[] = [
    {
      name: "Summary",
      title: `Deal Summary: ${deal.dealNumber}`,
      subtitle: `Generated ${new Date().toLocaleString()}`,
      columns: [
        { header: "Field", key: "field", width: 25 },
        { header: "Value", key: "value", width: 40 },
      ],
      data: [
        { field: "Deal Number", value: deal.dealNumber },
        { field: "Status", value: deal.status.replace(/_/g, " ") },
        { field: "Type", value: deal.type },
        { field: "Property Name", value: deal.propertyName || "" },
        { field: "Property Address", value: deal.propertyAddress || "" },
        { field: "Buyer", value: summary?.buyerName || "" },
        { field: "Seller", value: summary?.sellerName || "" },
        { field: "Purchase Price", value: formatCurrency(summary?.purchasePrice || 0) },
        { field: "Effective Date", value: formatDate(summary?.effectiveDate) },
        { field: "Closing Date", value: formatDate(summary?.closingDate) },
      ],
    },
  ]

  if (milestones && milestones.length > 0) {
    sheets.push({
      name: "Milestones",
      columns: [
        { header: "Milestone", key: "name", width: 35 },
        { header: "Due Date", key: "dueDate", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Completed", key: "completedDate", width: 15 },
      ],
      data: milestones.map((m) => ({
        name: m.name,
        dueDate: formatDate(m.dueDate),
        status: m.status.replace(/_/g, " "),
        completedDate: formatDate(m.completedDate),
      })),
    })
  }

  if (deposits && deposits.length > 0) {
    sheets.push({
      name: "Deposits",
      columns: [
        { header: "Name", key: "name", width: 25 },
        { header: "Amount", key: "amount", width: 15 },
        { header: "Status", key: "status", width: 12 },
        { header: "Due Date", key: "dueDate", width: 15 },
        { header: "Paid Date", key: "paidDate", width: 15 },
        { header: "Held By", key: "heldBy", width: 25 },
      ],
      data: deposits.map((d) => ({
        name: d.name,
        amount: formatCurrency(d.amount),
        status: d.status,
        dueDate: formatDate(d.dueDate),
        paidDate: formatDate(d.paidDate),
        heldBy: d.heldBy || "",
      })),
    })
  }

  if (tasks && tasks.length > 0) {
    sheets.push({
      name: "Tasks",
      columns: [
        { header: "Task", key: "title", width: 35 },
        { header: "Status", key: "status", width: 12 },
        { header: "Priority", key: "priority", width: 10 },
        { header: "Due Date", key: "dueDate", width: 15 },
        { header: "Assigned To", key: "assignee", width: 20 },
      ],
      data: tasks.map((t) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: formatDate(t.dueDate),
        assignee: t.assignee?.name || "",
      })),
    })
  }

  return generateExcel(sheets, { title: `Deal ${deal.dealNumber}` })
}
