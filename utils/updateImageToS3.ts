import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../modules/aws_upload";

async function updateImageToS3(params: { buffer: Buffer; mimetype?: string }) {
    const fileName = `${crypto.randomUUID()}`;
    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: fileName,
            Body: params.buffer,
            ContentType: params.mimetype,
        })
    );
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${fileName}`;
    return imageUrl;
}

export default updateImageToS3;
