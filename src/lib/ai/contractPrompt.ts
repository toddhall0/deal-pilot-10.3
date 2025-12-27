export const CONTRACT_ANALYSIS_SYSTEM_PROMPT = `You are an expert commercial real estate attorney and contract analyst. Your task is to carefully analyze purchase agreements and extract key information in a structured format.

You must be thorough and accurate. If information is not present in the contract, use null for that field. If you are uncertain about a value, include it in the warnings array.

Always extract monetary values as numbers without currency symbols or commas.
Always extract dates in ISO format (YYYY-MM-DD) when possible.
When a deadline is expressed as "X days from effective date", calculate the actual date if the effective date is known, otherwise provide the number of days.`

export function buildAnalysisPrompt(contractText: string): string {
  return `Please analyze the following commercial real estate purchase agreement and extract all key information.

<contract>
${contractText}
</contract>

Provide your analysis as a JSON object with the following structure. Include all fields, using null for missing information:

{
  "buyer": {
    "name": "Full legal name of buyer",
    "entityType": "LLC, Corporation, LP, Individual, etc.",
    "address": "Full address if provided",
    "state": "State of organization"
  },
  "seller": {
    "name": "Full legal name of seller",
    "entityType": "LLC, Corporation, LP, Individual, etc.",
    "address": "Full address if provided",
    "state": "State of organization"
  },
  "propertyAddress": "Street address of property",
  "propertyCity": "City",
  "propertyState": "State",
  "propertyCounty": "County",
  "legalDescription": "Legal description or reference to exhibit",
  "acreage": 0.00,
  "squareFootage": 0,
  "lotCount": 0,
  "unitCount": 0,
  "purchasePrice": 0,
  "pricePerAcre": 0,
  "pricePerSquareFoot": 0,
  "pricePerUnit": 0,
  "priceAdjustable": false,
  "priceAdjustmentBasis": "Description of how price adjusts (e.g., based on final survey)",
  "deposits": [
    {
      "name": "Initial Earnest Money",
      "amount": 0,
      "dueDate": "YYYY-MM-DD or null",
      "dueDays": 0,
      "condition": "Condition triggering deposit",
      "refundable": true
    }
  ],
  "contractDate": "YYYY-MM-DD",
  "effectiveDate": "YYYY-MM-DD",
  "feasibilityPeriodDays": 0,
  "feasibilityExpiration": "YYYY-MM-DD",
  "closingDate": "YYYY-MM-DD",
  "outsideClosingDate": "YYYY-MM-DD",
  "titleCompany": "Name of title company",
  "escrowAgent": "Name of escrow agent",
  "titleCommitmentDays": 0,
  "surveyDays": 0,
  "titleObjectionDays": 0,
  "titleCureDays": 0,
  "contingencies": [
    {
      "name": "Name of contingency",
      "description": "What must occur",
      "deadline": "YYYY-MM-DD or null",
      "deadlineDays": 0,
      "conditions": "Conditions for satisfaction or waiver"
    }
  ],
  "dueDiligenceItems": [
    {
      "name": "Item name",
      "description": "What is required",
      "deadline": "YYYY-MM-DD or null",
      "deadlineDays": 0,
      "responsible": "BUYER or SELLER"
    }
  ],
  "closingDocuments": [
    {
      "name": "Document name",
      "responsible": "BUYER, SELLER, or BOTH",
      "description": "Brief description"
    }
  ],
  "closingLocation": "Where closing will occur",
  "prorationDate": "YYYY-MM-DD",
  "prorationItems": ["Property taxes", "Rents", "HOA dues", "etc."],
  "specialProvisions": [
    "Any unique or non-standard provisions"
  ],
  "postClosingObligations": [
    "Any obligations that survive closing"
  ],
  "confidence": 0.95,
  "warnings": [
    "Any ambiguities or concerns about the analysis"
  ]
}

IMPORTANT:
1. Return ONLY the JSON object, no additional text or markdown formatting.
2. Ensure all monetary values are numbers, not strings.
3. Ensure all dates are in YYYY-MM-DD format.
4. Include a confidence score between 0 and 1.
5. Add warnings for any ambiguous or uncertain extractions.`
}
