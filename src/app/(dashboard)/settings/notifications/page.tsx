"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, Bell, Mail, Clock, CheckSquare, AlertTriangle } from "lucide-react"

type NotificationFrequency = "REALTIME" | "DAILY" | "WEEKLY"

interface UserPreferences {
  id: string
  emailNotifications: boolean
  taskReminders: boolean
  deadlineAlerts: boolean
  notificationFrequency: NotificationFrequency
  dailySummaryTime: string | null
  weeklySummaryDay: number | null
}

export default function NotificationPreferencesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences>({
    id: "",
    emailNotifications: true,
    taskReminders: true,
    deadlineAlerts: true,
    notificationFrequency: "REALTIME",
    dailySummaryTime: null,
    weeklySummaryDay: null,
  })

  useEffect(() => {
    fetchPreferences()
  }, [])

  async function fetchPreferences() {
    try {
      const response = await fetch("/api/notifications/preferences")
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications: preferences.emailNotifications,
          taskReminders: preferences.taskReminders,
          deadlineAlerts: preferences.deadlineAlerts,
          notificationFrequency: preferences.notificationFrequency,
          dailySummaryTime: preferences.dailySummaryTime,
          weeklySummaryDay: preferences.weeklySummaryDay,
        }),
      })
      alert("Preferences saved!")
    } catch (error) {
      console.error("Failed to save preferences:", error)
      alert("Failed to save preferences")
    } finally {
      setIsSaving(false)
    }
  }

  const updatePreference = <K extends keyof UserPreferences>(
    field: K,
    value: UserPreferences[K]
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
        <p className="text-gray-500">
          Manage how and when you receive notifications
        </p>
      </div>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Notifications</CardTitle>
          <CardDescription>
            Control email notification delivery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(v) => updatePreference("emailNotifications", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Types</CardTitle>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-3">
              <CheckSquare className="h-5 w-5 text-gray-500" />
              <div>
                <Label>Task Reminders</Label>
                <p className="text-sm text-gray-500">Get reminders about upcoming and overdue tasks</p>
              </div>
            </div>
            <Switch
              checked={preferences.taskReminders}
              onCheckedChange={(v) => updatePreference("taskReminders", v)}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-gray-500" />
              <div>
                <Label>Deadline Alerts</Label>
                <p className="text-sm text-gray-500">Get alerts about approaching deadlines and milestones</p>
              </div>
            </div>
            <Switch
              checked={preferences.deadlineAlerts}
              onCheckedChange={(v) => updatePreference("deadlineAlerts", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Frequency Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Frequency</CardTitle>
          <CardDescription>
            Choose how often you receive notification summaries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <Label>Delivery Frequency</Label>
                <p className="text-sm text-gray-500">How often to receive notification emails</p>
              </div>
            </div>
            <Select
              value={preferences.notificationFrequency}
              onValueChange={(v) => updatePreference("notificationFrequency", v as NotificationFrequency)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REALTIME">Real-time</SelectItem>
                <SelectItem value="DAILY">Daily Summary</SelectItem>
                <SelectItem value="WEEKLY">Weekly Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {preferences.notificationFrequency === "DAILY" && (
            <div className="flex items-center justify-between pt-2">
              <div>
                <Label>Summary Time</Label>
                <p className="text-sm text-gray-500">When to send daily summary</p>
              </div>
              <Select
                value={preferences.dailySummaryTime || "09:00"}
                onValueChange={(v) => updatePreference("dailySummaryTime", v)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="06:00">6:00 AM</SelectItem>
                  <SelectItem value="08:00">8:00 AM</SelectItem>
                  <SelectItem value="09:00">9:00 AM</SelectItem>
                  <SelectItem value="12:00">12:00 PM</SelectItem>
                  <SelectItem value="17:00">5:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {preferences.notificationFrequency === "WEEKLY" && (
            <div className="flex items-center justify-between pt-2">
              <div>
                <Label>Summary Day</Label>
                <p className="text-sm text-gray-500">When to send weekly summary</p>
              </div>
              <Select
                value={String(preferences.weeklySummaryDay ?? 1)}
                onValueChange={(v) => updatePreference("weeklySummaryDay", parseInt(v))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
