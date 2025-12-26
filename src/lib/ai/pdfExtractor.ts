export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid build-time canvas dependency issues
    const pdfParse = (await import("pdf-parse")).default
    const data = await pdfParse(buffer)
    return data.text
  } catch (error) {
    console.error("PDF extraction error:", error)
    throw new Error("Failed to extract text from PDF")
  }
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    return extractTextFromPDF(buffer)
  }

  if (mimeType === "text/plain") {
    return buffer.toString("utf-8")
  }

  // For Word docs, we'd need additional libraries
  // For now, throw an error for unsupported types
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    throw new Error(
      "Word document analysis is not yet supported. Please upload a PDF version."
    )
  }

  throw new Error(`Unsupported file type: ${mimeType}`)
}
