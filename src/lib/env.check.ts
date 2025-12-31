// This can be run manually to validate env vars
// Usage: npx ts-node src/lib/env.check.ts

import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET_NAME: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error("❌ Missing or invalid environment variables:")
  const errors = result.error.flatten().fieldErrors
  Object.entries(errors).forEach(([key, messages]) => {
    console.error(`  ${key}: ${messages?.join(", ")}`)
  })
  process.exit(1)
} else {
  console.log("✅ All required environment variables are set")
  process.exit(0)
}
