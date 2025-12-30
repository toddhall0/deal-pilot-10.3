import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TasksTab } from "@/components/deals/TasksTab"
import { DocumentsTab } from "@/components/deals/DocumentsTab"
import { NotesTab } from "@/components/deals/NotesTab"
import { TimelineTab } from "@/components/deals/TimelineTab"
import { OverviewTab } from "@/components/deals/OverviewTab"
import { FinancialsTab } from "@/components/deals/FinancialsTab"
import { QuickExport } from "@/components/reports/QuickExport"

async function getDeal(id: string) {
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      client: true,
      transactionSummary: true,
      timeline: {
        include: {
          milestones: {
            orderBy: { dueDate: "asc" },
          },
        },
      },
      tasks: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      documents: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      notes: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      financials: {
        include: {
          deposits: true,
        },
      },
    },
  })
  return deal
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deal = await getDeal(id)

  if (!deal) {
    notFound()
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">
              {deal.dealNumber} • {deal.client.name}
            </p>
            <h1 className="text-2xl font-bold">{deal.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <QuickExport dealId={deal.id} />
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab deal={deal} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <TimelineTab dealId={deal.id} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TasksTab dealId={deal.id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab dealId={deal.id} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <NotesTab dealId={deal.id} />
        </TabsContent>

        <TabsContent value="financials" className="mt-6">
          <FinancialsTab dealId={deal.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
