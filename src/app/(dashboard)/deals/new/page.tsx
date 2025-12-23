"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function NewDealPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    type: "ACQUISITION",
    clientId: "",
    propertyName: "",
    propertyType: "",
    propertyAddress: "",
    propertyCity: "",
    propertyState: "",
    propertyZip: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create deal")
      }

      const deal = await response.json()
      router.push(`/deals/${deal.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Deal</h1>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Deal Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Acme Office Building Acquisition"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Deal Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACQUISITION">Acquisition</SelectItem>
                  <SelectItem value="DISPOSITION">Disposition</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="propertyName">Property Name</Label>
              <Input
                id="propertyName"
                value={formData.propertyName}
                onChange={(e) =>
                  setFormData({ ...formData, propertyName: e.target.value })
                }
                placeholder="e.g., Riverside Office Complex"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type</Label>
              <Select
                value={formData.propertyType}
                onValueChange={(value) =>
                  setFormData({ ...formData, propertyType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFFICE">Office</SelectItem>
                  <SelectItem value="RETAIL">Retail</SelectItem>
                  <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
                  <SelectItem value="MULTIFAMILY">Multifamily</SelectItem>
                  <SelectItem value="MIXED_USE">Mixed Use</SelectItem>
                  <SelectItem value="LAND">Land</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyAddress">Property Address</Label>
              <Input
                id="propertyAddress"
                value={formData.propertyAddress}
                onChange={(e) =>
                  setFormData({ ...formData, propertyAddress: e.target.value })
                }
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyCity">City</Label>
                <Input
                  id="propertyCity"
                  value={formData.propertyCity}
                  onChange={(e) =>
                    setFormData({ ...formData, propertyCity: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyState">State</Label>
                <Input
                  id="propertyState"
                  value={formData.propertyState}
                  onChange={(e) =>
                    setFormData({ ...formData, propertyState: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyZip">ZIP</Label>
                <Input
                  id="propertyZip"
                  value={formData.propertyZip}
                  onChange={(e) =>
                    setFormData({ ...formData, propertyZip: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Deal"}
          </Button>
        </div>
      </form>
    </div>
  )
}
