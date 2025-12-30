import { generatePDF, PDFSection } from "./pdfGenerator"
import { generateExcel, ExcelSheet } from "./excelGenerator"

interface ClosingData {
  deal: any
  summary: any
  deposits: any[]
  lineItems: any[]
}

export function generateClosingStatementPDF(data: ClosingData): any {
  const { deal, summary, deposits, lineItems } = data

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0)

  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString() : "—"

  // Calculate totals
  const purchasePrice = Number(summary?.purchasePrice) || Number(deal.purchasePrice) || 0
  const totalDeposits = deposits.reduce((sum, d) => sum + Number(d.amount), 0)

  const buyerItems = lineItems.filter((i) => i.paidBy === "BUYER")
  const sellerItems = lineItems.filter((i) => i.paidBy === "SELLER")

  const buyerDebits = buyerItems
    .filter((i) => i.category !== "CREDIT")
    .reduce((sum, i) => sum + Number(i.amount), 0)
  const buyerCredits = buyerItems
    .filter((i) => i.category === "CREDIT")
    .reduce((sum, i) => sum + Number(i.amount), 0) + totalDeposits

  const sellerDebits = sellerItems
    .filter((i) => i.category !== "CREDIT")
    .reduce((sum, i) => sum + Number(i.amount), 0)
  const sellerCredits = sellerItems
    .filter((i) => i.category === "CREDIT")
    .reduce((sum, i) => sum + Number(i.amount), 0)

  const buyerCashToClose = purchasePrice + buyerDebits - buyerCredits
  const sellerNetProceeds = purchasePrice - sellerDebits + sellerCredits

  const sections: PDFSection[] = [
    {
      type: "keyValue",
      title: "Property",
      keyValues: [
        { label: "Address", value: deal.propertyAddress || "—" },
        { label: "City/State", value: `${deal.propertyCity || ""}, ${deal.propertyState || ""}` },
        { label: "Closing Date", value: formatDate(summary?.closingDate) },
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
      type: "table",
      title: "Buyer's Statement",
      columns: [
        { header: "Description", dataKey: "description" },
        { header: "Debit", dataKey: "debit" },
        { header: "Credit", dataKey: "credit" },
      ],
      data: [
        { description: "Purchase Price", debit: formatCurrency(purchasePrice), credit: "" },
        ...buyerItems.map((item) => ({
          description: item.name,
          debit: item.category !== "CREDIT" ? formatCurrency(item.amount) : "",
          credit: item.category === "CREDIT" ? formatCurrency(item.amount) : "",
        })),
        { description: "Earnest Money Deposit", debit: "", credit: formatCurrency(totalDeposits) },
        { description: "TOTAL", debit: formatCurrency(purchasePrice + buyerDebits), credit: formatCurrency(buyerCredits) },
        { description: "CASH TO CLOSE", debit: formatCurrency(buyerCashToClose), credit: "" },
      ],
    },
    { type: "spacer" },
    {
      type: "table",
      title: "Seller's Statement",
      columns: [
        { header: "Description", dataKey: "description" },
        { header: "Debit", dataKey: "debit" },
        { header: "Credit", dataKey: "credit" },
      ],
      data: [
        { description: "Purchase Price", debit: "", credit: formatCurrency(purchasePrice) },
        ...sellerItems.map((item) => ({
          description: item.name,
          debit: item.category !== "CREDIT" ? formatCurrency(item.amount) : "",
          credit: item.category === "CREDIT" ? formatCurrency(item.amount) : "",
        })),
        { description: "TOTAL", debit: formatCurrency(sellerDebits), credit: formatCurrency(purchasePrice + sellerCredits) },
        { description: "NET PROCEEDS", debit: "", credit: formatCurrency(sellerNetProceeds) },
      ],
    },
  ]

  return generatePDF(
    "Closing Statement",
    `${deal.dealNumber} - ${deal.propertyAddress || "Property"}`,
    sections,
    { footer: "Deal Pilot - Settlement Statement" }
  )
}
