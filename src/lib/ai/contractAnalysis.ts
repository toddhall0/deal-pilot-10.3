import { analyzeWithRetry } from "./claude"
import { extractTextFromBuffer } from "./pdfExtractor"
import { CONTRACT_ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt, MULTI_DOCUMENT_ANALYSIS_SYSTEM_PROMPT, buildMultiDocumentAnalysisPrompt } from "./contractPrompt"
import { ContractAnalysisResult } from "@/types/analysis"

export interface DocumentInput {
  name: string
  category: string
  text: string
}

export async function analyzeContract(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ContractAnalysisResult> {
  // Extract text from document
  const contractText = await extractTextFromBuffer(fileBuffer, mimeType)

  if (!contractText || contractText.trim().length < 100) {
    throw new Error("Could not extract sufficient text from document")
  }

  // Truncate if too long (Claude has context limits)
  const maxLength = 100000 // ~25k tokens
  const truncatedText =
    contractText.length > maxLength
      ? contractText.substring(0, maxLength) + "\n\n[Document truncated...]"
      : contractText

  // Build prompt
  const prompt = buildAnalysisPrompt(truncatedText)

  // Send to Claude
  const response = await analyzeWithRetry(
    [{ role: "user", content: prompt }],
    {
      system: CONTRACT_ANALYSIS_SYSTEM_PROMPT,
      maxTokens: 8192,
      temperature: 0,
    }
  )

  // Parse response
  try {
    // Clean up response - remove any markdown code blocks
    let cleanResponse = response.trim()
    if (cleanResponse.startsWith("```json")) {
      cleanResponse = cleanResponse.slice(7)
    }
    if (cleanResponse.startsWith("```")) {
      cleanResponse = cleanResponse.slice(3)
    }
    if (cleanResponse.endsWith("```")) {
      cleanResponse = cleanResponse.slice(0, -3)
    }

    const result = JSON.parse(cleanResponse) as ContractAnalysisResult

    // Add raw text for reference
    result.rawText = truncatedText

    return result
  } catch (parseError) {
    console.error("Failed to parse Claude response:", response)
    throw new Error("Failed to parse contract analysis results")
  }
}

export async function analyzeMultipleDocuments(
  documents: DocumentInput[],
  existingAnalysis?: ContractAnalysisResult
): Promise<ContractAnalysisResult> {
  // Build combined document text with clear separators
  const maxLengthPerDoc = Math.floor(150000 / documents.length) // Share context across docs

  const documentTexts = documents.map((doc, index) => {
    const truncatedText = doc.text.length > maxLengthPerDoc
      ? doc.text.substring(0, maxLengthPerDoc) + "\n\n[Document truncated...]"
      : doc.text

    return `=== DOCUMENT ${index + 1}: ${doc.name} (${doc.category}) ===\n\n${truncatedText}`
  })

  const combinedText = documentTexts.join("\n\n" + "=".repeat(80) + "\n\n")

  // Build prompt
  const prompt = buildMultiDocumentAnalysisPrompt(combinedText, documents.length, existingAnalysis)

  // Send to Claude with extended token limit for multi-doc
  const response = await analyzeWithRetry(
    [{ role: "user", content: prompt }],
    {
      system: MULTI_DOCUMENT_ANALYSIS_SYSTEM_PROMPT,
      maxTokens: 12000,
      temperature: 0,
    }
  )

  // Parse response
  try {
    let cleanResponse = response.trim()
    if (cleanResponse.startsWith("```json")) {
      cleanResponse = cleanResponse.slice(7)
    }
    if (cleanResponse.startsWith("```")) {
      cleanResponse = cleanResponse.slice(3)
    }
    if (cleanResponse.endsWith("```")) {
      cleanResponse = cleanResponse.slice(0, -3)
    }

    const result = JSON.parse(cleanResponse) as ContractAnalysisResult

    // Mark that this is a multi-document analysis
    result.rawText = `[Multi-document analysis of ${documents.length} documents]\n\n${combinedText}`

    return result
  } catch (parseError) {
    console.error("Failed to parse Claude response:", response)
    throw new Error("Failed to parse multi-document analysis results")
  }
}

export function validateAnalysisResult(
  result: ContractAnalysisResult
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!result.buyer?.name) {
    errors.push("Buyer name not found")
  }

  if (!result.seller?.name) {
    errors.push("Seller name not found")
  }

  if (!result.purchasePrice || result.purchasePrice <= 0) {
    errors.push("Purchase price not found or invalid")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
