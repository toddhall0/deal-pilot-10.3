"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RichTextEditor } from "@/components/notes/RichTextEditor"
import {
  Plus,
  Search,
  Pin,
  MoreVertical,
  Trash2,
  Edit,
  Loader2,
  StickyNote,
} from "lucide-react"

interface Note {
  id: string
  title: string | null
  content: string
  plainText: string | null
  isPinned: boolean
  category: string | null
  tags: string[]
  author: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

interface NotesTabProps {
  dealId: string
}

export function NotesTab({ dealId }: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  useEffect(() => {
    fetchNotes()
  }, [dealId])

  async function fetchNotes() {
    try {
      const params = new URLSearchParams()
      if (searchQuery) {
        params.append("search", searchQuery)
      }

      const response = await fetch(
        `/api/deals/${dealId}/notes?${params.toString()}`
      )
      const data = await response.json()
      setNotes(data)
    } catch (error) {
      console.error("Failed to fetch notes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchNotes()
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  function openNewNote() {
    setEditingNote(null)
    setTitle("")
    setContent("")
    setIsDialogOpen(true)
  }

  function openEditNote(note: Note) {
    setEditingNote(note)
    setTitle(note.title || "")
    setContent(note.content)
    setIsDialogOpen(true)
  }

  async function handleSave() {
    if (!content.trim()) return

    setIsSaving(true)

    try {
      if (editingNote) {
        // Update existing note
        const response = await fetch(
          `/api/deals/${dealId}/notes/${editingNote.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: title || null, content }),
          }
        )
        if (response.ok) {
          fetchNotes()
        }
      } else {
        // Create new note
        const response = await fetch(`/api/deals/${dealId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title || null, content }),
        })
        if (response.ok) {
          fetchNotes()
        }
      }

      setIsDialogOpen(false)
      setTitle("")
      setContent("")
      setEditingNote(null)
    } catch (error) {
      console.error("Failed to save note:", error)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(noteId: string) {
    if (!confirm("Are you sure you want to delete this note?")) return

    try {
      await fetch(`/api/deals/${dealId}/notes/${noteId}`, {
        method: "DELETE",
      })
      setNotes(notes.filter((n) => n.id !== noteId))
    } catch (error) {
      console.error("Failed to delete note:", error)
    }
  }

  async function handleTogglePin(note: Note) {
    try {
      await fetch(`/api/deals/${dealId}/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !note.isPinned }),
      })
      fetchNotes()
    } catch (error) {
      console.error("Failed to toggle pin:", error)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  function truncateText(text: string | null, maxLength: number) {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + "..."
  }

  if (isLoading) {
    return <div className="p-4">Loading notes...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Notes ({notes.length})</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
        <Button onClick={openNewNote}>
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <StickyNote className="mx-auto h-10 w-10 text-gray-300 mb-2" />
            <p className="text-gray-500 mb-4">No notes yet</p>
            <Button onClick={openNewNote}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card
              key={note.id}
              className={`relative group cursor-pointer hover:shadow-md transition-shadow ${
                note.isPinned ? "border-yellow-400 border-2" : ""
              }`}
              onClick={() => openEditNote(note)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {note.isPinned && (
                      <Pin className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                    <h3 className="font-medium text-sm">
                      {note.title || "Untitled"}
                    </h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditNote(note)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTogglePin(note)
                        }}
                      >
                        <Pin className="mr-2 h-4 w-4" />
                        {note.isPinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(note.id)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {truncateText(note.plainText, 150)}
                </p>
                <p className="text-xs text-gray-400">
                  {note.author.name} • {formatDate(note.updatedAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Note Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? "Edit Note" : "New Note"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write your note..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!content.trim() || isSaving}>
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
    </div>
  )
}
