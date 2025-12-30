import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export interface PDFTableColumn {
  header: string
  dataKey: string
  width?: number
}

export interface PDFSection {
  title?: string
  type: "text" | "table" | "keyValue" | "spacer"
  content?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any[]
  columns?: PDFTableColumn[]
  keyValues?: { label: string; value: string }[]
}

export function generatePDF(
  title: string,
  subtitle: string,
  sections: PDFSection[],
  options: {
    orientation?: "portrait" | "landscape"
    footer?: string
  } = {}
): jsPDF {
  const { orientation = "portrait", footer } = options
  const doc = new jsPDF({ orientation })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPos = margin

  // Header
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text(title, margin, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100)
  doc.text(subtitle, margin, yPos)
  yPos += 5

  // Generated timestamp
  doc.setFontSize(8)
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos)
  doc.setTextColor(0)
  yPos += 15

  // Sections
  sections.forEach((section) => {
    // Check if we need a new page
    if (yPos > pageHeight - 40) {
      doc.addPage()
      yPos = margin
    }

    switch (section.type) {
      case "text":
        if (section.title) {
          doc.setFontSize(14)
          doc.setFont("helvetica", "bold")
          doc.text(section.title, margin, yPos)
          yPos += 8
        }
        if (section.content) {
          doc.setFontSize(10)
          doc.setFont("helvetica", "normal")
          const lines = doc.splitTextToSize(section.content, pageWidth - margin * 2)
          doc.text(lines, margin, yPos)
          yPos += lines.length * 5 + 5
        }
        break

      case "keyValue":
        if (section.title) {
          doc.setFontSize(14)
          doc.setFont("helvetica", "bold")
          doc.text(section.title, margin, yPos)
          yPos += 8
        }
        if (section.keyValues) {
          doc.setFontSize(10)
          section.keyValues.forEach((kv) => {
            doc.setFont("helvetica", "bold")
            doc.text(`${kv.label}:`, margin, yPos)
            doc.setFont("helvetica", "normal")
            doc.text(kv.value, margin + 60, yPos)
            yPos += 6
          })
          yPos += 5
        }
        break

      case "table":
        if (section.title) {
          doc.setFontSize(14)
          doc.setFont("helvetica", "bold")
          doc.text(section.title, margin, yPos)
          yPos += 8
        }
        if (section.data && section.columns) {
          autoTable(doc, {
            startY: yPos,
            head: [section.columns.map((c) => c.header)],
            body: section.data.map((row) =>
              section.columns!.map((c) => row[c.dataKey] ?? "")
            ),
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [59, 130, 246] },
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          yPos = (doc as any).lastAutoTable.finalY + 10
        }
        break

      case "spacer":
        yPos += 10
        break
    }
  })

  // Footer on all pages
  if (footer) {
    const pageCount = doc.internal.pages.length - 1
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text(footer, margin, pageHeight - 10)
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10)
    }
  }

  return doc
}

export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename)
}
