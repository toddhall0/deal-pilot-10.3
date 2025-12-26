"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  CheckCircle,
  Circle,
  Clock,
  XCircle,
  MinusCircle,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Calendar,
} from "lucide-react"
import { getDaysUntilDue, getStatusColor } from "@/lib/milestoneStatus"

interface Milestone {
  id: string
  name: string
  description: string | null
  dueDate: string
  completedDate: string | null
  status: string
  children?: Milestone[]
}

interface MilestoneItemProps {
  milestone: Milestone
  dealId: string
  level?: number
  onUpdate: () => void
  onEdit: (milestone: Milestone) => void
  onAddChild: (parentId: string) => void
}

export function MilestoneItem({
  milestone,
  dealId,
  level = 0,
  onUpdate,
  onEdit,
  onAddChild,
}: MilestoneItemProps) {
  const [isOpen, setIsOpen] = useState(true)
  const hasChildren = milestone.children && milestone.children.length > 0
  const daysUntil = getDaysUntilDue(milestone.dueDate)

  const getStatusIcon = () => {
    switch (milestone.status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "IN_PROGRESS":
        return <Clock className="h-5 w-5 text-blue-600" />
      case "MISSED":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "WAIVED":
      case "NOT_APPLICABLE":
        return <MinusCircle className="h-5 w-5 text-gray-400" />
      default:
        return <Circle className="h-5 w-5 text-yellow-600" />
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await fetch(`/api/deals/${dealId}/milestones/${milestone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      onUpdate()
    } catch (error) {
      console.error("Failed to update status:", error)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this milestone?")) return

    try {
      await fetch(`/api/deals/${dealId}/milestones/${milestone.id}`, {
        method: "DELETE",
      })
      onUpdate()
    } catch (error) {
      console.error("Failed to delete milestone:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getDaysLabel = () => {
    if (milestone.status === "COMPLETED") {
      return <span className="text-green-600 text-sm">Completed</span>
    }
    if (milestone.status === "WAIVED" || milestone.status === "NOT_APPLICABLE") {
      return <span className="text-gray-400 text-sm">{milestone.status.replace("_", " ")}</span>
    }
    if (daysUntil < 0) {
      return <span className="text-red-600 text-sm font-medium">{Math.abs(daysUntil)} days overdue</span>
    }
    if (daysUntil === 0) {
      return <span className="text-orange-600 text-sm font-medium">Due today</span>
    }
    if (daysUntil <= 3) {
      return <span className="text-orange-600 text-sm">{daysUntil} days left</span>
    }
    return <span className="text-gray-500 text-sm">{daysUntil} days left</span>
  }

  return (
    <div className={`${level > 0 ? "ml-6 border-l-2 border-gray-200 pl-4" : ""}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-3 py-2 group">
          {/* Expand/Collapse */}
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6" />
          )}

          {/* Status Icon */}
          <button
            onClick={() =>
              handleStatusChange(
                milestone.status === "COMPLETED" ? "PENDING" : "COMPLETED"
              )
            }
            className="hover:scale-110 transition-transform"
          >
            {getStatusIcon()}
          </button>

          {/* Name and Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`font-medium ${
                  milestone.status === "COMPLETED"
                    ? "line-through text-gray-400"
                    : ""
                }`}
              >
                {milestone.name}
              </span>
              {milestone.status !== "PENDING" && (
                <Badge className={getStatusColor(milestone.status as any)}>
                  {milestone.status.replace("_", " ")}
                </Badge>
              )}
            </div>
            {milestone.description && (
              <p className="text-sm text-gray-500 truncate">
                {milestone.description}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="h-3 w-3" />
                {formatDate(milestone.dueDate)}
              </div>
              {getDaysLabel()}
            </div>

            {/* Actions */}
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
                <DropdownMenuItem onClick={() => onEdit(milestone)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddChild(milestone.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Sub-milestone
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleStatusChange("COMPLETED")}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("WAIVED")}>
                  <MinusCircle className="mr-2 h-4 w-4" />
                  Mark Waived
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Children */}
        {hasChildren && (
          <CollapsibleContent>
            <div className="mt-1">
              {milestone.children!.map((child) => (
                <MilestoneItem
                  key={child.id}
                  milestone={child}
                  dealId={dealId}
                  level={level + 1}
                  onUpdate={onUpdate}
                  onEdit={onEdit}
                  onAddChild={onAddChild}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  )
}
