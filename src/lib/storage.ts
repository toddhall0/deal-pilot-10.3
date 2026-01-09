import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { v4 as uuidv4 } from "uuid"

// Normalize region for Cloudflare R2 compatibility (requires lowercase)
const region = (process.env.S3_REGION || "auto").toLowerCase()

const s3Client = new S3Client({
  region,
  endpoint: process.env.S3_ENDPOINT || undefined,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: !!process.env.S3_ENDPOINT, // Required for R2
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "deal-pilot-documents"

// Allowed file types
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/gif",
  "text/plain",
  "text/csv",
]

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export function validateFile(file: { type: string; size: number }): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "File type not allowed" }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size exceeds 100MB limit" }
  }
  return { valid: true }
}

export function generateFileKey(dealId: string, category: string, originalName: string): string {
  const ext = originalName.split(".").pop() || ""
  const uniqueId = uuidv4()
  return `deals/${dealId}/${category}/${uniqueId}.${ext}`
}

export async function uploadFile(
  fileBuffer: Buffer,
  fileKey: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: contentType,
  })

  await s3Client.send(command)
  return fileKey
}

export async function getSignedDownloadUrl(fileKey: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

export async function deleteFile(fileKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  })

  await s3Client.send(command)
}

export async function getFileBuffer(fileKey: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  })

  const response = await s3Client.send(command)
  const byteArray = await response.Body?.transformToByteArray()

  if (!byteArray) {
    throw new Error("Failed to read file from storage")
  }

  return Buffer.from(byteArray)
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || ""
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
