import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ClaudeMessage {
  role: "user" | "assistant"
  content: string
}

export interface ClaudeOptions {
  maxTokens?: number
  temperature?: number
  system?: string
}

export async function sendMessage(
  messages: ClaudeMessage[],
  options: ClaudeOptions = {}
): Promise<string> {
  const {
    maxTokens = 4096,
    temperature = 0,
    system,
  } = options

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      temperature,
      system,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    })

    // Extract text content from response
    const textContent = response.content.find((c) => c.type === "text")
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in response")
    }

    return textContent.text
  } catch (error) {
    console.error("Claude API error:", error)
    throw error
  }
}

export async function analyzeWithRetry(
  messages: ClaudeMessage[],
  options: ClaudeOptions = {},
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendMessage(messages, options)
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${attempt} failed:`, error)

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        )
      }
    }
  }

  throw lastError || new Error("All retry attempts failed")
}
