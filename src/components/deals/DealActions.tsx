"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoreHorizontal, Archive, ArchiveRestore, Trash2, Loader2 } from "lucide-react"

interface DealActionsProps {
  dealId: string
  dealName: string
  isArchived: boolean
  onArchiveChange?: (isArchived: boolean) => void
}

export function DealActions({ dealId, dealName, isArchived, onArchiveChange }: DealActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [action, setAction] = useState<"archive" | "delete" | null>(null)

  const handleArchive = async () => {
    setIsLoading(true)
    setAction("archive")

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !isArchived }),
      })

      if (!response.ok) throw new Error("Failed to update deal")

      onArchiveChange?.(!isArchived)
      router.refresh()
    } catch (error) {
      console.error("Archive error:", error)
      alert("Failed to update deal")
    } finally {
      setIsLoading(false)
      setAction(null)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    setAction("delete")

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete deal")

      setShowDeleteDialog(false)
      router.push("/deals")
      router.refresh()
    } catch (error) {
      console.error("Delete error:", error)
      alert("Failed to delete deal")
    } finally {
      setIsLoading(false)
      setAction(null)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleArchive} disabled={isLoading}>
            {isArchived ? (
              <>
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Restore from Archive
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Archive Deal
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Deal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{dealName}&quot;? This action cannot be undone.
              All associated tasks, documents, notes, and other data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading && action === "delete" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Deal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
