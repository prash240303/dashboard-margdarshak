import React, { useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { uploadPdfToS3 } from "@/lib/s3";
import { LinkIcon } from "lucide-react";

const LinkToPDFUploadSection = () => {
  const [link, setLink] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleConvertAndUpload = async () => {
    if (!link) {
      setUploadError("Please enter a valid URL");
      return;
    }
  
    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(false);
  
      // Fetch the HTML content of the page
      const response = await fetch(link, { mode: "cors" });
      if (!response.ok) throw new Error("Failed to fetch page content. CORS might be blocking this request.");
  
      const htmlContent = await response.text();
  
      // Create a hidden container and insert the HTML content
      const container = document.createElement("div");
      container.innerHTML = htmlContent;
      container.style.width = "800px";
      container.style.padding = "20px";
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);
  
      // Generate PDF from the container
      const pdfBlob = await html2pdf()
        .from(container)
        .set({
          margin: 0.5,
          filename: "generated-from-link.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        })
        .outputPdf("blob");
  
      document.body.removeChild(container);
  
      const pdfFile = new File([pdfBlob], "generated-from-link.pdf", {
        type: "application/pdf",
      });
  
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
  
      await uploadPdfToS3(pdfFile, link);
  
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);
      setLink("");
  
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 1500);
    } catch (error) {
      console.error("PDF generation/upload error:", error);
      setUploadError(
        "Failed to convert or upload. The target page might be blocking access (CORS restrictions)."
      );
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle>Convert Link to PDF</CardTitle>
        <CardDescription>
          Enter a URL, convert the webpage into a PDF, and upload it to storage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="link" className="flex items-center gap-2 font-medium">
            <LinkIcon className="h-4 w-4" />
            Source URL
          </label>
          <Input
            id="link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://example.com/page"
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
            <AlertDescription>PDF uploaded successfully!</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleConvertAndUpload}
          disabled={!link || isUploading}
          className="w-full"
        >
          {isUploading ? "Processing..." : "Convert & Upload PDF"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LinkToPDFUploadSection;
