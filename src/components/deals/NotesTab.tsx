"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { NoteEditor } from "@/components/notes/NoteEditor"
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Pin,
  PinOff,
  FileText,
} from "lucide-react"

interface Note {
  id: string
  title: string | null
  content: string
  plainText: string | null
  category: string | null
  tags: string[]
  isPinned: boolean
  author: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

interface NotesTabProps {
  dealId: string
}

const CATEGORIES = [
  { value: "ALL", label: "All Categories" },
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

export function NotesTab({ dealId }: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchNotes()
  }, [dealId, categoryFilter])

  async function fetchNotes() {
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== "ALL") {
        params.append("category", categoryFilter)
      }
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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchNotes()
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

  async function handleTogglePin(noteId: string, currentlyPinned: boolean) {
    try {
      await fetch(`/api/deals/${dealId}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !currentlyPinned }),
      })
      fetchNotes()
    } catch (error) {
      console.error("Failed to toggle pin:", error)
    }
  }

  function handleEdit(note: Note) {
    setEditingNote(note)
    setIsEditorOpen(true)
  }

  function handleNewNote() {
    setEditingNote(null)
    setIsEditorOpen(true)
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

  function truncateText(text: string, maxLength: number) {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  if (isLoading) {
    return <div className="p-4">Loading notes...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <h2 className="text-lg font-semibold">Notes ({notes.length})</h2>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </form>
          <Button onClick={handleNewNote}>
            <Plus className="mr-2 h-4 w-4" />
            Add Note
          </Button>
        </div>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <FileText className="mx-auto h-10 w-10 text-gray-300 mb-2" />
            <p className="text-gray-500 mb-4">No notes yet</p>
            <Button onClick={handleNewNote}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card
              key={note.id}
              className={`group ${note.isPinned ? "border-yellow-300 bg-yellow-50/50" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {note.isPinned && (
                        <Pin className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                      )}
                      <h3 className="font-medium">
                        {note.title || "Untitled Note"}
                      </h3>
                      {note.category && (
                        <Badge variant="secondary" className="text-xs">
                          {note.category}
                        </Badge>
                      )}
                    </div>

                    {/* Preview of content */}
                    <p className="text-sm text-gray-600 mb-2">
                      {truncateText(note.plainText || "", 200)}
                    </p>

                    <p className="text-xs text-gray-400">
                      {note.author.name} • {formatDate(note.createdAt)}
                      {note.updatedAt !== note.createdAt && " (edited)"}
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
                      <DropdownMenuItem onClick={() => handleEdit(note)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleTogglePin(note.id, note.isPinned)}
                      >
                        {note.isPinned ? (
                          <>
                            <PinOff className="mr-2 h-4 w-4" />
                            Unpin
                          </>
                        ) : (
                          <>
                            <Pin className="mr-2 h-4 w-4" />
                            Pin
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(note.id)}
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

      {/* Note Editor Dialog */}
      <NoteEditor
        dealId={dealId}
        note={editingNote}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingNote(null)
        }}
        onSave={fetchNotes}
      />
    </div>
  )
}
