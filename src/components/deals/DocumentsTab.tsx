"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DocumentUploader } from "@/components/documents/DocumentUploader"
import { AnalysisDialog } from "@/components/analysis"
import { MultiDocumentAnalysisDialog } from "@/components/analysis/MultiDocumentAnalysisDialog"
import {
  Upload,
  FileIcon,
  FileText,
  Image,
  Table as TableIcon,
  MoreVertical,
  Download,
  Trash2,
  Star,
  Sparkles,
  ExternalLink,
  LayoutGrid,
  List,
  ChevronUp,
  ChevronDown,
  Files,
  Pencil,
  Tag,
  ArrowUpDown,
} from "lucide-react"

interface Document {
  id: string
  name: string
  originalName: string
  description: string | null
  category: string
  fileType: string
  fileSize: number
  downloadUrl: string
  isPrimaryContract: boolean
  isAnalyzed: boolean
  sortOrder: number
  uploadedBy: { id: string; name: string }
  createdAt: string
}

interface DocumentsTabProps {
  dealId: string
}

const CATEGORIES = [
  { value: "ALL", label: "All Categories" },
  { value: "PSA_AMENDMENTS", label: "PSA and Amendments" },
  { value: "DUE_DILIGENCE", label: "Due Diligence Documents" },
  { value: "TITLE_SURVEY", label: "Title/Survey Documents" },
  { value: "CLOSING_DRAFT", label: "Closing Documents (Draft)" },
  { value: "CLOSING_FINAL", label: "Closing Documents (Final)" },
  { value: "ENTITY", label: "Entity Documents" },
  { value: "OTHER", label: "Other" },
]

const SORT_OPTIONS = [
  { value: "manual", label: "Manual Order" },
  { value: "name", label: "Name" },
  { value: "category", label: "Category" },
  { value: "date", label: "Date Uploaded" },
  { value: "size", label: "File Size" },
]

type SortField = "manual" | "name" | "category" | "date" | "size"

interface DocumentGroup {
  label: string
  documents: Document[]
}

