import ExcelJS from "exceljs"

export interface ExcelColumn {
  header: string
  key: string
  width?: number
  style?: Partial<ExcelJS.Style>
}

export interface ExcelSheet {
  name: string
  columns: ExcelColumn[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  title?: string
  subtitle?: string
}

export async function generateExcel(
  sheets: ExcelSheet[],
  options: {
    creator?: string
    title?: string
  } = {}
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = options.creator || "Deal Pilot"
  workbook.created = new Date()
  workbook.modified = new Date()

  for (const sheetConfig of sheets) {
    const sheet = workbook.addWorksheet(sheetConfig.name)

    let startRow = 1

    // Add title if provided
    if (sheetConfig.title) {
      sheet.mergeCells(1, 1, 1, sheetConfig.columns.length)
      const titleCell = sheet.getCell(1, 1)
      titleCell.value = sheetConfig.title
      titleCell.font = { size: 16, bold: true }
      titleCell.alignment = { horizontal: "center" }
      startRow++
    }

    // Add subtitle if provided
    if (sheetConfig.subtitle) {
      sheet.mergeCells(startRow, 1, startRow, sheetConfig.columns.length)
      const subtitleCell = sheet.getCell(startRow, 1)
      subtitleCell.value = sheetConfig.subtitle
      subtitleCell.font = { size: 10, color: { argb: "FF666666" } }
      subtitleCell.alignment = { horizontal: "center" }
      startRow++
    }

    // Add empty row after headers
    if (sheetConfig.title || sheetConfig.subtitle) {
      startRow++
    }

    // Set up columns
    sheet.columns = sheetConfig.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
      style: col.style,
    }))

    // Style header row
    const headerRow = sheet.getRow(startRow)
    headerRow.values = sheetConfig.columns.map((c) => c.header)
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" },
    }
    headerRow.alignment = { horizontal: "center" }
    startRow++

    // Add data rows
    sheetConfig.data.forEach((rowData, index) => {
      const row = sheet.getRow(startRow + index)
      sheetConfig.columns.forEach((col, colIndex) => {
        row.getCell(colIndex + 1).value = rowData[col.key] ?? ""
      })

      // Alternate row colors
      if (index % 2 === 1) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3F4F6" },
        }
      }
    })

    // Add borders
    const lastRow = startRow + sheetConfig.data.length - 1
    for (let r = startRow - 1; r <= lastRow; r++) {
      for (let c = 1; c <= sheetConfig.columns.length; c++) {
        const cell = sheet.getCell(r, c)
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        }
      }
    }

    // Auto-filter
    sheet.autoFilter = {
      from: { row: startRow - 1, column: 1 },
      to: { row: lastRow, column: sheetConfig.columns.length },
    }

    // Freeze header row
    sheet.views = [{ state: "frozen", ySplit: startRow - 1 }]
  }

  return workbook
}

export async function downloadExcel(
  workbook: ExcelJS.Workbook,
  filename: string
): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
