"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AnalysisButtonProps {
  dealId: string
  documentId: string
  isAnalyzed?: boolean
  onAnalysisComplete?: (result: unknown) => void
}

export function AnalysisButton({
  dealId,
  documentId,
  isAnalyzed = false,
  onAnalysisComplete,
}: AnalysisButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch(
        `/api/deals/${dealId}/documents/${documentId}/analyze`,
        {
          method: "POST",
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Analysis failed")
      }

      const result = await response.json()

      toast({
        title: "Analysis Complete",
        description: `Contract analyzed with ${result.analysis.confidence}% confidence`,
      })

      if (onAnalysisComplete) {
        onAnalysisComplete(result)
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Could not analyze document",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Button
      variant={isAnalyzed ? "outline" : "default"}
      size="sm"
      onClick={handleAnalyze}
      disabled={isAnalyzing}
    >
      {isAnalyzing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          {isAnalyzed ? "Re-analyze" : "Analyze Contract"}
        </>
      )}
    </Button>
  )
}
