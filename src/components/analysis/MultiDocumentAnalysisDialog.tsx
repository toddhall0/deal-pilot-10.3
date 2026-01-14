"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Files, Sparkles, FileText, ArrowRight, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AnalysisResults } from "./AnalysisResults"
import { ContractAnalysisResult, AmendmentSummary } from "@/types/analysis"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Document {
  id: string
  name: string
  category: string
  fileType: string
  isAnalyzed: boolean
}

interface MultiDocumentAnalysisDialogProps {
  dealId: string
  documents: Document[]
  isOpen: boolean
  onClose: () => void
  onAnalysisComplete: () => void
}

export function MultiDocumentAnalysisDialog({
  dealId,
  documents,
  isOpen,
  onClose,
  onAnalysisComplete,
}: MultiDocumentAnalysisDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ContractAnalysisResult | null>(null)
  const [existingAnalysisId, setExistingAnalysisId] = useState<string | null>(null)
  const { toast } = useToast()

  // Get documents that already have analysis (for "Update Analysis" feature)
  const analyzedDocs = documents.filter(d => d.isAnalyzed)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAnalysis(null)
      setExistingAnalysisId(null)
    }
  }, [isOpen])

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch(`/api/deals/${dealId}/analyze-multiple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds: documents.map(d => d.id),
          existingAnalysisId: existingAnalysisId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Analysis failed")
      }

      const result = await response.json()
      setAnalysis(result.analysis)

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${documents.length} documents with ${Math.round(result.analysis.confidence * 100)}% confidence`,
      })

      onAnalysisComplete()
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Could not analyze documents",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case "HIGH":
        return "bg-red-500/20 text-red-400"
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400"
      case "LOW":
        return "bg-blue-500/20 text-blue-400"
      default:
        return "bg-slate-500/20 text-slate-400"
    }
  }

  const renderAmendmentSummary = (summary: AmendmentSummary) => (
    <Card className="border-purple-500/30 bg-purple-950/30 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-purple-300">
          <Files className="h-4 w-4" />
          Amendment Summary
        </CardTitle>
        <CardDescription className="text-purple-400">
          Analysis of {summary.documentOrder.length} documents showing changes made by amendments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Order */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-purple-300">Document Order</h4>
          <div className="flex flex-wrap items-center gap-2">
            {summary.documentOrder.map((doc, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Badge
                  variant={doc.type === "PURCHASE_AGREEMENT" ? "default" : "secondary"}
                >
                  {doc.order}. {doc.name}
                </Badge>
                {idx < summary.documentOrder.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-purple-400" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Key Changes Summary */}
        {summary.keyChanges && summary.keyChanges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-purple-300">Key Changes</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-purple-400">
              {summary.keyChanges.map((change, idx) => (
                <li key={idx}>{change}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Changes by Document */}
        {summary.changesByDocument && summary.changesByDocument.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-purple-300">Detailed Changes by Amendment</h4>
            {summary.changesByDocument.map((docChanges, docIdx) => (
              <div key={docIdx} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-purple-400" />
                  <span className="font-medium text-sm">{docChanges.documentName}</span>
                  {docChanges.documentDate && (
                    <span className="text-xs text-purple-400">({docChanges.documentDate})</span>
                  )}
                </div>
                {docChanges.changes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">Field</TableHead>
                        <TableHead>Original</TableHead>
                        <TableHead>New Value</TableHead>
                        <TableHead className="w-24">Impact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docChanges.changes.map((change, changeIdx) => (
                        <TableRow key={changeIdx}>
                          <TableCell className="font-medium">{change.field}</TableCell>
                          <TableCell className="text-muted-foreground line-through">
                            {change.originalValue}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {change.newValue}
                          </TableCell>
                          <TableCell>
                            <Badge className={getSignificanceColor(change.significance)}>
                              {change.significance}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-purple-400 italic">No tracked changes</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Effective Terms */}
        {summary.effectiveTerms && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-purple-300">Current Effective Terms</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {summary.effectiveTerms.purchasePrice && (
                <div>
                  <span className="text-purple-400">Purchase Price:</span>{" "}
                  <span className="font-semibold">{summary.effectiveTerms.purchasePrice}</span>
                </div>
              )}
              {summary.effectiveTerms.closingDate && (
                <div>
                  <span className="text-purple-400">Closing Date:</span>{" "}
                  <span className="font-semibold">{summary.effectiveTerms.closingDate}</span>
                </div>
              )}
              {summary.effectiveTerms.feasibilityExpiration && (
                <div>
                  <span className="text-purple-400">Feasibility Expires:</span>{" "}
                  <span className="font-semibold">{summary.effectiveTerms.feasibilityExpiration}</span>
                </div>
              )}
              {summary.effectiveTerms.otherKeyTerms && (
                <div className="col-span-2">
                  <span className="text-purple-400">Other:</span>{" "}
                  <span className="font-semibold">{summary.effectiveTerms.otherKeyTerms}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Files className="h-5 w-5" />
            Multi-Document Analysis
          </DialogTitle>
          <DialogDescription>
            Analyze {documents.length} documents together to produce a unified contract summary with amendment tracking
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="pr-4">
            {analysis ? (
              <div className="space-y-4">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAnalysis(null)}
                  >
                    Back to Setup
                  </Button>
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
                        Re-analyze All
                      </>
                    )}
                  </Button>
                </div>

                {/* Amendment Summary Section */}
                {analysis.amendmentSummary && renderAmendmentSummary(analysis.amendmentSummary)}

                {/* Standard Analysis Results */}
                <AnalysisResults
                  analysis={analysis}
                  analyzedAt={new Date().toISOString()}
                  dealId={dealId}
                  documentId={documents[0]?.id || ""}
                />
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {/* Documents to Analyze */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Documents to Analyze</h3>
                  <div className="space-y-2">
                    {documents.map((doc, idx) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border border-slate-700 rounded-lg bg-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{idx + 1}</Badge>
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-slate-400">{doc.category}</p>
                          </div>
                        </div>
                        {doc.isAnalyzed && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Previously Analyzed
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Update Existing Analysis Option */}
                {analyzedDocs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      Update Existing Analysis (Optional)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      If you've already analyzed a contract and want to update it with new amendments,
                      select the previously analyzed document below. The new analysis will build upon it.
                    </p>
                    <Select
                      value={existingAnalysisId || "none"}
                      onValueChange={(v) => setExistingAnalysisId(v === "none" ? null : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select document with existing analysis..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Start fresh (no existing analysis)</SelectItem>
                        {analyzedDocs.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                {/* Explanation */}
                <div className="bg-blue-950/30 border border-blue-500/30 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-300 mb-2">What will be analyzed:</h4>
                  <ul className="text-sm text-blue-400 space-y-1 list-disc list-inside">
                    <li>All key terms from the original contract</li>
                    <li>Changes made by each amendment</li>
                    <li>Current effective terms after all amendments</li>
                    <li>Comprehensive pre-feasibility and pre-closing checklists</li>
                    <li>Timeline milestones with updated dates</li>
                  </ul>
                </div>

                {/* Action */}
                <div className="flex justify-center pt-4">
                  <Button
                    size="lg"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || documents.length < 2}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing Documents...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Analyze {documents.length} Documents Together
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Analysis typically takes 60-90 seconds for multiple documents
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
