"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserCog,
  CheckSquare,
  FileBarChart,
  Settings,
  LogOut,
} from "lucide-react"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { MobileNav } from "@/components/layout/MobileNav"
// TEMPORARILY DISABLED FOR DEBUGGING - cmdk may cause .length error
// import { GlobalSearch } from "@/components/search/GlobalSearch"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/deals", label: "Deals", icon: Briefcase },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/reports", label: "Reports", icon: FileBarChart },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col bg-slate-900 border-r border-slate-800">
        <div className="p-4">
          <h1 className="text-xl font-bold text-blue-400">Deal Pilot</h1>
        </div>
        <nav className="flex-1 mt-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}

          {/* Admin-only Users link */}
          {session?.user?.role === "ADMIN" && (
            <Link
              href="/users"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/users"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <UserCog className="h-5 w-5" />
              Users
            </Link>
          )}
        </nav>

        {/* Logout button at bottom */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2 w-full text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            {/* Mobile menu button */}
            <div className="flex items-center gap-4">
              <MobileNav />
              <span className="text-xl font-bold text-blue-400 md:hidden">Deal Pilot</span>
              {/* Global Search - TEMPORARILY DISABLED */}
              {/* <div className="hidden md:block">
                <GlobalSearch />
              </div> */}
            </div>

            {/* Right side - notifications and user menu */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile search button - TEMPORARILY DISABLED */}
              {/* <div className="md:hidden">
                <GlobalSearch />
              </div> */}
              <NotificationBell />
              {session?.user?.name && (
                <span className="text-sm text-slate-400 hidden sm:block">{session.user.name}</span>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
