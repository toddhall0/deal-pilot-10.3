import { NextResponse } from "next/server"
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3"

export async function GET() {
  try {
    // Normalize region for Cloudflare R2 compatibility (requires lowercase)
    const region = (process.env.S3_REGION || "auto").toLowerCase()

    const client = new S3Client({
      region,
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: !!process.env.S3_ENDPOINT, // Required for R2
    })

    await client.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET_NAME }))
    return NextResponse.json({ status: "ok" })
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 })
  }
}
