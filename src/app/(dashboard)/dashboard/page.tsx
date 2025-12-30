import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardContent } from "@/components/dashboard/DashboardContent"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">
          Welcome back, {session.user.name || "User"}
        </p>
      </div>

      <Suspense fallback={<div>Loading dashboard...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
