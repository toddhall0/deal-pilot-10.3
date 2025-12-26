"use client"

import { ContractAnalysisResult } from "@/types/analysis"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  DollarSign,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Users,
  MapPin,
} from "lucide-react"

interface AnalysisResultsProps {
  analysis: ContractAnalysisResult
  analyzedAt?: string
}

export function AnalysisResults({ analysis, analyzedAt }: AnalysisResultsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return "Not specified"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-100 text-green-800"
    if (confidence >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="space-y-6">
      {/* Header with confidence */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Contract Analysis</h3>
          {analyzedAt && (
            <p className="text-sm text-muted-foreground">
              Analyzed on {formatDate(analyzedAt)}
            </p>
          )}
        </div>
        <Badge className={getConfidenceColor(analysis.confidence)}>
          {analysis.confidence}% Confidence
        </Badge>
      </div>

      {/* Warnings */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
              {analysis.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Parties */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Parties
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Buyer</p>
            <p className="font-medium">{analysis.buyer.name}</p>
            {analysis.buyer.entityType && (
              <p className="text-sm text-muted-foreground">{analysis.buyer.entityType}</p>
            )}
            {analysis.buyer.state && (
              <p className="text-sm text-muted-foreground">{analysis.buyer.state}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Seller</p>
            <p className="font-medium">{analysis.seller.name}</p>
            {analysis.seller.entityType && (
              <p className="text-sm text-muted-foreground">{analysis.seller.entityType}</p>
            )}
            {analysis.seller.state && (
              <p className="text-sm text-muted-foreground">{analysis.seller.state}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Property */}
      {analysis.propertyAddress && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{analysis.propertyAddress}</p>
            <p className="text-sm text-muted-foreground">
              {[analysis.propertyCity, analysis.propertyState, analysis.propertyCounty]
                .filter(Boolean)
                .join(", ")}
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              {analysis.acreage && (
                <span className="text-muted-foreground">{analysis.acreage} acres</span>
              )}
              {analysis.squareFootage && (
                <span className="text-muted-foreground">
                  {analysis.squareFootage.toLocaleString()} SF
                </span>
              )}
              {analysis.lotCount && (
                <span className="text-muted-foreground">{analysis.lotCount} lots</span>
              )}
              {analysis.unitCount && (
                <span className="text-muted-foreground">{analysis.unitCount} units</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="h-4 w-4" />
            Financial Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Purchase Price</p>
            <p className="text-2xl font-bold">{formatCurrency(analysis.purchasePrice)}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
              {analysis.pricePerAcre && (
                <span>{formatCurrency(analysis.pricePerAcre)}/acre</span>
              )}
              {analysis.pricePerSquareFoot && (
                <span>{formatCurrency(analysis.pricePerSquareFoot)}/SF</span>
              )}
              {analysis.pricePerUnit && (
                <span>{formatCurrency(analysis.pricePerUnit)}/unit</span>
              )}
            </div>
            {analysis.priceAdjustable && (
              <Badge variant="outline" className="mt-2">
                Price Adjustable: {analysis.priceAdjustmentBasis || "Yes"}
              </Badge>
            )}
          </div>

          {analysis.deposits.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-2">Deposits</p>
                <div className="space-y-2">
                  {analysis.deposits.map((deposit, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{deposit.name}</p>
                        {deposit.dueDate && (
                          <p className="text-sm text-muted-foreground">
                            Due: {formatDate(deposit.dueDate)}
                          </p>
                        )}
                        {deposit.dueDays && (
                          <p className="text-sm text-muted-foreground">
                            Due: {deposit.dueDays} days from effective date
                          </p>
                        )}
                      </div>
                      <p className="font-semibold">{formatCurrency(deposit.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Key Dates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Key Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {analysis.effectiveDate && (
              <div>
                <p className="text-xs text-muted-foreground uppercase">Effective Date</p>
                <p className="font-medium">{formatDate(analysis.effectiveDate)}</p>
              </div>
            )}
            {analysis.feasibilityPeriodDays && (
              <div>
                <p className="text-xs text-muted-foreground uppercase">Feasibility Period</p>
                <p className="font-medium">{analysis.feasibilityPeriodDays} days</p>
                {analysis.feasibilityExpiration && (
                  <p className="text-sm text-muted-foreground">
                    Expires: {formatDate(analysis.feasibilityExpiration)}
                  </p>
                )}
              </div>
            )}
            {analysis.closingDate && (
              <div>
                <p className="text-xs text-muted-foreground uppercase">Closing Date</p>
                <p className="font-medium">{formatDate(analysis.closingDate)}</p>
              </div>
            )}
            {analysis.outsideClosingDate && (
              <div>
                <p className="text-xs text-muted-foreground uppercase">Outside Closing Date</p>
                <p className="font-medium">{formatDate(analysis.outsideClosingDate)}</p>
              </div>
            )}
          </div>

          {/* Title & Survey Timeline */}
          {(analysis.titleCommitmentDays || analysis.surveyDays) && (
            <>
              <Separator className="my-4" />
              <div className="grid gap-4 md:grid-cols-2">
                {analysis.titleCommitmentDays && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Title Commitment</p>
                    <p className="font-medium">{analysis.titleCommitmentDays} days</p>
                  </div>
                )}
                {analysis.surveyDays && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Survey</p>
                    <p className="font-medium">{analysis.surveyDays} days</p>
                  </div>
                )}
                {analysis.titleObjectionDays && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Title Objection Period</p>
                    <p className="font-medium">{analysis.titleObjectionDays} days</p>
                  </div>
                )}
                {analysis.titleCureDays && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Title Cure Period</p>
                    <p className="font-medium">{analysis.titleCureDays} days</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contingencies */}
      {analysis.contingencies.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Contingencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.contingencies.map((contingency, idx) => (
                <div key={idx} className="border-l-2 border-primary pl-3">
                  <p className="font-medium">{contingency.name}</p>
                  <p className="text-sm text-muted-foreground">{contingency.description}</p>
                  {contingency.deadlineDays && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Deadline: {contingency.deadlineDays} days
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due Diligence Items */}
      {analysis.dueDiligenceItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Due Diligence Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.dueDiligenceItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Badge variant={item.responsible === "BUYER" ? "default" : "secondary"}>
                    {item.responsible}
                  </Badge>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Special Provisions */}
      {analysis.specialProvisions && analysis.specialProvisions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Special Provisions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {analysis.specialProvisions.map((provision, idx) => (
                <li key={idx}>{provision}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Title Company & Escrow */}
      {(analysis.titleCompany || analysis.escrowAgent) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4" />
              Title & Escrow
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {analysis.titleCompany && (
              <div>
                <p className="text-xs text-muted-foreground uppercase">Title Company</p>
                <p className="font-medium">{analysis.titleCompany}</p>
              </div>
            )}
            {analysis.escrowAgent && (
              <div>
                <p className="text-xs text-muted-foreground uppercase">Escrow Agent</p>
                <p className="font-medium">{analysis.escrowAgent}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
