"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Plus, Edit, Trash2, Receipt } from "lucide-react"

interface LineItem {
  id: string
  name: string
  category: string
  description: string | null
  estimatedAmount: number | null
  actualAmount: number | null
  vendor: string | null
  invoiceNumber: string | null
  paidDate: string | null
}

interface LineItemsManagerProps {
  dealId: string
  lineItems: LineItem[]
  onUpdate: () => void
}

const CATEGORIES = [
  { value: "CLOSING_COST", label: "Closing Cost" },
  { value: "PRORATION", label: "Proration" },
  { value: "CREDIT", label: "Credit" },
  { value: "ADJUSTMENT", label: "Adjustment" },
  { value: "TAX", label: "Tax" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "HOA", label: "HOA" },
  { value: "UTILITY", label: "Utility" },
  { value: "COMMISSION", label: "Commission" },
  { value: "OTHER", label: "Other" },
]

const CATEGORY_COLORS: Record<string, string> = {
  CLOSING_COST: "bg-blue-100 text-blue-800",
  PRORATION: "bg-purple-100 text-purple-800",
  CREDIT: "bg-green-100 text-green-800",
  ADJUSTMENT: "bg-orange-100 text-orange-800",
  TAX: "bg-red-100 text-red-800",
  INSURANCE: "bg-cyan-100 text-cyan-800",
  HOA: "bg-yellow-100 text-yellow-800",
  UTILITY: "bg-indigo-100 text-indigo-800",
  COMMISSION: "bg-pink-100 text-pink-800",
  OTHER: "bg-gray-100 text-gray-800",
}

export function LineItemsManager({ dealId, lineItems, onUpdate }: LineItemsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LineItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "CLOSING_COST",
    description: "",
    estimatedAmount: "",
    actualAmount: "",
    vendor: "",
    invoiceNumber: "",
    paidDate: "",
  })

  // Calculate totals
  const estimatedTotal = lineItems.reduce(
    (sum, item) => sum + Number(item.estimatedAmount || 0),
    0
  )
  const actualTotal = lineItems.reduce(
    (sum, item) => sum + Number(item.actualAmount || 0),
    0
  )

  const resetForm = () => {
    setFormData({
      name: "",
      category: "CLOSING_COST",
      description: "",
      estimatedAmount: "",
      actualAmount: "",
      vendor: "",
      invoiceNumber: "",
      paidDate: "",
    })
    setEditingItem(null)
  }

  const handleEdit = (item: LineItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description || "",
      estimatedAmount: item.estimatedAmount?.toString() || "",
      actualAmount: item.actualAmount?.toString() || "",
      vendor: item.vendor || "",
      invoiceNumber: item.invoiceNumber || "",
      paidDate: item.paidDate?.split("T")[0] || "",
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    const url = editingItem
      ? `/api/deals/${dealId}/line-items/${editingItem.id}`
      : `/api/deals/${dealId}/line-items`

    const response = await fetch(url, {
      method: editingItem ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        category: formData.category,
        description: formData.description || null,
        estimatedAmount: formData.estimatedAmount ? parseFloat(formData.estimatedAmount) : null,
        actualAmount: formData.actualAmount ? parseFloat(formData.actualAmount) : null,
        vendor: formData.vendor || null,
        invoiceNumber: formData.invoiceNumber || null,
        paidDate: formData.paidDate || null,
      }),
    })

    if (response.ok) {
      setIsDialogOpen(false)
      resetForm()
      onUpdate()
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this line item?")) return

    await fetch(`/api/deals/${dealId}/line-items/${itemId}`, {
      method: "DELETE",
    })
    onUpdate()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Closing Costs & Prorations
          </CardTitle>
          <div className="flex gap-4 text-sm mt-1">
            <span className="text-gray-500">
              Estimated: <span className="font-medium text-gray-900">{formatCurrency(estimatedTotal)}</span>
            </span>
            <span className="text-gray-500">
              Actual: <span className="font-medium text-gray-900">{formatCurrency(actualTotal)}</span>
            </span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetForm()
            setIsDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </CardHeader>
      <CardContent>
        {lineItems.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No line items recorded</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Estimated</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item) => (
                <TableRow key={item.id} className="group">
                  <TableCell>
                    <span className="font-medium">{item.name}</span>
                    {item.description && (
                      <p className="text-xs text-gray-500">{item.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={CATEGORY_COLORS[item.category] || CATEGORY_COLORS.OTHER}>
                      {item.category.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.vendor || "—"}
                    {item.invoiceNumber && (
                      <p className="text-xs text-gray-500">#{item.invoiceNumber}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.estimatedAmount ? formatCurrency(Number(item.estimatedAmount)) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {item.actualAmount ? formatCurrency(Number(item.actualAmount)) : "—"}
                    {item.paidDate && (
                      <p className="text-xs text-gray-500">Paid {formatDate(item.paidDate)}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Line Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Line Item" : "Add Line Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Title Insurance Premium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="ABC Title Company"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estimated Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.estimatedAmount}
                  onChange={(e) => setFormData({ ...formData, estimatedAmount: e.target.value })}
                  placeholder="2500.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Actual Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.actualAmount}
                  onChange={(e) => setFormData({ ...formData, actualAmount: e.target.value })}
                  placeholder="2450.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="INV-12345"
                />
              </div>
              <div className="space-y-2">
                <Label>Paid Date</Label>
                <Input
                  type="date"
                  value={formData.paidDate}
                  onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingItem ? "Save Changes" : "Add Item"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
