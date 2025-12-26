import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TasksTab } from "@/components/deals/TasksTab"
import { DocumentsTab } from "@/components/deals/DocumentsTab"
import { NotesTab } from "@/components/deals/NotesTab"

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deal Details */}
            <Card>
              <CardHeader>
                <CardTitle>Deal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span>{deal.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span>{deal.status.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Client</span>
                  <span>{deal.client.name}</span>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {deal.propertyName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span>{deal.propertyName}</span>
                  </div>
                )}
                {deal.propertyType && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span>{deal.propertyType}</span>
                  </div>
                )}
                {deal.propertyAddress && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Address</span>
                    <span>
                      {deal.propertyAddress}
                      {deal.propertyCity && `, ${deal.propertyCity}`}
                      {deal.propertyState && `, ${deal.propertyState}`}
                      {deal.propertyZip && ` ${deal.propertyZip}`}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {deal.tasks.length === 0 ? (
                  <p className="text-gray-500 text-sm">No tasks yet</p>
                ) : (
                  <ul className="space-y-2">
                    {deal.tasks.map((task) => (
                      <li key={task.id} className="text-sm">
                        {task.title}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Recent Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {deal.documents.length === 0 ? (
                  <p className="text-gray-500 text-sm">No documents yet</p>
                ) : (
                  <ul className="space-y-2">
                    {deal.documents.map((doc) => (
                      <li key={doc.id} className="text-sm">
                        {doc.name}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Timeline content coming soon...</p>
            </CardContent>
          </Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Financials</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Financials content coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
