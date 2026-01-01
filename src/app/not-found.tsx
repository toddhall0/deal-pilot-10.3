import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <Card className="max-w-md w-full bg-slate-900 border-slate-800">
        <CardContent className="pt-6 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <FileQuestion className="h-8 w-8 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">Page Not Found</h1>
          <p className="text-slate-400 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="javascript:history.back()">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
