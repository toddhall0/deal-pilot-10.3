export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid build-time issues
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs")

    // Convert Buffer to Uint8Array
    const data = new Uint8Array(buffer)

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data })
    const pdf = await loadingTask.promise

    const textContent: string[] = []

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageText = (content.items as any[])
        .map((item) => item.str || "")
        .filter(Boolean)
        .join(" ")
      textContent.push(pageText)
    }

    await pdf.destroy()

    return textContent.join("\n\n")
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
