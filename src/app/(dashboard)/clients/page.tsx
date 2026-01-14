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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ClientEditor } from "@/components/clients/ClientEditor"
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react"
import Link from "next/link"
import { TableSkeleton } from "@/components/ui/skeleton-loaders"

interface Client {
  id: string
  name: string
  type: string | null
  address: string | null
  email: string | null
  phone: string | null
  website: string | null
  _count: {
    deals: number
  }
}

const CLIENT_TYPES = [
  { value: "ALL", label: "All Types" },
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "COMPANY", label: "Company" },
  { value: "TRUST", label: "Trust" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "LLC", label: "LLC" },
  { value: "CORPORATION", label: "Corporation" },
]

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")

  useEffect(() => {
    fetchClients()
  }, [typeFilter])

  async function fetchClients() {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (typeFilter !== "ALL") params.append("type", typeFilter)

      const response = await fetch(`/api/clients?${params.toString()}`)
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error("Failed to fetch clients:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchClients()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Clients</h1>
          <p className="text-gray-500">Manage your clients and contacts</p>
        </div>
        <Button onClick={() => setIsEditorOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLIENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clients Table */}
      {isLoading ? (
        <Card className="bg-slate-900 border-slate-800">
          <TableSkeleton rows={6} columns={4} />
        </Card>
      ) : clients.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-10 text-center">
            <Users className="mx-auto h-10 w-10 text-gray-300 mb-2" />
            <p className="text-gray-500 mb-4">No clients found</p>
            <Button onClick={() => setIsEditorOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-900 border-slate-800">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Deals</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div>
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-medium hover:underline"
                      >
                        {client.name}
                      </Link>
                      {client.address && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {client.address}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {client.type || "Individual"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {client.email && (
                        <p className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {client.email}
                        </p>
                      )}
                      {client.phone && (
                        <p className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {client.phone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span>{client._count.deals}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/clients/${client.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <ClientEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={fetchClients}
      />
    </div>
  )
}
