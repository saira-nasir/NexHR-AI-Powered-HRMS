import { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { WebcamCapture } from '@/components/attendance/WebcamCapture';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiPostFormData, apiPost, apiGet } from '@/lib/api';
import { toast } from 'sonner';
import { Upload, Camera, CheckCircle2, MapPin, Settings } from 'lucide-react';
import { employeeService, Employee } from '@/services/employeeService';

const RegisterFace = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Employee selection state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // Company location state
  const [companyLatitude, setCompanyLatitude] = useState<string>('');
  const [companyLongitude, setCompanyLongitude] = useState<string>('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      setEmployeesLoading(true);
      try {
        const employeeList = await employeeService.getEmployees();
        setEmployees(employeeList);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
        toast.error('Failed to load employees');
      } finally {
        setEmployeesLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch company location settings
  useEffect(() => {
    const fetchCompanyLocation = async () => {
      setLocationLoading(true);
      try {
        const response = await apiGet('/company/location/');
        if (response.latitude && response.longitude) {
          setCompanyLatitude(response.latitude.toString());
          setCompanyLongitude(response.longitude.toString());
        }
      } catch (error) {
        console.log('Company location not set yet or failed to fetch');
      } finally {
        setLocationLoading(false);
      }
    };
    fetchCompanyLocation();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSaveCompanyLocation = async () => {
    if (!companyLatitude || !companyLongitude) {
      toast.error('Please enter both latitude and longitude');
      return;
    }

    setLocationSaving(true);
    try {
      await apiPost('/company/location/', {
        latitude: parseFloat(companyLatitude),
        longitude: parseFloat(companyLongitude),
      });
      toast.success('Company location saved successfully');
    } catch (error: any) {
      toast.error('Failed to save company location', {
        description: error.response?.data?.detail || 'Please try again',
      });
    } finally {
      setLocationSaving(false);
    }
  };

  const handleRegister = async (file: File) => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('reference_image', file);
      formData.append('employee_id', selectedEmployeeId);

      // ✅ IMPORTANT: This endpoint should ONLY register the face, NOT check in
      // If you're being automatically checked in, the backend /attendance/register-face/ endpoint
      // is creating a check-in record, which it should NOT do.
      // Registration and check-in are separate operations:
      // - Registration: /attendance/register-face/ (this endpoint)
      // - Check-in: /attendance/mark-attendance-face/ (separate endpoint)
      const response = await apiPostFormData('/attendance/register-face/', formData);

      // Backend returns: { created, employee, reference_image_url, message }
      setIsRegistered(true);
      toast.success('Face Registered Successfully', {
        description: response.message || 'Your face has been registered in the system. You can now use it to check in.',
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
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="camera">
              <Camera className="mr-2 h-4 w-4" />
              Use Camera
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Employee Selection - Show on all tabs */}
          <Card className="shadow-lg mt-4">
            <CardHeader>
              <CardTitle>Select Employee</CardTitle>
              <CardDescription>
                Choose the employee for face registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                {employeesLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.fname} {emp.lname} ({emp.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

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

          <TabsContent value="settings" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Company Location Settings
                </CardTitle>
                <CardDescription>
                  Set the official company coordinates for attendance geolocation verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {locationLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="any"
                          placeholder="e.g., 40.7128"
                          value={companyLatitude}
                          onChange={(e) => setCompanyLatitude(e.target.value)}
                          disabled={locationSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="any"
                          placeholder="e.g., -74.0060"
                          value={companyLongitude}
                          onChange={(e) => setCompanyLongitude(e.target.value)}
                          disabled={locationSaving}
                        />
                      </div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        💡 <strong>Tip:</strong> You can get coordinates from Google Maps by right-clicking on your company location.
                      </p>
                    </div>
                    <Button
                      onClick={handleSaveCompanyLocation}
                      disabled={locationSaving || !companyLatitude || !companyLongitude}
                      className="w-full"
                    >
                      {locationSaving ? 'Saving...' : 'Save Company Location'}
                    </Button>
                  </>
                )}
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

