import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WebcamCapture } from '@/components/attendance/WebcamCapture';
import { toast } from 'sonner';
import { Camera, MapPin, Upload, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { employeeService, Employee } from '@/services/employeeService';
import { apiPostFormData, apiPost, apiGet } from '@/lib/api';

/**
 * System Settings Content Component
 * Provides centralized access to:
 * - Face Registration for employees
 * - Company Location/Geofencing configuration
 */
const SystemSettingsContent: React.FC = () => {
    // Face Registration State
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [showWebcam, setShowWebcam] = useState(false);

    // Company Location State
    const [companyLocation, setCompanyLocation] = useState({
        latitude: '',
        longitude: '',
        address: ''
    });
    const [isSavingLocation, setIsSavingLocation] = useState(false);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Fetch employees on mount
    useEffect(() => {
        fetchEmployees();
        fetchCompanyLocation();
    }, []);

    const fetchEmployees = async () => {
        try {
            // FIX: Changed from listEmployees to getEmployees
            const data = await employeeService.getEmployees();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Failed to load employees');
        }
    };

    const fetchCompanyLocation = async () => {
        try {
            const response = await apiGet('/company/location/');
            if (response) {
                setCompanyLocation({
                    latitude: response.latitude?.toString() || '',
                    longitude: response.longitude?.toString() || '',
                    address: response.address || ''
                });
                setLocationStatus('success');
            }
        } catch (error: any) {
            // 404 means location not set yet, which is fine
            if (error?.response?.status !== 404) {
                console.error('Error fetching company location:', error);
            }
        }
    };

    // Face Registration Handlers
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadedFile(e.target.files[0]);
        }
    };

    const handleRegisterFace = async (file: File) => {
        if (!selectedEmployeeId) {
            toast.error('Please select an employee');
            return;
        }

        setIsRegistering(true);
        try {
            const formData = new FormData();
            formData.append('reference_image', file);
            formData.append('employee_id', selectedEmployeeId);

            await apiPostFormData('/attendance/register-face/', formData);

            toast.success('Face registered successfully!', {
                description: 'Employee face has been registered for attendance tracking'
            });

            setUploadedFile(null);
            setSelectedEmployeeId('');
            setShowWebcam(false);
        } catch (error: any) {
            console.error('Error registering face:', error);
            toast.error('Failed to register face', {
                description: error?.response?.data?.error || 'Please try again'
            });
        } finally {
            setIsRegistering(false);
        }
    };

    const handleWebcamCapture = (file: File) => {
        handleRegisterFace(file);
    };

    const handleUploadSubmit = () => {
        if (uploadedFile) {
            handleRegisterFace(uploadedFile);
        }
    };

    // Company Location Handlers
    const handleLocationChange = (field: string, value: string) => {
        setCompanyLocation(prev => ({ ...prev, [field]: value }));
        setLocationStatus('idle');
    };

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            toast.info('Getting your location...');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCompanyLocation(prev => ({
                        ...prev,
                        latitude: position.coords.latitude.toString(),
                        longitude: position.coords.longitude.toString()
                    }));
                    toast.success('Location captured successfully!');
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    toast.error('Failed to get location', {
                        description: 'Please enable location services or enter coordinates manually'
                    });
                }
            );
        } else {
            toast.error('Geolocation not supported', {
                description: 'Please enter coordinates manually'
            });
        }
    };

    const handleSaveCompanyLocation = async () => {
        if (!companyLocation.latitude || !companyLocation.longitude) {
            toast.error('Please provide latitude and longitude');
            return;
        }

        setIsSavingLocation(true);
        try {
            await apiPost('/company/location/', {
                latitude: parseFloat(companyLocation.latitude),
                longitude: parseFloat(companyLocation.longitude),
                address: companyLocation.address
            });

            toast.success('Company location saved successfully!', {
                description: 'Geofencing is now active for attendance tracking'
            });
            setLocationStatus('success');
        } catch (error: any) {
            console.error('Error saving company location:', error);
            toast.error('Failed to save location', {
                description: error?.response?.data?.error || 'Please try again'
            });
            setLocationStatus('error');
        } finally {
            setIsSavingLocation(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Face Registration Section */}
            <Card className="border-primary/20 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Camera className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Face Registration</CardTitle>
                            <CardDescription>Register employee faces for biometric attendance tracking</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Employee Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="employee-select">Select Employee</Label>
                        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                            <SelectTrigger id="employee-select" className="w-full">
                                <SelectValue placeholder="Choose an employee..." />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map((employee) => (
                                    <SelectItem key={employee.id} value={employee.id.toString()}>
                                        {employee.first_name} {employee.last_name} - {employee.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Webcam or Upload Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Webcam Capture */}
                        <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
                            <CardContent className="pt-6">
                                <div className="text-center space-y-4">
                                    <div className="flex justify-center">
                                        <div className="p-4 rounded-full bg-primary/10">
                                            <Camera className="h-8 w-8 text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Capture with Webcam</h3>
                                        <p className="text-sm text-muted-foreground">Take a photo using your camera</p>
                                    </div>
                                    <Button
                                        onClick={() => setShowWebcam(!showWebcam)}
                                        variant={showWebcam ? "secondary" : "default"}
                                        className="w-full"
                                        disabled={!selectedEmployeeId}
                                    >
                                        {showWebcam ? 'Close Camera' : 'Open Camera'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* File Upload */}
                        <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
                            <CardContent className="pt-6">
                                <div className="text-center space-y-4">
                                    <div className="flex justify-center">
                                        <div className="p-4 rounded-full bg-primary/10">
                                            <Upload className="h-8 w-8 text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Upload Photo</h3>
                                        <p className="text-sm text-muted-foreground">Select an image from your device</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            disabled={!selectedEmployeeId}
                                            className="cursor-pointer"
                                        />
                                        {uploadedFile && (
                                            <Button
                                                onClick={handleUploadSubmit}
                                                disabled={isRegistering}
                                                className="w-full"
                                            >
                                                {isRegistering ? 'Registering...' : 'Register Face'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Webcam Component */}
                    {showWebcam && selectedEmployeeId && (
                        <div className="border rounded-lg p-4 bg-muted/30">
                            <WebcamCapture
                                onCapture={handleWebcamCapture}
                                // FIX: Changed prop name from isProcessing to isLoading
                                isLoading={isRegistering}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Company Location / Geofencing Section */}
            <Card className="border-primary/20 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Company Location & Geofencing</CardTitle>
                            <CardDescription>Set your company's official location for attendance verification</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Status Indicator */}
                    {locationStatus === 'success' && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-900">Company location is configured</span>
                        </div>
                    )}
                    {locationStatus === 'error' && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="text-sm font-medium text-red-900">Failed to save location</span>
                        </div>
                    )}

                    {/* Get Current Location Button */}
                    <div>
                        <Button
                            onClick={handleGetCurrentLocation}
                            variant="outline"
                            className="w-full md:w-auto"
                        >
                            <MapPin className="h-4 w-4 mr-2" />
                            Use Current Location
                        </Button>
                    </div>

                    {/* Location Input Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="latitude">Latitude *</Label>
                            <Input
                                id="latitude"
                                type="number"
                                step="any"
                                placeholder="e.g., 40.7580"
                                value={companyLocation.latitude}
                                onChange={(e) => handleLocationChange('latitude', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="longitude">Longitude *</Label>
                            <Input
                                id="longitude"
                                type="number"
                                step="any"
                                placeholder="e.g., -73.9855"
                                value={companyLocation.longitude}
                                onChange={(e) => handleLocationChange('longitude', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address (Optional)</Label>
                        <Input
                            id="address"
                            type="text"
                            placeholder="e.g., 123 Main Street, New York, NY"
                            value={companyLocation.address}
                            onChange={(e) => handleLocationChange('address', e.target.value)}
                        />
                    </div>

                    {/* Map Preview (if coordinates are set) */}
                    {companyLocation.latitude && companyLocation.longitude && (
                        <div className="border rounded-lg overflow-hidden">
                            <iframe
                                width="100%"
                                height="300"
                                frameBorder="0"
                                style={{ border: 0 }}
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(companyLocation.longitude) - 0.01},${parseFloat(companyLocation.latitude) - 0.01},${parseFloat(companyLocation.longitude) + 0.01},${parseFloat(companyLocation.latitude) + 0.01}&layer=mapnik&marker=${companyLocation.latitude},${companyLocation.longitude}`}
                                allowFullScreen
                            />
                        </div>
                    )}

                    {/* Save Button */}
                    <Button
                        onClick={handleSaveCompanyLocation}
                        disabled={isSavingLocation || !companyLocation.latitude || !companyLocation.longitude}
                        className="w-full md:w-auto"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isSavingLocation ? 'Saving...' : 'Save Company Location'}
                    </Button>

                    {/* Info Box */}
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-sm text-blue-900">
                            <strong>Note:</strong> This location will be used to verify employee attendance.
                            Employees checking in/out will need to be within a certain radius of this location
                            (geofencing) for their attendance to be marked.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SystemSettingsContent;
