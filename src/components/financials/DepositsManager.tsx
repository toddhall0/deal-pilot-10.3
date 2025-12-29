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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Banknote,
} from "lucide-react"

interface Deposit {
  id: string
  name: string
  amount: number
  dueDate: string
  paidDate: string | null
  paidAmount: number | null
  status: string
  condition: string | null
  notes: string | null
}

interface DepositsManagerProps {
  dealId: string
  deposits: Deposit[]
  onUpdate: () => void
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-gray-100 text-gray-800",
  DUE: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  APPLIED_TO_PURCHASE: "bg-blue-100 text-blue-800",
  REFUNDED: "bg-purple-100 text-purple-800",
  FORFEITED: "bg-red-100 text-red-800",
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  DUE: "Due",
  PAID: "Paid",
  APPLIED_TO_PURCHASE: "Applied",
  REFUNDED: "Refunded",
  FORFEITED: "Forfeited",
}

export function DepositsManager({ dealId, deposits, onUpdate }: DepositsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    dueDate: "",
    paidDate: "",
    paidAmount: "",
    status: "SCHEDULED",
    condition: "",
    notes: "",
  })

  const totalDeposits = deposits.reduce((sum, d) => sum + Number(d.amount), 0)
  const paidDeposits = deposits
    .filter((d) => d.status === "PAID" || d.status === "APPLIED_TO_PURCHASE")
    .reduce((sum, d) => sum + Number(d.paidAmount || d.amount), 0)

  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      dueDate: "",
      paidDate: "",
      paidAmount: "",
      status: "SCHEDULED",
      condition: "",
      notes: "",
    })
    setEditingDeposit(null)
  }

  const handleEdit = (deposit: Deposit) => {
    setEditingDeposit(deposit)
    setFormData({
      name: deposit.name,
      amount: deposit.amount.toString(),
      dueDate: deposit.dueDate?.split("T")[0] || "",
      paidDate: deposit.paidDate?.split("T")[0] || "",
      paidAmount: deposit.paidAmount?.toString() || "",
      status: deposit.status,
      condition: deposit.condition || "",
      notes: deposit.notes || "",
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    const url = editingDeposit
      ? `/api/deals/${dealId}/deposits/${editingDeposit.id}`
      : `/api/deals/${dealId}/deposits`

    const response = await fetch(url, {
      method: editingDeposit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate || null,
        paidDate: formData.paidDate || null,
        paidAmount: formData.paidAmount ? parseFloat(formData.paidAmount) : null,
        status: formData.status,
        condition: formData.condition || null,
        notes: formData.notes || null,
      }),
    })

    if (response.ok) {
      setIsDialogOpen(false)
      resetForm()
      onUpdate()
    }
  }

  const handleDelete = async (depositId: string) => {
    if (!confirm("Are you sure you want to delete this deposit?")) return

    await fetch(`/api/deals/${dealId}/deposits/${depositId}`, {
      method: "DELETE",
    })
    onUpdate()
  }

  const handleMarkPaid = async (depositId: string, amount: number) => {
    await fetch(`/api/deals/${dealId}/deposits/${depositId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "PAID",
        paidDate: new Date().toISOString(),
        paidAmount: amount,
      }),
    })
    onUpdate()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
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
            <Banknote className="h-4 w-4" />
            Earnest Money Deposits
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            {formatCurrency(paidDeposits)} of {formatCurrency(totalDeposits)} paid
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetForm()
            setIsDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Deposit
        </Button>
      </CardHeader>
      <CardContent>
        {deposits.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No deposits recorded</p>
        ) : (
          <div className="space-y-3">
            {deposits.map((deposit) => (
              <div
                key={deposit.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{deposit.name}</span>
                    <Badge className={STATUS_COLORS[deposit.status]}>
                      {STATUS_LABELS[deposit.status] || deposit.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Due: {formatDate(deposit.dueDate)}
                    {deposit.paidDate && ` • Paid: ${formatDate(deposit.paidDate)}`}
                    {deposit.condition && ` • ${deposit.condition}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold">
                    {formatCurrency(Number(deposit.amount))}
                  </span>
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
                      {(deposit.status === "SCHEDULED" || deposit.status === "DUE") && (
                        <DropdownMenuItem onClick={() => handleMarkPaid(deposit.id, Number(deposit.amount))}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Paid
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleEdit(deposit)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(deposit.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Deposit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDeposit ? "Edit Deposit" : "Add Deposit"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Initial Earnest Money"
                />
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="DUE">Due</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="APPLIED_TO_PURCHASE">Applied to Purchase</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                    <SelectItem value="FORFEITED">Forfeited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Paid Date</Label>
                <Input
                  type="date"
                  value={formData.paidDate}
                  onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Paid Amount</Label>
                <Input
                  type="number"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                  placeholder="Same as amount if blank"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Condition</Label>
              <Input
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                placeholder="e.g., Due within 3 days of execution"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingDeposit ? "Save Changes" : "Add Deposit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
