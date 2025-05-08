import React, { useState, useEffect, useCallback } from "react";
import { listFilesFromS3, deleteFileFromS3 } from "@/lib/s3";
import {
  Trash2,
  Eye,
  FileText,
  FileSpreadsheet,
  ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

interface File {
  id: string;
  name: string;
  type: "pdf" | "excel";
  uploadedAt: Date;
  size: number;
  url: string;
}

interface FilesListProps {
  files?: File[];
  onDelete?: (fileId: string) => void;
  onView?: (fileUrl: string) => void;
  isLoading?: boolean;
}

const FilesList = ({
  files = [],
  onDelete = () => {},
  onView = () => {},
  isLoading: initialLoading = false,
}: FilesListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"name" | "type" | "uploadedAt">(
    "uploadedAt",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [sortedFiles, setSortedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [s3Files, setS3Files] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(files.length / itemsPerPage);

  // Mock data for demonstration when no files are provided
  const mockFiles: File[] = [
    {
      id: "1",
      name: "annual-report-2023.pdf",
      type: "pdf",
      uploadedAt: new Date("2023-12-15"),
      size: 2456789,
      url: "#",
    },
    {
      id: "2",
      name: "financial-data-q4.xlsx",
      type: "excel",
      uploadedAt: new Date("2023-12-10"),
      size: 1234567,
      url: "#",
    },
    {
      id: "3",
      name: "product-catalog.pdf",
      type: "pdf",
      uploadedAt: new Date("2023-11-28"),
      size: 3456789,
      url: "#",
    },
    {
      id: "4",
      name: "inventory-2023.xlsx",
      type: "excel",
      uploadedAt: new Date("2023-11-20"),
      size: 987654,
      url: "#",
    },
    {
      id: "5",
      name: "marketing-strategy.pdf",
      type: "pdf",
      uploadedAt: new Date("2023-11-15"),
      size: 1567890,
      url: "#",
    },
  ];

  const displayFiles =
    s3Files.length > 0 ? s3Files : files.length > 0 ? files : mockFiles;

  // Fetch files from S3
  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedFiles = await listFilesFromS3();
      setS3Files(fetchedFiles);
    } catch (error) {
      console.error("Error fetching files:", error);
      setError("Failed to fetch files. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load files on component mount
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Handle file deletion
  const handleDeleteFile = async (fileId: string) => {
    try {
      setIsLoading(true);
      await deleteFileFromS3(fileId);

      // Update the file list after deletion
      setS3Files((prevFiles) => prevFiles.filter((file) => file.id !== fileId));

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete(fileId);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      setError("Failed to delete file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sort files when sort parameters change
  useEffect(() => {
    const sorted = [...displayFiles].sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === "type") {
        return sortDirection === "asc"
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      } else {
        // Sort by uploadedAt
        return sortDirection === "asc"
          ? a.uploadedAt.getTime() - b.uploadedAt.getTime()
          : b.uploadedAt.getTime() - a.uploadedAt.getTime();
      }
    });

    setSortedFiles(sorted);
  }, [displayFiles, sortField, sortDirection]);

  // Get current page items
  const currentFiles = sortedFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSort = (field: "name" | "type" | "uploadedAt") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Uploaded Files</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="w-[40%] cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        File Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="w-[15%] cursor-pointer"
                      onClick={() => handleSort("type")}
                    >
                      <div className="flex items-center">
                        Type
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="w-[20%] cursor-pointer"
                      onClick={() => handleSort("uploadedAt")}
                    >
                      <div className="flex items-center">
                        Uploaded
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[10%]">Size</TableHead>
                    <TableHead className="w-[15%] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentFiles.length > 0 ? (
                    currentFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">
                          {file.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              file.type === "pdf" ? "default" : "secondary"
                            }
                            className="flex items-center w-fit gap-1"
                          >
                            {file.type === "pdf" ? (
                              <>
                                <FileText className="h-3 w-3" />
                                PDF
                              </>
                            ) : (
                              <>
                                <FileSpreadsheet className="h-3 w-3" />
                                Excel
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(file.uploadedAt, "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>{formatFileSize(file.size)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onView(file.url)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete File
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{file.name}
                                    "? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteFile(file.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No files found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={currentPage === page}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FilesList;
