import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { WebcamCapture } from '@/components/attendance/WebcamCapture';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiPostFormData } from '@/lib/api';
import { toast } from 'sonner';
import { Upload, Camera, CheckCircle2 } from 'lucide-react';

const RegisterFace = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRegister = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('reference_image', file);
      
      const response = await apiPostFormData('/attendance/register-face/', formData);
      
      // Backend returns: { created, employee, reference_image_url, message }
      setIsRegistered(true);
      toast.success('Face Registered Successfully', {
        description: response.message || 'Your face has been registered in the system',
      });
    } catch (error: any) {
      // Handle different error formats from backend
      let errorMessage = 'Failed to register face. Please try again.';
      
      if (error.response?.data) {
        // Backend error formats:
        // 400: { error: "No image uploaded." }
        // 401: { detail: "Authentication credentials were not provided." }
        // Other: { message: "..." } or { detail: "..." }
        errorMessage = error.response.data.error || 
                      error.response.data.detail || 
                      error.response.data.message || 
                      errorMessage;
      }
      
      toast.error('Registration Failed', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebcamCapture = (file: File) => {
    handleRegister(file);
  };

  const handleUploadSubmit = () => {
    if (selectedFile) {
      handleRegister(selectedFile);
    }
  };

  if (isRegistered) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in bg-gradient-to-br from-background via-muted/5 to-background min-h-screen">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Register Your Face</h1>
            <p className="text-muted-foreground">Register your face to enable attendance marking via facial recognition</p>
          </div>
          <Card className="shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Registration Complete!</h2>
              <p className="text-muted-foreground mb-8">
                Your face has been successfully registered. You can now use the attendance marking system.
              </p>
              <Button onClick={() => setIsRegistered(false)}>
                Register Another Face
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in bg-gradient-to-br from-background via-muted/5 to-background min-h-screen">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Register Your Face</h1>
          <p className="text-muted-foreground text-lg">
            Register your face to enable attendance marking via facial recognition
          </p>
        </div>

        <Tabs defaultValue="camera" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="camera">
              <Camera className="mr-2 h-4 w-4" />
              Use Camera
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Capture from Camera</CardTitle>
                <CardDescription>
                  Position your face in the camera frame and capture a clear photo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WebcamCapture onCapture={handleWebcamCapture} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Upload Photo</CardTitle>
                <CardDescription>
                  Upload a clear photo of your face from your device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="photo">Select Photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isLoading}
                  />
                </div>

                {selectedFile && (
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm font-medium">Selected: {selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleUploadSubmit}
                  disabled={!selectedFile || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Registering...' : 'Register Face'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Instructions Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Registration Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Ensure good lighting on your face</li>
              <li>✓ Look directly at the camera</li>
              <li>✓ Remove any obstructions (glasses, hats, masks)</li>
              <li>✓ Use a neutral expression</li>
              <li>✓ Make sure your face is clearly visible</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RegisterFace;

