import React, { useCallback, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const CompanyPolicy: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = useCallback((selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    const f = selected[0];
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast({ title: "Invalid file", description: "Only PDF/DOC/DOCX files are allowed.", variant: "destructive" });
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Max allowed size is 10MB.", variant: "destructive" });
      return;
    }

    setSelectedFile(f);
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleChoose = () => {
    document.getElementById("policy_file")?.click();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      // Fake upload - simulate processing time
      await new Promise((r) => setTimeout(r, 1000));
      
      // Show success message with document name
      toast({ 
        title: "Success", 
        description: `Document "${selectedFile.name}" has been uploaded successfully.`,
      });
      
      // Clear selected file after successful upload
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Company Policy</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload and manage your company's policy documents</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Policy Document</h2>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer mb-6"
            onClick={handleChoose}
          >
            <div className="flex items-center justify-center flex-col">
              <Upload className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">Drag & drop your document here</p>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <p className="text-xs text-gray-400">PDF, DOC, DOCX · Max 10MB</p>
              <input 
                id="policy_file" 
                type="file" 
                accept=".pdf,.doc,.docx" 
                onChange={(e) => handleFiles(e.target.files)} 
                className="hidden" 
              />
            </div>
          </div>

          {selectedFile && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{selectedFile.name}</div>
                  <div className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedFile || isUploading}
              className="flex-1"
            >
              {isUploading ? 'Uploading...' : 'Submit Document'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyPolicy;
