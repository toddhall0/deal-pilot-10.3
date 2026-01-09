export const CONTRACT_ANALYSIS_SYSTEM_PROMPT = `You are an expert commercial real estate attorney and contract analyst. Your task is to carefully analyze purchase agreements and extract key information in a structured format.

You must be thorough and accurate. If information is not present in the contract, use null for that field. If you are uncertain about a value, include it in the warnings array.

Always extract monetary values as numbers without currency symbols or commas.
Always extract dates in ISO format (YYYY-MM-DD) when possible.

CRITICAL DATE HANDLING RULES:
1. When a deadline is expressed as "X days from effective date" or "X days from [trigger event]", you MUST:
   - Record the number of days in the appropriate "Days" field
   - If the trigger date (e.g., effective date) IS known, calculate and provide the actual date
   - If the trigger date is NOT known, set the date field to null and add an entry to "missingDateDependencies"

2. For each date that cannot be calculated due to a missing trigger date, add an entry to missingDateDependencies explaining:
   - Which field needs the date
   - What trigger date is missing
   - How to calculate once the trigger is provided

3. Create comprehensive checklists for:
   - preFeasibilityChecklist: Everything that must be done BEFORE the feasibility/inspection period expires
   - preClosingChecklist: Everything that must be done BEFORE closing

These checklists should include ALL obligations, deliverables, and deadlines for both buyer and seller.`

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
      "dueDate": "YYYY-MM-DD or null if depends on unknown date",
      "dueDays": 0,
      "dueFromEvent": "Event that triggers the deadline (e.g., 'effective date', 'feasibility expiration')",
      "condition": "Condition triggering deposit",
      "refundable": true,
      "refundableUntil": "Event or date until which deposit is refundable"
    }
  ],
  "contractDate": "YYYY-MM-DD",
  "effectiveDate": "YYYY-MM-DD or null if not yet determined",
  "effectiveDateTrigger": "What makes the contract effective (e.g., 'last signature', 'delivery of earnest money')",
  "feasibilityPeriodDays": 0,
  "feasibilityExpiration": "YYYY-MM-DD or null",
  "closingDate": "YYYY-MM-DD or null",
  "closingDateDays": 0,
  "closingDateFromEvent": "Event from which closing is calculated",
  "outsideClosingDate": "YYYY-MM-DD",
  "titleCompany": "Name of title company",
  "escrowAgent": "Name of escrow agent",
  "titleCommitmentDays": 0,
  "titleCommitmentDate": "YYYY-MM-DD or null",
  "surveyDays": 0,
  "surveyDate": "YYYY-MM-DD or null",
  "titleObjectionDays": 0,
  "titleObjectionDate": "YYYY-MM-DD or null",
  "titleCureDays": 0,
  "titleCureDate": "YYYY-MM-DD or null",

  "missingDateDependencies": [
    {
      "field": "Name of the field that needs a calculated date",
      "dependsOn": "Name of the missing trigger date field",
      "daysFromTrigger": 0,
      "description": "Human-readable explanation of how to calculate once trigger is known",
      "priority": "HIGH, MEDIUM, or LOW based on how critical this date is"
    }
  ],

  "preFeasibilityChecklist": [
    {
      "item": "Description of what must be done",
      "responsible": "BUYER or SELLER",
      "deadline": "YYYY-MM-DD or null",
      "deadlineDays": 0,
      "deadlineFromEvent": "What event the deadline is measured from",
      "contractReference": "Section or paragraph reference in contract",
      "category": "INSPECTION, TITLE, SURVEY, ENVIRONMENTAL, FINANCIAL, LEGAL, OTHER",
      "isCritical": true
    }
  ],

  "preClosingChecklist": [
    {
      "item": "Description of what must be done",
      "responsible": "BUYER or SELLER or BOTH",
      "deadline": "YYYY-MM-DD or null",
      "deadlineDays": 0,
      "deadlineFromEvent": "What event the deadline is measured from",
      "contractReference": "Section or paragraph reference in contract",
      "category": "TITLE, SURVEY, FINANCING, DOCUMENTS, PRORATIONS, UTILITIES, OTHER",
      "isCritical": true
    }
  ],

  "contingencies": [
    {
      "name": "Name of contingency",
      "description": "What must occur",
      "deadline": "YYYY-MM-DD or null",
      "deadlineDays": 0,
      "deadlineFromEvent": "What event the deadline is measured from",
      "conditions": "Conditions for satisfaction or waiver",
      "consequence": "What happens if not satisfied (e.g., 'Buyer may terminate', 'Contract voids')"
    }
  ],
  "dueDiligenceItems": [
    {
      "name": "Item name",
      "description": "What is required",
      "deadline": "YYYY-MM-DD or null",
      "deadlineDays": 0,
      "deadlineFromEvent": "What event the deadline is measured from",
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
    {
      "obligation": "Description of the obligation",
      "responsible": "BUYER or SELLER",
      "deadline": "YYYY-MM-DD or description of when due",
      "survives": "How long obligation survives closing"
    }
  ],

  "keyMilestones": [
    {
      "name": "Milestone name",
      "date": "YYYY-MM-DD or null",
      "daysFromEffective": 0,
      "description": "Brief description",
      "category": "CONTRACT, FEASIBILITY, TITLE, SURVEY, FINANCING, CLOSING, POST_CLOSING"
    }
  ],

  "confidence": 0.95,
  "warnings": [
    "Any ambiguities or concerns about the analysis"
  ]
}

IMPORTANT INSTRUCTIONS:
1. Return ONLY the JSON object, no additional text or markdown formatting.
2. Ensure all monetary values are numbers, not strings.
3. Ensure all dates are in YYYY-MM-DD format.
4. Include a confidence score between 0 and 1.
5. Add warnings for any ambiguous or uncertain extractions.
6. For EVERY deadline expressed as "X days from [event]", you MUST populate:
   - The "Days" field with the number of days
   - The "FromEvent" field describing what event triggers the countdown
   - The actual date field ONLY if the trigger date is known
7. The preFeasibilityChecklist should be COMPREHENSIVE - include every single item that must be completed before the inspection/feasibility period ends.
8. The preClosingChecklist should be COMPREHENSIVE - include every single item that must be completed before closing.
9. The keyMilestones array should include ALL significant dates for easy import into a timeline system.
10. If the effective date is not specified, add ALL date-dependent items to missingDateDependencies.`
}
