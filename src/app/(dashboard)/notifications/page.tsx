"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  FileText,
  CheckSquare,
  Calendar,
  DollarSign,
  Briefcase,
  Loader2,
} from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link: string | null
  entityType: string | null
  entityId: string | null
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL")
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  async function fetchNotifications(loadMore = false) {
    try {
      if (!loadMore) {
        setIsLoading(true)
        setCursor(null)
      }

      const params = new URLSearchParams()
      params.append("limit", "20")
      if (filter === "UNREAD") params.append("unread", "true")
      if (loadMore && cursor) params.append("cursor", cursor)

      const response = await fetch(`/api/notifications?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        if (loadMore) {
          setNotifications((prev) => [...prev, ...data.notifications])
        } else {
          setNotifications(data.notifications)
        }
        setHasMore(data.hasMore)
        setCursor(data.nextCursor)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  async function markAllAsRead() {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  async function deleteNotification(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED":
      case "TASK_DUE_SOON":
      case "TASK_OVERDUE":
        return <CheckSquare className="h-5 w-5" />
      case "MILESTONE_DUE_SOON":
      case "MILESTONE_OVERDUE":
      case "MILESTONE_COMPLETED":
        return <Calendar className="h-5 w-5" />
      case "DOCUMENT_UPLOADED":
      case "DOCUMENT_ANALYZED":
        return <FileText className="h-5 w-5" />
      case "DEPOSIT_DUE_SOON":
        return <DollarSign className="h-5 w-5" />
      default:
        return <Briefcase className="h-5 w-5" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as "ALL" | "UNREAD")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="UNREAD">Unread</SelectItem>
            </SelectContent>
          </Select>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-10 text-center">
            <Bell className="mx-auto h-10 w-10 text-slate-600 mb-2" />
            <p className="text-slate-400">No notifications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`bg-slate-900 border-slate-800 ${notification.isRead ? "" : "border-blue-500/50 bg-blue-500/10"}`}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div
                    className={`p-2 rounded-full ${
                      !notification.isRead
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        {notification.link ? (
                          <Link
                            href={notification.link}
                            onClick={() => {
                              if (!notification.isRead) markAsRead(notification.id)
                            }}
                          >
                            <h3 className="font-medium text-white hover:text-blue-400">
                              {notification.title}
                            </h3>
                          </Link>
                        ) : (
                          <h3 className="font-medium text-white">{notification.title}</h3>
                        )}
                        <p className="text-slate-400 mt-1">{notification.message}</p>
                        <p className="text-sm text-slate-500 mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {hasMore && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={() => fetchNotifications(true)}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
