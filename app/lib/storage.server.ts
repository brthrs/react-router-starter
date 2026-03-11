import { randomUUID } from "crypto";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join, extname } from "path";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "./logger.server";

const log = logger.child({ module: "storage" });

const useS3 = !!process.env.S3_BUCKET;

const s3 =
  useS3
    ? new S3Client({
        region: process.env.S3_REGION ?? "auto",
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
        },
        forcePathStyle: !!process.env.S3_ENDPOINT,
      })
    : null;

const LOCAL_UPLOAD_DIR = join(process.cwd(), "public", "uploads");

function generateKey(filename: string): string {
  const ext = extname(filename);
  return `avatars/${randomUUID()}${ext}`;
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const key = generateKey(filename);

  if (s3 && useS3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    log.info({ key }, "File uploaded to S3");
    return key;
  }

  await mkdir(join(LOCAL_UPLOAD_DIR, "avatars"), { recursive: true });
  const filePath = join(LOCAL_UPLOAD_DIR, key);
  await writeFile(filePath, buffer);
  log.info({ key, path: filePath }, "File saved locally");
  return key;
}

export async function deleteFile(key: string): Promise<void> {
  if (s3 && useS3) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
      }),
    );
    return;
  }

  try {
    await unlink(join(LOCAL_UPLOAD_DIR, key));
  } catch {
    // file may not exist
  }
}

export async function getFileUrl(key: string): Promise<string> {
  if (s3 && useS3) {
    return getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
      }),
      { expiresIn: 3600 },
    );
  }

  return `/uploads/${key}`;
}
