"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RichTextEditor } from "./RichTextEditor"
import { Loader2 } from "lucide-react"

interface Note {
  id: string
  title: string | null
  content: string
  category: string | null
  tags: string[]
}

interface NoteEditorProps {
  dealId: string
  note?: Note | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

const CATEGORIES = [
  { value: "GENERAL", label: "General" },
  { value: "TITLE", label: "Title" },
  { value: "SURVEY", label: "Survey" },
  { value: "ENVIRONMENTAL", label: "Environmental" },
  { value: "FINANCIAL", label: "Financial" },
  { value: "LEGAL", label: "Legal" },
  { value: "CLOSING", label: "Closing" },
  { value: "MEETING", label: "Meeting Notes" },
  { value: "CALL", label: "Call Notes" },
]

export function NoteEditor({
  dealId,
  note,
  isOpen,
  onClose,
  onSave,
}: NoteEditorProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("GENERAL")
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = !!note

  useEffect(() => {
    if (note) {
      setTitle(note.title || "")
      setContent(note.content)
      setCategory(note.category || "GENERAL")
    } else {
      setTitle("")
      setContent("")
      setCategory("GENERAL")
    }
  }, [note, isOpen])

  const handleSave = async () => {
    if (!content.trim() || content === "<p></p>") {
      alert("Please enter some content for the note")
      return
    }

    setIsSaving(true)

    try {
      const url = isEditing
        ? `/api/deals/${dealId}/notes/${note.id}`
        : `/api/deals/${dealId}/notes`

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || null,
          content,
          category,
        }),
      })

      if (response.ok) {
        onSave()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to save note")
      }
    } catch (error) {
      console.error("Failed to save note:", error)
      alert("Failed to save note")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Note" : "New Note"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
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

          {/* Content */}
          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Write your note here..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Note"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
