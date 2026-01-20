"use client"

import { useState, useCallback, useEffect } from "react"

interface ColumnConfig {
  key: string
  initialWidth: number
  minWidth?: number
}

export function useResizableColumns(columns: ColumnConfig[], storageKey?: string) {
  // Ensure columns is always an array
  const safeColumns = Array.isArray(columns) ? columns : []

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    // Try to load from localStorage if storageKey provided
    if (storageKey && typeof window !== "undefined") {
      const saved = localStorage.getItem(`column-widths-${storageKey}`)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // Fall through to default
        }
      }
    }
    // Initialize with default widths
    const widths: Record<string, number> = {}
    safeColumns.forEach((col) => {
      widths[col.key] = col.initialWidth
    })
    return widths
  })

  const [resizing, setResizing] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  // Save to localStorage when widths change
  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      localStorage.setItem(`column-widths-${storageKey}`, JSON.stringify(columnWidths))
    }
  }, [columnWidths, storageKey])

  const handleMouseDown = useCallback(
    (columnKey: string, e: React.MouseEvent) => {
      e.preventDefault()
      setResizing(columnKey)
      setStartX(e.clientX)
      setStartWidth(columnWidths[columnKey] || 100)
    },
    [columnWidths]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!resizing) return

      const column = safeColumns.find((c) => c.key === resizing)
      const minWidth = column?.minWidth || 50
      const diff = e.clientX - startX
      const newWidth = Math.max(minWidth, startWidth + diff)

      setColumnWidths((prev) => ({
        ...prev,
        [resizing]: newWidth,
      }))
    },
    [resizing, startX, startWidth, safeColumns]
  )

  const handleMouseUp = useCallback(() => {
    setResizing(null)
  }, [])

  useEffect(() => {
    if (resizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    } else {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [resizing, handleMouseMove, handleMouseUp])

  const getColumnWidth = (key: string) => columnWidths[key] || 100

  const ResizeHandle = ({ columnKey }: { columnKey: string }) => (
    <div
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 group-hover:bg-slate-600"
      onMouseDown={(e) => handleMouseDown(columnKey, e)}
    />
  )

  return {
    columnWidths,
    getColumnWidth,
    ResizeHandle,
    isResizing: !!resizing,
  }
}
