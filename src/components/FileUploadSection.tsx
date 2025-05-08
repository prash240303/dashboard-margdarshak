import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUpIcon, FileSpreadsheetIcon, LinkIcon } from "lucide-react";

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFileTypes: Record<string, string[]>;
  selectedFile: File | null;
  disabled?: boolean;
}

// Temporary FileDropzone component implementation
const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesSelected,
  acceptedFileTypes,
  selectedFile,
  disabled = false,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !disabled) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileChange}
        accept={Object.entries(acceptedFileTypes)
          .flatMap(([mime, exts]) => exts)
          .join(",")}
        disabled={disabled}
      />
      <label
        htmlFor="file-upload"
        className={`flex flex-col items-center justify-center gap-2 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="p-3 rounded-full bg-primary/10">
          <FileUpIcon className="h-6 w-6 text-primary" />
        </div>
        {selectedFile ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Drag and drop or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              {Object.entries(acceptedFileTypes)
                .flatMap(([mime, exts]) => exts)
                .join(", ")}{" "}
              files only
            </p>
          </div>
        )}
      </label>
    </div>
  );
};

interface FileUploadSectionProps {
  onPdfUpload?: (file: File, sourceUrl: string) => Promise<void>;
  onExcelUpload?: (file: File) => Promise<void>;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  onPdfUpload = async () => {},
  onExcelUpload = async () => {},
}) => {
  const [activeTab, setActiveTab] = useState("pdf");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handlePdfFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setPdfFile(files[0]);
      setUploadError(null);
    }
  };

  const handleExcelFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setExcelFile(files[0]);
      setUploadError(null);
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) {
      setUploadError("Please select a PDF file");
      return;
    }

    if (!sourceUrl) {
      setUploadError("Please enter a source URL");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      await onPdfUpload(pdfFile, sourceUrl);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);
      setPdfFile(null);
      setSourceUrl("");

      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 1500);
    } catch (error) {
      setUploadError("Failed to upload PDF file. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile) {
      setUploadError("Please select an Excel file");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      await onExcelUpload(excelFile);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);
      setExcelFile(null);

      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 1500);
    } catch (error) {
      setUploadError("Failed to upload Excel file. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle>File Upload</CardTitle>
        <CardDescription>
          Upload PDF and Excel files to your storage. PDF files require a source
          URL.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <FileUpIcon className="h-4 w-4" />
              PDF Upload
            </TabsTrigger>
            <TabsTrigger value="excel" className="flex items-center gap-2">
              <FileSpreadsheetIcon className="h-4 w-4" />
              Excel Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="space-y-4">
            <div className="grid gap-6">
              <FileDropzone
                onFilesSelected={handlePdfFileSelect}
                acceptedFileTypes={{
                  "application/pdf": [".pdf"],
                }}
                selectedFile={pdfFile}
                disabled={isUploading}
              />

              <div className="space-y-2">
                <Label htmlFor="sourceUrl" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Source URL
                </Label>
                <Input
                  id="sourceUrl"
                  placeholder="Enter the source URL for this PDF"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Upload Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {uploadError && (
                <Alert variant="destructive">
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {uploadSuccess && (
                <Alert>
                  <AlertDescription>
                    PDF file uploaded successfully!
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handlePdfUpload}
                disabled={!pdfFile || !sourceUrl || isUploading}
                className="w-full"
              >
                {isUploading ? "Uploading..." : "Upload PDF"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="excel" className="space-y-4">
            <div className="grid gap-6">
              <FileDropzone
                onFilesSelected={handleExcelFileSelect}
                acceptedFileTypes={{
                  "application/vnd.ms-excel": [".xls"],
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                    [".xlsx"],
                }}
                selectedFile={excelFile}
                disabled={isUploading}
              />

              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Upload Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {uploadError && (
                <Alert variant="destructive">
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {uploadSuccess && (
                <Alert>
                  <AlertDescription>
                    Excel file uploaded successfully!
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleExcelUpload}
                disabled={!excelFile || isUploading}
                className="w-full"
              >
                {isUploading ? "Uploading..." : "Upload Excel"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FileUploadSection;
