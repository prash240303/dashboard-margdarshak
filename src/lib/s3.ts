import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { PDFDocument } from "pdf-lib";

// Initialize S3 client
const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = import.meta.env.VITE_AWS_S3_BUCKET_NAME || "";

// Function to add source link to PDF metadata
export async function addSourceLinkToPdf(
  pdfFile: File,
  sourceLink: string,
): Promise<ArrayBuffer> {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Set custom metadata
    pdfDoc.setSubject(sourceLink);
    pdfDoc.setCustomMetadata("sourceLink", sourceLink);

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    return modifiedPdfBytes;
  } catch (error) {
    console.error("Error modifying PDF metadata:", error);
    throw new Error("Failed to modify PDF metadata");
  }
}

// Function to upload PDF file to S3
export async function uploadPdfToS3(
  pdfFile: File,
  sourceLink: string,
): Promise<string> {
  try {
    // Add source link to PDF metadata
    const modifiedPdfBytes = await addSourceLinkToPdf(pdfFile, sourceLink);

    // Create a unique file key for S3
    const timestamp = Date.now();
    const fileKey = `pdf_files/${timestamp}-${pdfFile.name}`;

    // Upload to S3
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: new Uint8Array(modifiedPdfBytes),
        ContentType: "application/pdf",
        Metadata: {
          sourceLink: encodeURIComponent(sourceLink),
        },
      },
    });

    await upload.done();
    return fileKey;
  } catch (error) {
    console.error("Error uploading PDF to S3:", error);
    throw new Error("Failed to upload PDF to S3");
  }
}

// Function to upload Excel file to S3
export async function uploadExcelToS3(excelFile: File): Promise<string> {
  try {
    // Create a unique file key for S3
    const timestamp = Date.now();
    const fileKey = `excel_sheets/${timestamp}-${excelFile.name}`;

    // Upload to S3
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: await excelFile.arrayBuffer(),
        ContentType: excelFile.type,
      },
    });

    await upload.done();
    return fileKey;
  } catch (error) {
    console.error("Error uploading Excel to S3:", error);
    throw new Error("Failed to upload Excel to S3");
  }
}

// Function to list files from S3
export async function listFilesFromS3(): Promise<any[]> {
  try {
    const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");

    // List PDF files
    const pdfCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: "pdf_files/",
    });

    // List Excel files
    const excelCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: "excel_sheets/",
    });

    const [pdfResponse, excelResponse] = await Promise.all([
      s3Client.send(pdfCommand),
      s3Client.send(excelCommand),
    ]);

    const pdfFiles =
      pdfResponse.Contents?.map((item) => ({
        id: item.Key || "",
        name: item.Key?.split("/").pop() || "",
        type: "pdf",
        uploadedAt: item.LastModified || new Date(),
        size: item.Size || 0,
        url: `https://${BUCKET_NAME}.s3.amazonaws.com/${item.Key}`,
      })) || [];

    const excelFiles =
      excelResponse.Contents?.map((item) => ({
        id: item.Key || "",
        name: item.Key?.split("/").pop() || "",
        type: "excel",
        uploadedAt: item.LastModified || new Date(),
        size: item.Size || 0,
        url: `https://${BUCKET_NAME}.s3.amazonaws.com/${item.Key}`,
      })) || [];

    return [...pdfFiles, ...excelFiles];
  } catch (error) {
    console.error("Error listing files from S3:", error);
    throw new Error("Failed to list files from S3");
  }
}

// Function to delete file from S3
export async function deleteFileFromS3(fileKey: string): Promise<void> {
  try {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error("Failed to delete file from S3");
  }
}
