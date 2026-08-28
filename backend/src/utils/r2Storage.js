import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";
import fs from "fs";
import pino from 'pino';

const logger = pino();

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});


export const uploadPdfToR2 = async (filePath, fileName) => {
  try {
    if (!process.env.R2_BUCKET_NAME) {
      throw new Error("R2_BUCKET_NAME is missing in your .env file!");
    }

    const fileBuffer = fs.readFileSync(filePath);
    const key = `tenders/${Date.now()}_${fileName}`;
    
    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: "application/pdf",
    };

    await r2.send(new PutObjectCommand(uploadParams));
    logger.info(`Successfully uploaded ${fileName} to R2`);
    
    // UPDATED: Your actual Cloudflare Public URL
    return `https://pub-8a7cea61b87543e2ac1a32186ef4cd82.r2.dev/${key}`; 
  } catch (error) {
    logger.error(`R2 Upload Failed: ${error.message}`);
    return null; 
  }
};