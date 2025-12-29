"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Loader2, Sparkles, AlertCircle, CheckCircle } from "lucide-react"

interface AnalyzeButtonProps {
  dealId: string
  documentId: string
  documentName: string
  onAnalysisComplete: (result: unknown) => void
}

export function AnalyzeButton({
  dealId,
  documentId,
  documentName,
  onAnalysisComplete,
}: AnalyzeButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [status, setStatus] = useState<"idle" | "analyzing" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setShowDialog(true)
    setStatus("analyzing")
    setError(null)

    try {
      // Step 1: Analyze the contract
      const analyzeResponse = await fetch(`/api/deals/${dealId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      })

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json()
        throw new Error(errorData.error || "Analysis failed")
      }

      const { result } = await analyzeResponse.json()

      // Step 2: Save the transaction summary
      const saveResponse = await fetch(`/api/deals/${dealId}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      })

      if (!saveResponse.ok) {
        throw new Error("Failed to save analysis results")
      }

      setStatus("success")
      onAnalysisComplete(result)
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        variant="outline"
        size="sm"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze with AI
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contract Analysis</DialogTitle>
            <DialogDescription>
              Analyzing: {documentName}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {status === "analyzing" && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <div className="text-center">
                  <p className="font-medium">Analyzing contract...</p>
                  <p className="text-sm text-gray-500 mt-1">
                    This may take a minute. We&apos;re extracting key terms, dates, and obligations.
                  </p>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center gap-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
                <div className="text-center">
                  <p className="font-medium">Analysis Complete!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Contract data has been extracted and saved.
                  </p>
                </div>
                <Button onClick={() => setShowDialog(false)}>
                  View Results
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="h-12 w-12 text-red-600" />
                <div className="text-center">
                  <p className="font-medium">Analysis Failed</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    Close
                  </Button>
                  <Button onClick={handleAnalyze}>Try Again</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
