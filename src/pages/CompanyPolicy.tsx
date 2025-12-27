import React, { useCallback, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { apiPostFormData, apiGet } from "@/lib/api";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (as per API spec)
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

interface DocumentStatus {
  id: string;
  title: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  error_message?: string;
  file_url?: string;
}

const CompanyPolicy: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<DocumentStatus | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');

  const handleFiles = useCallback((selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    const f = selected[0];
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast({ title: "Invalid file", description: "Only PDF and DOCX files are allowed.", variant: "destructive" });
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Max allowed size is 50MB.", variant: "destructive" });
      return;
    }

    setSelectedFile(f);
    // Auto-fill document title from filename (without extension)
    const fileNameWithoutExt = f.name.replace(/\.[^/.]+$/, "");
    setDocumentTitle(fileNameWithoutExt);
    // Reset status when new file is selected
    setUploadStatus(null);
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleChoose = () => {
    document.getElementById("policy_file")?.click();
  };

  // Poll for document processing status
  const pollDocumentStatus = async (documentId: string): Promise<{ success: boolean; document?: DocumentStatus; error?: string }> => {
    try {
      const doc = await apiGet(`/chat/documents/${documentId}/`);
      setUploadStatus(doc);
      
      if (doc.status === 'ready') {
        return { success: true, document: doc };
      }
      
      if (doc.status === 'failed') {
        return { success: false, error: doc.error_message || 'Processing failed' };
      }
      
      // Still processing, poll again after 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      return pollDocumentStatus(documentId);
    } catch (error: any) {
      console.error('Error polling document status:', error);
      return { success: false, error: error.response?.data?.detail || 'Failed to check document status' };
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }

    if (!documentTitle.trim()) {
      toast({ title: "Title required", description: "Please enter a document title.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      // Step 1: Upload the document
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', documentTitle.trim());
      formData.append('doc_type', 'Company Policy');

      const uploadedDoc = await apiPostFormData('/chat/documents/upload/', formData);
      
      setUploadStatus(uploadedDoc);
      
      toast({ 
        title: "Upload started", 
        description: `Document "${selectedFile.name}" is being uploaded and processed...`,
      });

      // Step 2: Poll for processing status
      const result = await pollDocumentStatus(uploadedDoc.id);
      
      if (result.success) {
        toast({ 
          title: "Success!", 
          description: `Document "${documentTitle}" has been processed and is ready for use.`,
        });
        
        // Clear form after successful processing
        setTimeout(() => {
          setSelectedFile(null);
          setDocumentTitle('');
          setUploadStatus(null);
        }, 3000);
      } else {
        toast({ 
          title: "Processing failed", 
          description: result.error || "Please try again.", 
          variant: "destructive" 
        });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.file?.[0] || 
                          err.response?.data?.detail || 
                          err.message || 
                          'Upload failed. Please try again.';
      
      toast({ 
        title: "Upload failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
      
      setUploadStatus({ 
        id: '', 
        title: documentTitle, 
        status: 'failed', 
        error_message: errorMessage 
      });
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

          {/* Document Title Input */}
          <div className="mb-4">
            <label htmlFor="doc_title" className="block text-sm font-medium mb-2">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              id="doc_title"
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="e.g., Employee Code of Conduct, Remote Work Policy"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isUploading}
            />
          </div>

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
              <p className="text-xs text-gray-400">PDF, DOCX · Max 50MB</p>
              <input 
                id="policy_file" 
                type="file" 
                accept=".pdf,.docx" 
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
                  onClick={() => {
                    setSelectedFile(null);
                    setDocumentTitle('');
                    setUploadStatus(null);
                  }}
                  disabled={isUploading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Upload Status Display */}
          {uploadStatus && (
            <div className={`mb-6 p-4 rounded-lg border ${
              uploadStatus.status === 'ready' ? 'bg-green-50 border-green-200' :
              uploadStatus.status === 'failed' ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-3">
                {uploadStatus.status === 'ready' && <CheckCircle2 className="h-6 w-6 text-green-600" />}
                {uploadStatus.status === 'failed' && <XCircle className="h-6 w-6 text-red-600" />}
                {(uploadStatus.status === 'uploading' || uploadStatus.status === 'processing') && (
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                )}
                <div className="flex-1">
                  <div className="font-medium">
                    {uploadStatus.status === 'uploading' && 'Uploading file...'}
                    {uploadStatus.status === 'processing' && 'Processing document... (this may take 30-60 seconds)'}
                    {uploadStatus.status === 'ready' && '✓ Document ready for use'}
                    {uploadStatus.status === 'failed' && '✗ Processing failed'}
                  </div>
                  {uploadStatus.error_message && (
                    <div className="text-sm text-red-600 mt-1">{uploadStatus.error_message}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedFile || !documentTitle.trim() || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit Document'
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyPolicy;
