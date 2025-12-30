"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
} from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  name: string
  type: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  deals: {
    id: string
    dealNumber: string
    propertyName: string | null
    propertyAddress: string | null
    status: string
    type: string
    createdAt: string
  }[]
  _count: {
    deals: number
  }
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ACTIVE: "bg-blue-100 text-blue-800",
  UNDER_CONTRACT: "bg-purple-100 text-purple-800",
  IN_DUE_DILIGENCE: "bg-yellow-100 text-yellow-800",
  PENDING_CLOSING: "bg-orange-100 text-orange-800",
  CLOSED: "bg-emerald-100 text-emerald-800",
  TERMINATED: "bg-red-100 text-red-800",
  ON_HOLD: "bg-gray-100 text-gray-600",
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  useEffect(() => {
    fetchClient()
  }, [params.id])

  async function fetchClient() {
    try {
      const response = await fetch(`/api/clients/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data)
      } else {
        router.push("/clients")
      }
    } catch (error) {
      console.error("Failed to fetch client:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this client?")) return

    try {
      const response = await fetch(`/api/clients/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/clients")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete client")
      }
    } catch (error) {
      console.error("Failed to delete client:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (isLoading) {
    return <div className="p-8">Loading client...</div>
  }

  if (!client) {
    return <div className="p-8">Client not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
          </div>
          <Badge variant="secondary">{client.type || "Individual"}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditorOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-red-600"
            onClick={handleDelete}
            disabled={client._count.deals > 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Client Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a
                    href={`mailto:${client.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a
                    href={`tel:${client.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {client.phone}
                  </a>
                </div>
              )}
            </div>
            {client.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <p>{client.address}</p>
              </div>
            )}
            {client.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {client.website}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total Deals</p>
              <p className="text-2xl font-bold">{client._count.deals}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Deals ({client.deals.length})
          </CardTitle>
          <Link href={`/deals/new?clientId=${client.id}`}>
            <Button size="sm">Create Deal</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {client.deals.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No deals yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <Link
                        href={`/deals/${deal.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {deal.dealNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {deal.propertyName || deal.propertyAddress || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{deal.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[deal.status] || "bg-gray-100"}>
                        {deal.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(deal.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ClientEditor
        client={client}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={fetchClient}
      />
    </div>
  )
}
