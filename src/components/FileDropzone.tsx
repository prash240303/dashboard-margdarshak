import React, { useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FileDropzoneProps {
  acceptedFileTypes: string[];
  onFileSelect: (file: File) => void;
  fileTypeLabel: string;
  maxSizeMB?: number;
}

const FileDropzone = ({
  acceptedFileTypes = [".pdf"],
  onFileSelect = () => {},
  fileTypeLabel = "PDF",
  maxSizeMB = 10,
}: FileDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = useCallback(
    (file: File) => {
      setError(null);

      // Check file type
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (!acceptedFileTypes.includes(fileExtension)) {
        setError(`Invalid file type. Please upload a ${fileTypeLabel} file.`);
        return false;
      }

      // Check file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setError(`File size exceeds the ${maxSizeMB}MB limit.`);
        return false;
      }

      return true;
    },
    [acceptedFileTypes, fileTypeLabel, maxSizeMB],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length) {
        const file = files[0];
        if (validateFile(file)) {
          setSelectedFile(file);
          onFileSelect(file);
        }
      }
    },
    [validateFile, onFileSelect],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (validateFile(file)) {
          setSelectedFile(file);
          onFileSelect(file);
        }
      }
    },
    [validateFile, onFileSelect],
  );

  return (
    <Card className="bg-white w-full h-full">
      <div
        className={`flex flex-col items-center justify-center w-full h-full p-6 border-2 border-dashed rounded-lg transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id={`file-upload-${fileTypeLabel}`}
          className="hidden"
          accept={acceptedFileTypes.join(",")}
          onChange={handleFileSelect}
        />

        <Upload
          className={`w-12 h-12 mb-4 ${isDragging ? "text-primary" : "text-gray-400"}`}
        />

        {selectedFile ? (
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Selected file:
            </p>
            <p className="text-sm font-bold text-primary truncate max-w-full">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Drag and drop your {fileTypeLabel} file here, or
            </p>
            <label
              htmlFor={`file-upload-${fileTypeLabel}`}
              className="text-sm font-semibold text-primary cursor-pointer hover:underline"
            >
              browse files
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Accepted file types: {acceptedFileTypes.join(", ")}
            </p>
            <p className="text-xs text-gray-500">
              Maximum file size: {maxSizeMB} MB
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-red-500 text-center">{error}</div>
        )}
      </div>
    </Card>
  );
};

export default FileDropzone;