export function DocumentsTab({ dealId }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [viewMode, setViewMode] = useState<"card" | "list">("card")
  const [sortBy, setSortBy] = useState<SortField>("manual")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isMultiAnalysisOpen, setIsMultiAnalysisOpen] = useState(false)
  const [renameDoc, setRenameDoc] = useState<Document | null>(null)
  const [newName, setNewName] = useState("")
  const [categoryDoc, setCategoryDoc] = useState<Document | null>(null)
  const [newCategory, setNewCategory] = useState("")

  useEffect(() => {
    fetchDocuments()
  }, [dealId, categoryFilter])

  async function fetchDocuments() {
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== "ALL") {
        params.append("category", categoryFilter)
      }

      const response = await fetch(
        `/api/deals/${dealId}/documents?${params.toString()}`
      )
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(documentId: string) {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      await fetch(`/api/deals/${dealId}/documents/${documentId}`, {
        method: "DELETE",
      })
      setDocuments(documents.filter((d) => d.id !== documentId))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(documentId)
        return next
      })
    } catch (error) {
      console.error("Failed to delete document:", error)
    }
  }

  async function handleSetPrimary(documentId: string) {
    try {
      await fetch(`/api/deals/${dealId}/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimaryContract: true }),
      })
      fetchDocuments()
    } catch (error) {
      console.error("Failed to set primary contract:", error)
    }
  }

  function openRenameDialog(doc: Document) {
    setRenameDoc(doc)
    setNewName(doc.name)
  }

  async function handleRename() {
    if (!renameDoc || !newName.trim()) return

    try {
      await fetch(`/api/deals/${dealId}/documents/${renameDoc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      })
      setDocuments(documents.map((d) =>
        d.id === renameDoc.id ? { ...d, name: newName.trim() } : d
      ))
      setRenameDoc(null)
      setNewName("")
    } catch (error) {
      console.error("Failed to rename document:", error)
    }
  }

  function openCategoryDialog(doc: Document) {
    setCategoryDoc(doc)
    setNewCategory(doc.category)
  }

  async function handleChangeCategory() {
    if (!categoryDoc || !newCategory) return

    try {
      await fetch(`/api/deals/${dealId}/documents/${categoryDoc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory }),
      })
      setDocuments(documents.map((d) =>
        d.id === categoryDoc.id ? { ...d, category: newCategory } : d
      ))
      setCategoryDoc(null)
      setNewCategory("")
    } catch (error) {
      console.error("Failed to change document category:", error)
    }
  }

  async function handleMove(documentId: string, direction: "up" | "down") {
    const currentIndex = documents.findIndex((d) => d.id === documentId)
    if (currentIndex === -1) return
    if (direction === "up" && currentIndex === 0) return
    if (direction === "down" && currentIndex === documents.length - 1) return

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    const targetDoc = documents[targetIndex]
    const currentDoc = documents[currentIndex]

    // Swap sort orders
    try {
      await Promise.all([
        fetch(`/api/deals/${dealId}/documents/${currentDoc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: targetDoc.sortOrder }),
        }),
        fetch(`/api/deals/${dealId}/documents/${targetDoc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: currentDoc.sortOrder }),
        }),
      ])

      // Update local state
      const newDocs = [...documents]
      newDocs[currentIndex] = { ...targetDoc, sortOrder: currentDoc.sortOrder }
      newDocs[targetIndex] = { ...currentDoc, sortOrder: targetDoc.sortOrder }
      newDocs.sort((a, b) => a.sortOrder - b.sortOrder)
      setDocuments(newDocs)
    } catch (error) {
      console.error("Failed to reorder documents:", error)
    }
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(documents.map((d) => d.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  function handleSelectOne(documentId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(documentId)
      } else {
        next.delete(documentId)
      }
      return next
    })
  }

  function getFileIcon(fileType: string) {
    if (fileType.startsWith("image/")) {
      return <Image className="h-8 w-8 text-purple-500" />
    }
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) {
      return <TableIcon className="h-8 w-8 text-green-500" />
    }
    if (fileType.includes("pdf")) {
      return <FileText className="h-8 w-8 text-red-500" />
    }
    return <FileIcon className="h-8 w-8 text-blue-500" />
  }

  function getSmallFileIcon(fileType: string) {
    if (fileType.startsWith("image/")) {
      return <Image className="h-4 w-4 text-purple-500" />
    }
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) {
      return <TableIcon className="h-4 w-4 text-green-500" />
    }
    if (fileType.includes("pdf")) {
      return <FileText className="h-4 w-4 text-red-500" />
    }
    return <FileIcon className="h-4 w-4 text-blue-500" />
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  function getCategoryLabel(value: string) {
    return CATEGORIES.find((c) => c.value === value)?.label || value
  }

  function getMonthYear(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
  }

  function getSizeGroup(bytes: number): string {
    if (bytes < 1024 * 100) return "Small (< 100 KB)"
    if (bytes < 1024 * 1024) return "Medium (100 KB - 1 MB)"
    if (bytes < 1024 * 1024 * 10) return "Large (1 - 10 MB)"
    return "Very Large (> 10 MB)"
  }

  const documentGroups = useMemo((): DocumentGroup[] => {
    if (sortBy === "manual") {
      return [{ label: "", documents }]
    }

    const sorted = [...documents]
    const groups: Map<string, Document[]> = new Map()

    if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      sorted.forEach((doc) => {
        const letter = doc.name[0]?.toUpperCase() || "#"
        if (!groups.has(letter)) groups.set(letter, [])
        groups.get(letter)!.push(doc)
      })
    } else if (sortBy === "category") {
      // Sort by category order in CATEGORIES array
      const categoryOrder = CATEGORIES.map((c) => c.value)
      sorted.sort((a, b) => {
        const aIndex = categoryOrder.indexOf(a.category)
        const bIndex = categoryOrder.indexOf(b.category)
        return aIndex - bIndex
      })
      sorted.forEach((doc) => {
        const label = getCategoryLabel(doc.category)
        if (!groups.has(label)) groups.set(label, [])
        groups.get(label)!.push(doc)
      })
    } else if (sortBy === "date") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      sorted.forEach((doc) => {
        const label = getMonthYear(doc.createdAt)
        if (!groups.has(label)) groups.set(label, [])
        groups.get(label)!.push(doc)
      })
    } else if (sortBy === "size") {
      sorted.sort((a, b) => a.fileSize - b.fileSize)
      sorted.forEach((doc) => {
        const label = getSizeGroup(doc.fileSize)
        if (!groups.has(label)) groups.set(label, [])
        groups.get(label)!.push(doc)
      })
    }

    return Array.from(groups.entries()).map(([label, docs]) => ({ label, documents: docs }))
  }, [documents, sortBy])

  const selectedDocuments = documents.filter((d) => selectedIds.has(d.id))
  const canAnalyzeMultiple = selectedDocuments.length >= 2 &&
    selectedDocuments.every((d) => d.fileType.includes("pdf") || d.fileType.includes("text"))

  if (isLoading) {
    return <div className="p-4">Loading documents...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Documents ({documents.length})</h2>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center border border-slate-700 rounded-md">
            <Button
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsMultiAnalysisOpen(true)}
              disabled={!canAnalyzeMultiple}
              title={!canAnalyzeMultiple ? "Select 2+ PDF/text documents to analyze together" : undefined}
            >
              <Files className="mr-2 h-4 w-4" />
              Analyze Selected ({selectedIds.size})
            </Button>
          )}
          <Button onClick={() => setIsUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-10 text-center">
            <FileIcon className="mx-auto h-10 w-10 text-slate-600 mb-2" />
            <p className="text-slate-400 mb-4">No documents yet</p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload your first document
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "card" ? (
        <div className="space-y-6">
          {documentGroups.map((group) => (
            <div key={group.label || "all"}>
              {group.label && (
                <h3 className="text-md font-medium text-slate-300 mb-3 border-b border-slate-700 pb-2">
                  {group.label} ({group.documents.length})
                </h3>
              )}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.documents.map((doc, index) => (
                  <Card key={doc.id} className="relative group bg-slate-900 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <Checkbox
                            checked={selectedIds.has(doc.id)}
                            onCheckedChange={(checked) => handleSelectOne(doc.id, checked as boolean)}
                          />
                          {sortBy === "manual" && (
                            <div className="flex flex-col gap-0.5 mt-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                disabled={index === 0}
                                onClick={() => handleMove(doc.id, "up")}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                disabled={index === documents.length - 1}
                                onClick={() => handleMove(doc.id, "down")}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {getFileIcon(doc.fileType)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <a
                              href={doc.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-sm truncate text-white hover:text-blue-400 hover:underline flex items-center gap-1 group/link"
                              title={`Click to view: ${doc.name}`}
                            >
                              {doc.name}
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 flex-shrink-0" />
                            </a>
                            {doc.isPrimaryContract && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                            {doc.isAnalyzed && (
                              <Sparkles className="h-4 w-4 text-purple-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {doc.category}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {formatFileSize(doc.fileSize)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            {doc.uploadedBy.name} • {formatDate(doc.createdAt)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-white"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={doc.downloadUrl} target="_blank" rel="noreferrer">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openRenameDialog(doc)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openCategoryDialog(doc)}>
                              <Tag className="mr-2 h-4 w-4" />
                              Change Category
                            </DropdownMenuItem>
                            <AnalysisDialog
                              dealId={dealId}
                              documentId={doc.id}
                              documentName={doc.name}
                              isAnalyzed={doc.isAnalyzed}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  {doc.isAnalyzed ? "View Analysis" : "Analyze Document"}
                                </DropdownMenuItem>
                              }
                            />
                            {!doc.isPrimaryContract && (
                              <DropdownMenuItem onClick={() => handleSetPrimary(doc.id)}>
                                <Star className="mr-2 h-4 w-4" />
                                Set as Primary Contract
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(doc.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {documentGroups.map((group) => (
            <div key={group.label || "all"}>
              {group.label && (
                <h3 className="text-md font-medium text-slate-300 mb-3 border-b border-slate-700 pb-2">
                  {group.label} ({group.documents.length})
                </h3>
              )}
              <Card className="bg-slate-900 border-slate-800">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={group.documents.every((d) => selectedIds.has(d.id)) && group.documents.length > 0}
                          onCheckedChange={(checked) => {
                            group.documents.forEach((d) => handleSelectOne(d.id, checked as boolean))
                          }}
                        />
                      </TableHead>
                      {sortBy === "manual" && <TableHead className="w-16">Order</TableHead>}
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.documents.map((doc, index) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(doc.id)}
                            onCheckedChange={(checked) => handleSelectOne(doc.id, checked as boolean)}
                          />
                        </TableCell>
                        {sortBy === "manual" && (
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={index === 0}
                                onClick={() => handleMove(doc.id, "up")}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={index === documents.length - 1}
                                onClick={() => handleMove(doc.id, "down")}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSmallFileIcon(doc.fileType)}
                            <a
                              href={doc.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-sm text-white hover:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              {doc.name}
                              <ExternalLink className="h-3 w-3 opacity-50" />
                            </a>
                            {doc.isPrimaryContract && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                            {doc.isAnalyzed && (
                              <Sparkles className="h-4 w-4 text-purple-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {doc.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {formatFileSize(doc.fileSize)}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {formatDate(doc.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-white"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <a href={doc.downloadUrl} target="_blank" rel="noreferrer">
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openRenameDialog(doc)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openCategoryDialog(doc)}>
                                <Tag className="mr-2 h-4 w-4" />
                                Change Category
                              </DropdownMenuItem>
                              <AnalysisDialog
                                dealId={dealId}
                                documentId={doc.id}
                                documentName={doc.name}
                                isAnalyzed={doc.isAnalyzed}
                                trigger={
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {doc.isAnalyzed ? "View Analysis" : "Analyze Document"}
                                  </DropdownMenuItem>
                                }
                              />
                              {!doc.isPrimaryContract && (
                                <DropdownMenuItem onClick={() => handleSetPrimary(doc.id)}>
                                  <Star className="mr-2 h-4 w-4" />
                                  Set as Primary Contract
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDelete(doc.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          ))}
        </div>
      )}

      <DocumentUploader
        dealId={dealId}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={fetchDocuments}
      />

      <MultiDocumentAnalysisDialog
        dealId={dealId}
        documents={selectedDocuments}
        isOpen={isMultiAnalysisOpen}
        onClose={() => setIsMultiAnalysisOpen(false)}
        onAnalysisComplete={() => {
          fetchDocuments()
          setSelectedIds(new Set())
        }}
      />

      <Dialog open={!!renameDoc} onOpenChange={(open) => !open && setRenameDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document-name">Name</Label>
              <Input
                id="document-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDoc(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!categoryDoc} onOpenChange={(open) => !open && setCategoryDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document-category">Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger id="document-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((cat) => cat.value !== "ALL").map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDoc(null)}>
              Cancel
            </Button>
            <Button onClick={handleChangeCategory} disabled={!newCategory}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
