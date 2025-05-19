import { S3Client, S3ServiceException, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { PDFDocument } from "pdf-lib";
// Import getSignedUrl only if you're using it (check if it's available in your package)
// If not available, we'll provide an alternative implementation
let getSignedUrl: any;

// Define types for better type safety
interface FileInfo {
  id: string;
  name: string;
  type: string;
  uploadedAt: Date;
  size: number;
  url: string;
  sourceLink?: string;
}

// Constants
const MAX_FILE_SIZE_MB = 100; // 100MB max file size
const BUCKET_NAME = import.meta.env.VITE_AWS_S3_BUCKET_NAME || "";

// Initialize S3 client with proper error handling
let s3Client: S3Client;
try {
  s3Client = new S3Client({
    region: import.meta.env.VITE_AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "",
    },
  });
} catch (error) {
  console.error("Failed to initialize S3 client:", error);
  throw new Error("S3 client initialization failed. Check your AWS credentials.");
}

/**
 * Validate file size before upload
 * @param file File to validate
 * @returns boolean indicating if file is valid
 */
function validateFileSize(file: File): boolean {
  const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
  }
  return true;
}

/**
 * Add source link to PDF metadata
 * @param pdfFile PDF file to modify
 * @param sourceLink Source link to add to metadata
 * @returns Modified PDF as ArrayBuffer
 */
export async function addSourceLinkToPdf(
  pdfFile: File,
  sourceLink: string,
): Promise<ArrayBuffer> {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Set standard metadata fields using available methods in pdf-lib
    pdfDoc.setTitle(`Document: ${pdfFile.name}`);
    pdfDoc.setAuthor("Document Management System");
    pdfDoc.setSubject(sourceLink); // Store source link in the subject field
    pdfDoc.setProducer("DMS Upload Tool");
    pdfDoc.setCreator("DMS Upload Tool");
    
    // Fix: Pass an array of strings to setKeywords instead of a single string
    pdfDoc.setKeywords([`source:${sourceLink}`, `upload:${new Date().toISOString()}`]);
    
    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    return modifiedPdfBytes;
  } catch (error) {
    console.error("Error modifying PDF metadata:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to modify PDF metadata: ${error.message}`);
    }
    throw new Error("Failed to modify PDF metadata due to unknown error");
  }
}
/**
 * Upload PDF file to S3
 * @param pdfFile PDF file to upload
 * @param sourceLink Source link to add to metadata
 * @returns S3 file key
 */
export async function uploadPdfToS3(
  pdfFile: File,
  sourceLink: string,
): Promise<string> {
  try {
    // Make sure BUCKET_NAME is properly defined and imported
    // If this constant is defined elsewhere, ensure it's imported correctly
    // If not defined yet, define it at the top of your file:
    const BUCKET_NAME = "major-project-margdarshak"
    
    // Validate that bucket name is available
    if (!BUCKET_NAME) {
      throw new Error("S3 bucket name is not defined. Check your environment configuration.");
    }

    // Validate file size
    validateFileSize(pdfFile);

    // Add source link to PDF metadata
    const modifiedPdfBytes = await addSourceLinkToPdf(pdfFile, sourceLink);

    // Create a unique file key for S3 with clean filename
    const timestamp = Date.now();
    const sanitizedName = pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileKey = `pdf_files/${timestamp}-${sanitizedName}`;

    // Upload to S3 with comprehensive metadata
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: new Uint8Array(modifiedPdfBytes),
        ContentType: "application/pdf",
        ContentDisposition: `attachment; filename="${sanitizedName}"`,
        Metadata: {
          sourceLink: encodeURIComponent(sourceLink),
          originalName: encodeURIComponent(pdfFile.name),
          uploadTimestamp: timestamp.toString(),
          fileSize: pdfFile.size.toString(),
        },
      },
    });

    console.log(`Uploading to bucket: ${BUCKET_NAME}, key: ${fileKey}`);
    await upload.done();
    return fileKey;
  } catch (error) {
    if (error instanceof S3ServiceException) {
      console.error("AWS S3 error uploading PDF:", error);
      throw new Error(`S3 upload failed: ${error.name} - ${error.message}`);
    }
    console.error("Error uploading PDF to S3:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload PDF: ${error.message}`);
    }
    throw new Error("Failed to upload PDF due to unknown error");
  }
}
/**
 * Upload Excel file to S3
 * @param excelFile Excel file to upload
 * @returns S3 file key
 */
export async function uploadExcelToS3(excelFile: File): Promise<string> {
  try {
    // Validate file size
    validateFileSize(excelFile);
    
    // Validate file type
    const validExcelTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.oasis.opendocument.spreadsheet"
    ];
    
    if (!validExcelTypes.includes(excelFile.type)) {
      throw new Error("Invalid Excel file format. Please upload a valid Excel file.");
    }

    // Create a unique file key for S3 with clean filename
    const timestamp = Date.now();
    const sanitizedName = excelFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileKey = `excel_sheets/${timestamp}-${sanitizedName}`;

    // Upload to S3
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: await excelFile.arrayBuffer(),
        ContentType: excelFile.type,
        ContentDisposition: `attachment; filename="${sanitizedName}"`,
        Metadata: {
          originalName: encodeURIComponent(excelFile.name),
          uploadTimestamp: timestamp.toString(),
          fileSize: excelFile.size.toString(),
        },
      },
    });

    await upload.done();
    return fileKey;
  } catch (error) {
    if (error instanceof S3ServiceException) {
      console.error("AWS S3 error uploading Excel:", error);
      throw new Error(`S3 upload failed: ${error.name} - ${error.message}`);
    }
    console.error("Error uploading Excel to S3:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload Excel: ${error.message}`);
    }
    throw new Error("Failed to upload Excel due to unknown error");
  }
}

