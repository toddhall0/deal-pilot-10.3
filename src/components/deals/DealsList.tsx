"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface Deal {
  id: string
  name: string
  dealNumber: string
  type: string
  status: string
  isArchived?: boolean
  propertyCity: string | null
  propertyState: string | null
  client: {
    id: string
    name: string
  }
}

export function DealsList() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [includeArchived, setIncludeArchived] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDeals() {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (includeArchived) {
          params.set("includeArchived", "true")
        }
        const response = await fetch(`/api/deals?${params}`)
        if (!response.ok) throw new Error("Failed to fetch deals")
        const data = await response.json()
        setDeals(data)
      } catch (error) {
        console.error("Error fetching deals:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeals()
  }, [includeArchived])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Deals</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="show-archived"
              checked={includeArchived}
              onCheckedChange={setIncludeArchived}
            />
            <Label htmlFor="show-archived" className="text-sm text-slate-400">
              Show archived
            </Label>
          </div>
          <Link href="/deals/new">
            <Button>New Deal</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : deals.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">
              {includeArchived ? "No deals found" : "No active deals"}
            </p>
            <Link href="/deals/new">
              <Button>Create your first deal</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {deals.map((deal) => (
            <Link key={deal.id} href={`/deals/${deal.id}`}>
              <Card className="bg-slate-900 border-slate-800 hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{deal.name}</CardTitle>
                      <p className="text-sm text-slate-400">
                        {deal.dealNumber} • {deal.client.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {deal.isArchived === true && (
                        <Badge variant="outline" className="border-amber-500 text-amber-500">
                          Archived
                        </Badge>
                      )}
                      <Badge
                        variant={
                          deal.status === "CLOSED"
                            ? "default"
                            : deal.status === "ACTIVE"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {deal.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-slate-400">
                    <span>{deal.type}</span>
                    {deal.propertyCity && deal.propertyState && (
                      <span>
                        {deal.propertyCity}, {deal.propertyState}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
