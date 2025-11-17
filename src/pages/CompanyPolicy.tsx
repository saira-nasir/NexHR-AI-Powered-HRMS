import React, { useCallback, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type UploadedFile = {
  id: string;
  file: File;
  url?: string;
  uploadedAt?: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const CompanyPolicy: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
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

    const newFile: UploadedFile = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      url: URL.createObjectURL(f),
      uploadedAt: new Date().toISOString(),
    };
    setFiles((s) => [newFile, ...s]);
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleChoose = () => {
    document.getElementById("policy_file")?.click();
  };

  const removeFile = (id: string) => {
    setFiles((s) => s.filter((f) => f.id !== id));
  };

  const uploadAll = async () => {
    if (files.length === 0) {
      toast({ title: "No files", description: "Please add a file to upload.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      // Placeholder upload logic. If backend exists, replace with real endpoint.
      // Example:
      // const fd = new FormData();
      // fd.append('file', files[0].file);
      // await fetch(`${API_BASE}/hr/policies/`, { method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` } })

      await new Promise((r) => setTimeout(r, 900));
      toast({ title: "Success", description: "Company policy uploaded successfully." });
      setFiles((s) => s.map((f) => ({ ...f, uploadedAt: new Date().toISOString() })));
    } catch (err) {
      console.error(err);
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Company Policy</h1>
            <p className="text-sm text-muted-foreground mt-1">Upload and manage your company's policy documents here. Keep them accessible to HR and team members.</p>
          </div>
          <div className="text-right">
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'Info', description: 'You can upload PDF/DOC/DOCX files up to 10MB.' })}>
              Need help?
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Upload Policy Document</h2>
            <p className="text-sm text-gray-600 mb-4">Drag & drop a file here or click to choose a document. We'll keep a history of uploaded policies.</p>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center flex-col">
                <Upload className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-lg font-medium">Drop file here</p>
                <p className="text-sm text-gray-500 mt-2">PDF, DOC, DOCX · Max 10MB</p>
                <input id="policy_file" type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFiles(e.target.files)} className="hidden" />
                <div className="mt-4">
                  <Button onClick={handleChoose} variant="default">Choose file</Button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Files to upload</h3>
              {files.length === 0 ? (
                <div className="text-sm text-gray-500">No files added yet.</div>
              ) : (
                <div className="space-y-3">
                  {files.map((f) => (
                    <div key={f.id} className="flex items-center justify-between border rounded p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-primary" />
                        <div>
                          <div className="font-medium">{f.file.name}</div>
                          <div className="text-xs text-muted-foreground">{(f.file.size / 1024 / 1024).toFixed(2)} MB • {f.uploadedAt ? 'Ready' : 'Not uploaded'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {f.url && (
                          <a className="text-sm text-primary hover:underline flex items-center gap-2" href={f.url} target="_blank" rel="noreferrer">
                            <Download className="h-4 w-4" /> Preview
                          </a>
                        )}
                        <Button variant="outline" size="sm" onClick={() => removeFile(f.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button onClick={uploadAll} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Policy'}
              </Button>
              <Button variant="outline" onClick={() => setFiles([])} disabled={isUploading}>
                Clear
              </Button>
            </div>
          </div>

          <aside className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Policy Library</h3>
            <p className="text-sm text-gray-600 mb-4">Previously uploaded policies will appear here so team members can download or view them quickly.</p>

            <div className="space-y-3">
              {/* Mocked items: In a real app, fetch from API */}
              <div className="flex items-start justify-between border rounded p-3">
                <div>
                  <div className="font-medium">Employee Handbook 2024.pdf</div>
                  <div className="text-xs text-muted-foreground">Uploaded Apr 12, 2024</div>
                </div>
                <div className="flex items-center gap-2">
                  <a className="text-sm text-primary hover:underline flex items-center gap-2" href="#" onClick={(e)=>e.preventDefault()}>
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="flex items-start justify-between border rounded p-3">
                <div>
                  <div className="font-medium">Code of Conduct.pdf</div>
                  <div className="text-xs text-muted-foreground">Uploaded Jan 03, 2024</div>
                </div>
                <div className="flex items-center gap-2">
                  <a className="text-sm text-primary hover:underline flex items-center gap-2" href="#" onClick={(e)=>e.preventDefault()}>
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyPolicy;
