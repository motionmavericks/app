import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type PresignBody = {
  key: string;
  contentType?: string;
  bucket?: string;
  expires?: number; // seconds
};

function getEnv() {
  const endpoint = process.env.WASABI_ENDPOINT || "https://s3.wasabisys.com";
  const region = process.env.WASABI_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
  const accessKeyId = process.env.WASABI_STAGING_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.WASABI_STAGING_SECRET || process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.STAGING_BUCKET;
  return { endpoint, region, accessKeyId, secretAccessKey, bucket };
}

export async function POST(req: NextRequest) {
  let body: PresignBody;
  try {
    body = (await req.json()) as PresignBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { key, contentType, bucket: bodyBucket, expires } = body || {};
  if (!key) {
    return NextResponse.json({ error: "Missing 'key'" }, { status: 400 });
  }

  const { endpoint, region, accessKeyId, secretAccessKey, bucket } = getEnv();
  const targetBucket = bodyBucket || bucket;

  if (!accessKeyId || !secretAccessKey || !targetBucket) {
    // Provide a helpful message during early development.
    return NextResponse.json(
      {
        error: "Server not configured for presign",
        missing: {
          WASABI_STAGING_ACCESS_KEY: !accessKeyId,
          WASABI_STAGING_SECRET: !secretAccessKey,
          STAGING_BUCKET: !targetBucket,
        },
        hint: "Set vars in ui/.env.local — see docs/configuration/env.md",
      },
      { status: 501 }
    );
  }

  const s3 = new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });

  const put = new PutObjectCommand({
    Bucket: targetBucket,
    Key: key,
    ContentType: contentType || "application/octet-stream",
  });

  const expiresIn = Math.min(Math.max(expires ?? 900, 60), 3600); // clamp 1–60 min
  try {
    const url = await getSignedUrl(s3, put, { expiresIn });
    return NextResponse.json({ url, bucket: targetBucket, key, expiresIn });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to presign", detail: message },
      { status: 500 }
    );
  }
}