/**
 * List files from S3
 * @returns Array of file information
 */
export async function listFilesFromS3(): Promise<FileInfo[]> {
  try {
    // List PDF files
    const pdfCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: "pdf_files/",
      MaxKeys: 1000,
    });

    // List Excel files
    const excelCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: "excel_sheets/",
      MaxKeys: 1000,
    });

    const [pdfResponse, excelResponse] = await Promise.all([
      s3Client.send(pdfCommand),
      s3Client.send(excelCommand),
    ]);

    const pdfFiles: FileInfo[] = (pdfResponse.Contents || [])
      .filter(item => item.Key && item.Key.endsWith(".pdf"))
      .map((item) => ({
        id: item.Key || "",
        name: item.Key?.split("/").pop() || "",
        type: "pdf",
        uploadedAt: item.LastModified || new Date(),
        size: item.Size || 0,
        url: `https://${BUCKET_NAME}.s3.amazonaws.com/${item.Key}`,
      }));

    const excelFiles: FileInfo[] = (excelResponse.Contents || [])
      .filter(item => item.Key && 
        (item.Key.endsWith(".xlsx") || 
         item.Key.endsWith(".xls") || 
         item.Key.endsWith(".ods")))
      .map((item) => ({
        id: item.Key || "",
        name: item.Key?.split("/").pop() || "",
        type: "excel",
        uploadedAt: item.LastModified || new Date(),
        size: item.Size || 0,
        url: `https://${BUCKET_NAME}.s3.amazonaws.com/${item.Key}`,
      }));

    return [...pdfFiles, ...excelFiles];
  } catch (error) {
    if (error instanceof S3ServiceException) {
      console.error("AWS S3 error listing files:", error);
      throw new Error(`S3 list operation failed: ${error.name} - ${error.message}`);
    }
    console.error("Error listing files from S3:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
    throw new Error("Failed to list files due to unknown error");
  }
}

/**
 * Generate a pre-signed URL for secure file access
 * @param fileKey S3 file key
 * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Pre-signed URL
 */
export async function getPresignedUrl(fileKey: string, expiresIn: number = 3600): Promise<string> {
  try {
    // Try to dynamically import the getSignedUrl function if available
    try {
      const { getSignedUrl: importedGetSignedUrl } = await import("@aws-sdk/s3-request-presigner");
      getSignedUrl = importedGetSignedUrl;
    } catch (importError) {
      console.warn("Could not import @aws-sdk/s3-request-presigner, using fallback URL generation");
    }
    
    if (getSignedUrl) {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
      });
      
      return await getSignedUrl(s3Client, command, { expiresIn });
    } else {
      // Fallback to direct URL if getSignedUrl is not available
      // This is less secure but ensures functionality
      return `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
    }
  } catch (error) {
    if (error instanceof S3ServiceException) {
      console.error("AWS S3 error generating URL:", error);
      throw new Error(`Failed to generate URL: ${error.name} - ${error.message}`);
    }
    console.error("Error generating URL:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate URL: ${error.message}`);
    }
    throw new Error("Failed to generate URL due to unknown error");
  }
}

/**
 * Delete file from S3
 * @param fileKey S3 file key
 */
export async function deleteFileFromS3(fileKey: string): Promise<void> {
  try {
    if (!fileKey) {
      throw new Error("File key is required");
    }
    
    // Validate the file key format to prevent accidental deletions
    if (!fileKey.startsWith("pdf_files/") && !fileKey.startsWith("excel_sheets/")) {
      throw new Error("Invalid file key format");
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(command);
  } catch (error) {
    if (error instanceof S3ServiceException) {
      console.error("AWS S3 error deleting file:", error);
      throw new Error(`S3 delete operation failed: ${error.name} - ${error.message}`);
    }
    console.error("Error deleting file from S3:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
    throw new Error("Failed to delete file due to unknown error");
  }
}

/**
 * Get file metadata from S3
 * @param fileKey S3 file key
 * @returns File metadata
 */
export async function getFileMetadata(fileKey: string): Promise<Record<string, string>> {
  try {
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
    
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const response = await s3Client.send(command);
    return response.Metadata || {};
  } catch (error) {
    if (error instanceof S3ServiceException) {
      console.error("AWS S3 error retrieving metadata:", error);
      throw new Error(`Failed to get metadata: ${error.name} - ${error.message}`);
    }
    console.error("Error retrieving file metadata:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to get metadata: ${error.message}`);
    }
    throw new Error("Failed to get metadata due to unknown error");
  }
}