"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Upload,
  FileText,
  FileIcon,
  Image,
  Table,
  MoreVertical,
  Download,
  Trash2,
  ExternalLink,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Document {
  id: string
  name: string
  originalName: string
  category: string
  fileType: string
  fileSize: number
  downloadUrl: string
  uploadedBy: { id: string; name: string }
  createdAt: string
}

interface IssueDocumentsProps {
  issueId: string
  dealId: string
}

export function IssueDocuments({ issueId, dealId }: IssueDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/issues/${issueId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setIsLoading(false)
    }
  }, [issueId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("issueId", issueId)
      formData.append("category", "OTHER")

      try {
        const response = await fetch(`/api/deals/${dealId}/documents`, {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          toast({
            title: "Upload successful",
            description: `${file.name} has been uploaded.`,
          })
        } else {
          const data = await response.json()
          toast({
            title: "Upload failed",
            description: data.error || `Failed to upload ${file.name}`,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Upload failed",
          description: `Error uploading ${file.name}`,
          variant: "destructive",
        })
      }
    }

    setIsUploading(false)
    fetchDocuments()
    // Reset the input
    event.target.value = ""
  }

  async function handleDelete(documentId: string) {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      await fetch(`/api/deals/${dealId}/documents/${documentId}`, {
        method: "DELETE",
      })
      setDocuments(documents.filter((d) => d.id !== documentId))
      toast({
        title: "Document deleted",
        description: "The document has been removed.",
      })
    } catch (error) {
      console.error("Failed to delete document:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete the document.",
        variant: "destructive",
      })
    }
  }

  function getFileIcon(fileType: string) {
    if (fileType.startsWith("image/")) {
      return <Image className="h-6 w-6 text-purple-500" />
    }
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) {
      return <Table className="h-6 w-6 text-green-500" />
    }
    if (fileType.includes("pdf")) {
      return <FileText className="h-6 w-6 text-red-500" />
    }
    return <FileIcon className="h-6 w-6 text-blue-500" />
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
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-800 rounded w-1/4"></div>
            <div className="h-20 bg-slate-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            Documents ({documents.length})
          </CardTitle>
          <div className="relative">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Button size="sm" variant="outline" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-6">
            <FileIcon className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <p className="text-slate-500 text-sm mb-3">
              No documents attached to this issue
            </p>
            <div className="relative inline-block">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <Button size="sm" variant="outline" disabled={isUploading}>
                <Upload className="h-4 w-4 mr-1" />
                Upload Document
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(doc.fileType)}
                  <div className="min-w-0">
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-white hover:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span className="truncate">{doc.name}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100" />
                    </a>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>•</span>
                      <span>{doc.uploadedBy.name}</span>
                      <span>•</span>
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100"
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
