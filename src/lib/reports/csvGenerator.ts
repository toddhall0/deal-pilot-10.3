export interface CSVColumn {
  header: string
  key: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter?: (value: any) => string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateCSV(columns: CSVColumn[], data: any[]): string {
  // Header row
  const headers = columns.map((c) => escapeCSV(c.header)).join(",")

  // Data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        let value = row[col.key]
        if (col.formatter) {
          value = col.formatter(value)
        }
        return escapeCSV(String(value ?? ""))
      })
      .join(",")
  )

  return [headers, ...rows].join("\n")
}

function escapeCSV(value: string): string {
  // If value contains comma, newline, or quote, wrap in quotes
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    // Escape quotes by doubling them
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
