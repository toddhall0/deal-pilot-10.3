"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Pin,
  PinOff,
  Save,
  X,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Note {
  id: string
  title: string | null
  content: string
  plainText: string | null
  category: string | null
  isPinned: boolean
  author: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

interface IssueNotesProps {
  issueId: string
}

export function IssueNotes({ issueId }: IssueNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [newNoteContent, setNewNoteContent] = useState("")
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")

  useEffect(() => {
    fetchNotes()
  }, [issueId])

  async function fetchNotes() {
    try {
      const response = await fetch(`/api/issues/${issueId}/notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddNote() {
    if (!newNoteContent.trim()) return

    try {
      const response = await fetch(`/api/issues/${issueId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newNoteTitle || null,
          content: newNoteContent,
          plainText: newNoteContent,
        }),
      })

      if (response.ok) {
        setNewNoteTitle("")
        setNewNoteContent("")
        setIsAdding(false)
        fetchNotes()
      }
    } catch (error) {
      console.error("Failed to add note:", error)
    }
  }

  async function handleUpdateNote(noteId: string) {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`/api/issues/${issueId}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle || null,
          content: editContent,
          plainText: editContent,
        }),
      })

      if (response.ok) {
        setEditingNoteId(null)
        setEditTitle("")
        setEditContent("")
        fetchNotes()
      }
    } catch (error) {
      console.error("Failed to update note:", error)
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm("Are you sure you want to delete this note?")) return

    try {
      await fetch(`/api/issues/${issueId}/notes/${noteId}`, {
        method: "DELETE",
      })
      setNotes(notes.filter((n) => n.id !== noteId))
    } catch (error) {
      console.error("Failed to delete note:", error)
    }
  }

  async function handleTogglePin(noteId: string, currentlyPinned: boolean) {
    try {
      await fetch(`/api/issues/${issueId}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !currentlyPinned }),
      })
      fetchNotes()
    } catch (error) {
      console.error("Failed to toggle pin:", error)
    }
  }

  function startEditing(note: Note) {
    setEditingNoteId(note.id)
    setEditTitle(note.title || "")
    setEditContent(note.content)
  }

  function cancelEditing() {
    setEditingNoteId(null)
    setEditTitle("")
    setEditContent("")
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
            Notes ({notes.length})
          </CardTitle>
          {!isAdding && (
            <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        {isAdding && (
          <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg">
            <Input
              placeholder="Note title (optional)"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
            <Textarea
              placeholder="Write your note..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="bg-slate-800 border-slate-700 min-h-[100px]"
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAdding(false)
                  setNewNoteTitle("")
                  setNewNoteContent("")
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddNote} disabled={!newNoteContent.trim()}>
                <Save className="h-4 w-4 mr-1" />
                Save Note
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {notes.length === 0 && !isAdding ? (
          <p className="text-slate-500 text-center py-4">
            No notes yet. Add a note to track important information about this issue.
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-lg bg-slate-800/50 ${
                  note.isPinned ? "border border-yellow-500/50" : ""
                }`}
              >
                {editingNoteId === note.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <Input
                      placeholder="Note title (optional)"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="bg-slate-800 border-slate-700"
                    />
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="bg-slate-800 border-slate-700 min-h-[100px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={cancelEditing}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={!editContent.trim()}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {note.isPinned && (
                          <Pin className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                        {note.title && (
                          <span className="font-medium text-white text-sm">
                            {note.title}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        {note.author.name} •{" "}
                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                        {note.updatedAt !== note.createdAt && " (edited)"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditing(note)}>
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
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
