import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ status: "not_configured" }, { status: 503 })
    }
    return NextResponse.json({ status: "ok" })
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 })
  }
}
