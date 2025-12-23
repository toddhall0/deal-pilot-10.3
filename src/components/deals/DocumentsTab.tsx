"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { DocumentUploader } from "@/components/documents/DocumentUploader"
import {
  Upload,
  FileIcon,
  FileText,
  Image,
  Table,
  MoreVertical,
  Download,
  Trash2,
  Star,
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
  uploadedBy: { id: string; name: string }
  createdAt: string
}

interface DocumentsTabProps {
  dealId: string
}

const CATEGORIES = [
  { value: "ALL", label: "All Categories" },
  { value: "CONTRACT", label: "Contract" },
  { value: "AMENDMENT", label: "Amendment" },
  { value: "DUE_DILIGENCE", label: "Due Diligence" },
  { value: "TITLE", label: "Title" },
  { value: "SURVEY", label: "Survey" },
  { value: "ENVIRONMENTAL", label: "Environmental" },
  { value: "FINANCIAL", label: "Financial" },
  { value: "LEGAL", label: "Legal" },
  { value: "CORRESPONDENCE", label: "Correspondence" },
  { value: "CLOSING", label: "Closing" },
  { value: "OTHER", label: "Other" },
]

export function DocumentsTab({ dealId }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState("ALL")

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

  function getFileIcon(fileType: string) {
    if (fileType.startsWith("image/")) {
      return <Image className="h-8 w-8 text-purple-500" />
    }
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) {
      return <Table className="h-8 w-8 text-green-500" />
    }
    if (fileType.includes("pdf")) {
      return <FileText className="h-8 w-8 text-red-500" />
    }
    return <FileIcon className="h-8 w-8 text-blue-500" />
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

  if (isLoading) {
    return <div className="p-4">Loading documents...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Documents ({documents.length})</h2>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
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
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <FileIcon className="mx-auto h-10 w-10 text-gray-300 mb-2" />
            <p className="text-gray-500 mb-4">No documents yet</p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload your first document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="relative group">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getFileIcon(doc.fileType)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate" title={doc.name}>
                        {doc.name}
                      </h3>
                      {doc.isPrimaryContract && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {doc.category}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatFileSize(doc.fileSize)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {doc.uploadedBy.name} • {formatDate(doc.createdAt)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100"
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
                      {doc.category === "CONTRACT" && !doc.isPrimaryContract && (
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
      )}

      <DocumentUploader
        dealId={dealId}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={fetchDocuments}
      />
    </div>
  )
}
