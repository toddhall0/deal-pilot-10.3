import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

async function getDeals() {
  const deals = await prisma.deal.findMany({
    include: {
      client: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
  return deals
}

export default async function DealsPage() {
  const deals = await getDeals()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Deals</h1>
        <Link href="/deals/new">
          <Button>New Deal</Button>
        </Link>
      </div>

      {deals.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">No deals yet</p>
            <Link href="/deals/new">
              <Button>Create your first deal</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {deals.map((deal: typeof deals[number]) => (
            <Link key={deal.id} href={`/deals/${deal.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{deal.name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {deal.dealNumber} • {deal.client.name}
                      </p>
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
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-gray-600">
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
