"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, FileSearch } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AnalysisResults } from "./AnalysisResults"
import { ContractAnalysisResult } from "@/types/analysis"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AnalysisDialogProps {
  dealId: string
  documentId: string
  documentName: string
  isAnalyzed?: boolean
  trigger?: React.ReactNode
}

export function AnalysisDialog({
  dealId,
  documentId,
  documentName,
  isAnalyzed = false,
  trigger,
}: AnalysisDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ContractAnalysisResult | null>(null)
  const [analyzedAt, setAnalyzedAt] = useState<string | undefined>()
  const { toast } = useToast()

  // Fetch existing analysis when dialog opens
  useEffect(() => {
    if (open && isAnalyzed && !analysis) {
      fetchAnalysis()
    }
  }, [open, isAnalyzed])

  const fetchAnalysis = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/deals/${dealId}/documents/${documentId}/analyze`
      )

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
        setAnalyzedAt(data.analyzedAt)
      }
    } catch (error) {
      console.error("Failed to fetch analysis:", error)
    } finally {
      setIsLoading(false)
    }
  }

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
      setAnalysis(result.analysis)
      setAnalyzedAt(new Date().toISOString())

      toast({
        title: "Analysis Complete",
        description: `Contract analyzed with ${result.analysis.confidence}% confidence`,
      })
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

  const defaultTrigger = (
    <Button variant={isAnalyzed ? "outline" : "default"} size="sm">
      {isAnalyzed ? (
        <>
          <FileSearch className="mr-2 h-4 w-4" />
          View Analysis
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Analyze
        </>
      )}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Contract Analysis</DialogTitle>
          <DialogDescription>{documentName}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Re-analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Re-analyze
                      </>
                    )}
                  </Button>
                </div>
                <AnalysisResults analysis={analysis} analyzedAt={analyzedAt} />
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analyze This Contract</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Use AI to extract key terms, dates, and obligations from this contract.
                  Analysis typically takes 30-60 seconds.
                </p>
                <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Contract...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Start Analysis
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
