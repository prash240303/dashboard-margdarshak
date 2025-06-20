import React, { useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import FileUploadSection from "./FileUploadSection";
import FilesList from "./FilesList";
import { motion } from "framer-motion";
import LinkToPDFUploadSection from "./LinkToHTML";

const HomePage = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [refreshFiles, setRefreshFiles] = useState(0);

  const handleUploadSuccess = useCallback(() => {
    // Increment refresh counter to trigger file list refresh
    setRefreshFiles((prev) => prev + 1);
    // Switch to files tab
    setActiveTab("files");
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col">
      <motion.header
        className="mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Margdarkshak Chatbot Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Upload, manage, and organize your PDF and Excel files
        </p>
      </motion.header>

      <Card className="w-full max-w-7xl mx-auto flex-grow bg-white">
        <CardContent className="p-0">
          <Tabs
            defaultValue="upload"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="border-b px-6 py-4">
              <TabsList className="grid w-full md:w-[450px] grid-cols-3">
                <TabsTrigger value="upload">Upload Files</TabsTrigger>
                <TabsTrigger value="files">Manage Files</TabsTrigger>
                <TabsTrigger value="convert">Convert Link to PDF</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="upload" className="mt-0">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold mb-6">Upload Files</h2>
                  <FileUploadSection onUploadSuccess={handleUploadSuccess} />
                </motion.div>
              </TabsContent>

              <TabsContent value="files" className="mt-0">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold mb-6">Manage Files</h2>
                  <FilesList key={`files-list-${refreshFiles}`} />
                </motion.div>
              </TabsContent>
              <TabsContent value="convert" className="mt-0">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold mb-6">
                    Convert Link to PDF
                  </h2>
                  <LinkToPDFUploadSection />
                </motion.div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>PDF & Excel Upload Manager © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default HomePage;
