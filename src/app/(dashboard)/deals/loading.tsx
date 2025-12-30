import { Card } from "@/components/ui/card"
import { TableSkeleton } from "@/components/ui/skeleton-loaders"
import { Skeleton } from "@/components/ui/skeleton"

export default function DealsLoading() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>

      <Card>
        <TableSkeleton rows={8} columns={5} />
      </Card>
    </div>
  )
}
