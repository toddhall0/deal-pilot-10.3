"use client"

import { Component, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="max-w-md w-full bg-slate-900 border-slate-800">
            <CardContent className="pt-6 text-center">
              <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-white">Something went wrong</h2>
              <p className="text-slate-400 mb-6">
                We encountered an unexpected error. Please try again or return to the dashboard.
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <pre className="text-left text-xs bg-slate-800 text-slate-300 p-3 rounded mb-4 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              )}
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={this.handleRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
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

    return this.props.children
  }
}
