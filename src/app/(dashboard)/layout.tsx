import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar will go here */}
        <aside className="w-64 min-h-screen bg-white border-r border-gray-200 hidden md:block">
          <div className="p-4">
            <h1 className="text-xl font-bold text-gray-900">Deal Pilot 10.3</h1>
          </div>
          <nav className="mt-4 px-2">
            <a
              href="/dashboard"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Dashboard
            </a>
            <a
              href="/deals"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Deals
            </a>
            <a
              href="/clients"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Clients
            </a>
            <a
              href="/tasks"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Tasks
            </a>
            <a
              href="/reports"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Reports
            </a>
            <a
              href="/settings"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Settings
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
