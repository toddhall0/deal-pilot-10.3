"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserEditor } from "@/components/users/UserEditor"
import {
  Plus,
  Search,
  Users,
  MoreVertical,
  Edit,
  UserX,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  lastLoginAt: string | null
  _count: {
    assignedTasks: number
    documents: number
  }
}

const ROLES = [
  { value: "ALL", label: "All Roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "ATTORNEY", label: "Attorney" },
  { value: "CLIENT", label: "Client" },
]

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800",
  ATTORNEY: "bg-blue-100 text-blue-800",
  CLIENT: "bg-green-100 text-green-800",
}

export default function UsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")

  // Redirect non-admins
  useEffect(() => {
    if (session && session.user.role !== "ADMIN") {
      router.push("/dashboard")
    }
  }, [session, router])

  useEffect(() => {
    if (session?.user.role === "ADMIN") {
      fetchUsers()
    }
  }, [session, roleFilter])

  async function fetchUsers() {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (roleFilter !== "ALL") params.append("role", roleFilter)

      const response = await fetch(`/api/users?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers()
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsEditorOpen(true)
  }

  const handleDeactivate = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return

    try {
      await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "INACTIVE" }),
      })
      fetchUsers()
    } catch (error) {
      console.error("Failed to deactivate user:", error)
    }
  }

  const handleActivate = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      })
      fetchUsers()
    } catch (error) {
      console.error("Failed to activate user:", error)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            Active
          </div>
        )
      case "INACTIVE":
        return (
          <div className="flex items-center gap-1 text-gray-400">
            <XCircle className="h-4 w-4" />
            Inactive
          </div>
        )
      case "PENDING":
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <Clock className="h-4 w-4" />
            Pending
          </div>
        )
      default:
        return status
    }
  }

  if (session?.user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-gray-500">Manage team members and access</p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null)
            setIsEditorOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Users className="mx-auto h-10 w-10 text-gray-300 mb-2" />
            <p className="text-gray-500 mb-4">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={ROLE_COLORS[user.role] || "bg-gray-100 text-gray-800"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusDisplay(user.status)}</TableCell>
                  <TableCell>{user._count.assignedTasks}</TableCell>
                  <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {user.status === "ACTIVE" ? (
                          <DropdownMenuItem
                            onClick={() => handleDeactivate(user.id)}
                            className="text-red-600"
                            disabled={user.id === session?.user.id}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleActivate(user.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <UserEditor
        user={editingUser}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingUser(null)
        }}
        onSave={fetchUsers}
      />
    </div>
  )
}
