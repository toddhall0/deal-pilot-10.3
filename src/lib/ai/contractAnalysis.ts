import { analyzeWithRetry, ClaudeMessage } from "./claude"
import { ContractAnalysisResult } from "@/types/analysis"

const SYSTEM_PROMPT = `You are a commercial real estate contract analyst expert. Your job is to extract key information from purchase and sale agreements (PSAs), letters of intent (LOIs), and other real estate contracts.

You must respond with ONLY valid JSON that matches the specified schema. Do not include any markdown, explanations, or other text outside the JSON.

Extract all available information from the contract. If information is not present, omit the field or use null. For arrays, use empty arrays if no items are found.

Pay special attention to:
- Party names and entity types (LLC, LP, Inc, etc.)
- Purchase price and any price adjustment mechanisms
- All deposit requirements (earnest money, additional deposits)
- Key dates and deadlines (effective date, feasibility period, closing date)
- Contingencies and their expiration conditions
- Due diligence requirements and responsibilities
- Title and survey requirements
- Special provisions and unique terms

For dates, use ISO 8601 format (YYYY-MM-DD). For monetary amounts, use numbers without currency symbols or commas.`

const EXTRACTION_PROMPT = `Analyze the following real estate contract and extract all relevant information. Return a JSON object with this structure:

{
  "buyer": { "name": "string", "entityType": "string?", "address": "string?", "state": "string?" },
  "seller": { "name": "string", "entityType": "string?", "address": "string?", "state": "string?" },
  "propertyAddress": "string?",
  "propertyCity": "string?",
  "propertyState": "string?",
  "propertyCounty": "string?",
  "legalDescription": "string?",
  "acreage": "number?",
  "squareFootage": "number?",
  "lotCount": "number?",
  "unitCount": "number?",
  "purchasePrice": "number (required)",
  "pricePerAcre": "number?",
  "pricePerSquareFoot": "number?",
  "pricePerUnit": "number?",
  "priceAdjustable": "boolean",
  "priceAdjustmentBasis": "string? (if price is adjustable)",
  "deposits": [
    {
      "name": "string (e.g., 'Initial Earnest Money', 'Additional Deposit')",
      "amount": "number",
      "dueDate": "string? (ISO date)",
      "dueDays": "number? (days from effective date)",
      "condition": "string? (triggering condition)",
      "refundable": "boolean?"
    }
  ],
  "contractDate": "string? (ISO date)",
  "effectiveDate": "string? (ISO date)",
  "feasibilityPeriodDays": "number?",
  "feasibilityExpiration": "string? (ISO date)",
  "closingDate": "string? (ISO date)",
  "outsideClosingDate": "string? (ISO date)",
  "titleCompany": "string?",
  "escrowAgent": "string?",
  "titleCommitmentDays": "number?",
  "surveyDays": "number?",
  "titleObjectionDays": "number?",
  "titleCureDays": "number?",
  "contingencies": [
    {
      "name": "string",
      "description": "string",
      "deadline": "string? (ISO date)",
      "deadlineDays": "number?",
      "conditions": "string?"
    }
  ],
  "dueDiligenceItems": [
    {
      "name": "string",
      "description": "string?",
      "deadline": "string? (ISO date)",
      "deadlineDays": "number?",
      "responsible": "BUYER | SELLER"
    }
  ],
  "closingDocuments": [
    {
      "name": "string",
      "responsible": "BUYER | SELLER | BOTH",
      "description": "string?"
    }
  ],
  "closingLocation": "string?",
  "prorationDate": "string? (ISO date)",
  "prorationItems": ["string"],
  "specialProvisions": ["string"],
  "postClosingObligations": ["string"],
  "confidence": "number (0-100, your confidence in the extraction accuracy)",
  "warnings": ["string (any issues, ambiguities, or missing critical information)"]
}

CONTRACT TEXT:
`

export async function analyzeContract(
  contractText: string
): Promise<ContractAnalysisResult> {
  const messages: ClaudeMessage[] = [
    {
      role: "user",
      content: EXTRACTION_PROMPT + contractText,
    },
  ]

  const response = await analyzeWithRetry(
    messages,
    {
      system: SYSTEM_PROMPT,
      maxTokens: 8192,
      temperature: 0,
    },
    3
  )

  // Parse the JSON response
  try {
    // Remove any potential markdown code blocks
    let jsonStr = response.trim()
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7)
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3)
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3)
    }
    jsonStr = jsonStr.trim()

    const result = JSON.parse(jsonStr) as ContractAnalysisResult

    // Store the raw text for reference
    result.rawText = contractText

    // Validate required fields
    if (!result.buyer || !result.buyer.name) {
      result.buyer = { name: "Unknown Buyer" }
      result.warnings = result.warnings || []
      result.warnings.push("Could not identify buyer from contract")
    }

    if (!result.seller || !result.seller.name) {
      result.seller = { name: "Unknown Seller" }
      result.warnings = result.warnings || []
      result.warnings.push("Could not identify seller from contract")
    }

    if (!result.purchasePrice || result.purchasePrice === 0) {
      result.purchasePrice = 0
      result.warnings = result.warnings || []
      result.warnings.push("Could not identify purchase price from contract")
    }

    // Ensure arrays exist
    result.deposits = result.deposits || []
    result.contingencies = result.contingencies || []
    result.dueDiligenceItems = result.dueDiligenceItems || []
    result.closingDocuments = result.closingDocuments || []
    result.prorationItems = result.prorationItems || []
    result.specialProvisions = result.specialProvisions || []
    result.postClosingObligations = result.postClosingObligations || []
    result.warnings = result.warnings || []

    // Set default confidence if not provided
    if (typeof result.confidence !== "number") {
      result.confidence = 50
    }

    // Ensure priceAdjustable is boolean
    result.priceAdjustable = Boolean(result.priceAdjustable)

    return result
  } catch (parseError) {
    console.error("Failed to parse Claude response:", parseError)
    console.error("Raw response:", response)

    // Return a minimal result with error
    return {
      buyer: { name: "Parse Error" },
      seller: { name: "Parse Error" },
      purchasePrice: 0,
      priceAdjustable: false,
      deposits: [],
      contingencies: [],
      dueDiligenceItems: [],
      closingDocuments: [],
      confidence: 0,
      warnings: [
        "Failed to parse contract analysis results",
        "Please try uploading the document again",
      ],
      rawText: contractText,
    }
  }
}

export function summarizeAnalysis(result: ContractAnalysisResult): string {
  const lines: string[] = []

  lines.push(`## Contract Summary\n`)

  // Parties
  lines.push(`**Buyer:** ${result.buyer.name}${result.buyer.entityType ? ` (${result.buyer.entityType})` : ""}`)
  lines.push(`**Seller:** ${result.seller.name}${result.seller.entityType ? ` (${result.seller.entityType})` : ""}`)
  lines.push("")

  // Property
  if (result.propertyAddress) {
    const location = [result.propertyAddress, result.propertyCity, result.propertyState]
      .filter(Boolean)
      .join(", ")
    lines.push(`**Property:** ${location}`)
  }

  if (result.acreage) {
    lines.push(`**Size:** ${result.acreage} acres`)
  } else if (result.squareFootage) {
    lines.push(`**Size:** ${result.squareFootage.toLocaleString()} SF`)
  }
  lines.push("")

  // Financial
  lines.push(`**Purchase Price:** $${result.purchasePrice.toLocaleString()}`)

  if (result.pricePerAcre) {
    lines.push(`**Price/Acre:** $${result.pricePerAcre.toLocaleString()}`)
  } else if (result.pricePerSquareFoot) {
    lines.push(`**Price/SF:** $${result.pricePerSquareFoot.toLocaleString()}`)
  }

  if (result.priceAdjustable) {
    lines.push(`**Price Adjustable:** Yes${result.priceAdjustmentBasis ? ` - ${result.priceAdjustmentBasis}` : ""}`)
  }
  lines.push("")

  // Deposits
  if (result.deposits.length > 0) {
    lines.push(`### Deposits`)
    const totalDeposits = result.deposits.reduce((sum, d) => sum + d.amount, 0)
    lines.push(`**Total Deposits:** $${totalDeposits.toLocaleString()}`)
    for (const deposit of result.deposits) {
      lines.push(`- ${deposit.name}: $${deposit.amount.toLocaleString()}${deposit.dueDate ? ` (due ${deposit.dueDate})` : deposit.dueDays ? ` (${deposit.dueDays} days from effective)` : ""}`)
    }
    lines.push("")
  }

  // Key Dates
  lines.push(`### Key Dates`)
  if (result.effectiveDate) lines.push(`- **Effective Date:** ${result.effectiveDate}`)
  if (result.feasibilityPeriodDays) lines.push(`- **Feasibility Period:** ${result.feasibilityPeriodDays} days`)
  if (result.feasibilityExpiration) lines.push(`- **Feasibility Expires:** ${result.feasibilityExpiration}`)
  if (result.closingDate) lines.push(`- **Closing Date:** ${result.closingDate}`)
  if (result.outsideClosingDate) lines.push(`- **Outside Closing Date:** ${result.outsideClosingDate}`)
  lines.push("")

  // Contingencies
  if (result.contingencies.length > 0) {
    lines.push(`### Contingencies`)
    for (const c of result.contingencies) {
      lines.push(`- **${c.name}:** ${c.description}${c.deadlineDays ? ` (${c.deadlineDays} days)` : ""}`)
    }
    lines.push("")
  }

  // Confidence
  lines.push(`---`)
  lines.push(`*Analysis Confidence: ${result.confidence}%*`)

  // Warnings
  if (result.warnings && result.warnings.length > 0) {
    lines.push("")
    lines.push(`### ⚠️ Warnings`)
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`)
    }
  }

  return lines.join("\n")
}
