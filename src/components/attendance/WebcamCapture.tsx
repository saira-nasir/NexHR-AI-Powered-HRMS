import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

// Simple global camera manager - ensures only one camera instance is active at a time
class CameraManager {
  private activeStream: MediaStream | null = null;
  private activeComponentId: string | null = null;

  // Register an existing stream (from Webcam component)
  registerStream(componentId: string, stream: MediaStream) {
    // If another component is using the camera, stop it first
    if (this.activeStream && this.activeComponentId !== componentId) {
      this.activeStream.getTracks().forEach(track => track.stop());
    }
    
    // Register this stream
    this.activeStream = stream;
    this.activeComponentId = componentId;
  }

  // Stop camera for a specific component
  stopCamera(componentId?: string) {
    if (this.activeStream && (!componentId || this.activeComponentId === componentId)) {
      this.activeStream.getTracks().forEach(track => track.stop());
      this.activeStream = null;
      this.activeComponentId = null;
    }
  }
}

// Global singleton instance
const cameraManager = new CameraManager();

interface WebcamCaptureProps {
  onCapture: (file: File) => void;
  isLoading?: boolean;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, isLoading }) => {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const streamRef = useRef<MediaStream | null>(null); // Track the active stream
  const componentIdRef = useRef<string>(`camera-${Date.now()}-${Math.random()}`); // Unique ID for this component instance
  const location = useLocation(); // Track route changes

  // Check camera permission status on mount
  useEffect(() => {
    // Check if we already have permission by querying the permission API
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then((result) => {
          if (result.state === 'granted') {
            setHasPermission(true);
            setIsInitializing(false);
          } else {
            setIsInitializing(false);
          }
        })
        .catch(() => {
          // Permission API not supported, try direct access
          setIsInitializing(false);
        });
    } else {
      // Permission API not supported, will show request button
      setIsInitializing(false);
    }
  }, []);

  // Stop camera when route changes (component will unmount)
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts or route changes
      cameraManager.stopCamera(componentIdRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [location.pathname]);

  const handleUserMediaError = (error: string | DOMException) => {
    console.error('Camera error:', error);
    let message = 'Failed to access camera. Please check your camera permissions.';
    
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        message = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        message = 'No camera found. Please connect a camera and refresh the page.';
      } else if (error.name === 'NotReadableError' || error.name === 'AbortError') {
        message = 'Camera is being used by another application or browser tab. Please close other apps/tabs using the camera and refresh the page.';
      } else {
        message = `Camera error: ${error.message || error.name}`;
      }
    }
    
    setHasError(true);
    setErrorMessage(message);
    setHasPermission(false);
    toast.error('Camera Access Error', { description: message });
  };

  const requestCameraPermission = async () => {
    try {
      setIsRequestingPermission(true);
      setHasError(false);
      setErrorMessage('');
      
      // Request camera permission explicitly - this will trigger browser prompt
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately - Webcam component will start its own
      stream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      setIsRequestingPermission(false);
      setIsInitializing(true);
    } catch (error: any) {
      setIsRequestingPermission(false);
      handleUserMediaError(error);
    }
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
      
      // Convert base64 to File
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
        })
        .catch(error => {
          console.error('Error converting image:', error);
          toast.error('Error processing image', { 
            description: 'Failed to process the captured image. Please try again.' 
          });
          setImgSrc(null);
        });
    }
  }, [onCapture]);

  const retake = () => {
    setImgSrc(null);
    setHasError(false);
    setErrorMessage('');
  };


  return (
    <Card className="p-6 shadow-lg">
      <div className="space-y-4">
        <div className="relative rounded-lg overflow-hidden bg-muted aspect-video min-h-[300px]">
          {hasError ? (
            <div className="flex flex-col items-center justify-center h-full bg-muted p-8 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <p className="text-sm text-muted-foreground font-medium mb-2">Camera Error</p>
              <p className="text-xs text-muted-foreground mb-4 px-4">{errorMessage}</p>
              <Button
                onClick={() => {
                  setHasError(false);
                  setErrorMessage('');
                  setIsInitializing(true);
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          ) : imgSrc ? (
            <img src={imgSrc} alt="Captured" className="w-full h-full object-cover" />
          ) : !hasPermission ? (
            <div className="flex flex-col items-center justify-center h-full bg-muted p-8 text-center">
              <Camera className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground font-medium mb-2">Camera Access Required</p>
              <p className="text-xs text-muted-foreground mb-4 px-4">
                Click the button below to request camera permission
              </p>
              <Button
                onClick={requestCameraPermission}
                disabled={isRequestingPermission}
                className="w-full"
              >
                {isRequestingPermission ? 'Requesting Permission...' : 'Request Camera Access'}
              </Button>
            </div>
          ) : isInitializing ? (
            <div className="flex flex-col items-center justify-center h-full bg-muted p-8 text-center">
              <Camera className="w-12 h-12 text-muted-foreground mb-4 animate-pulse" />
              <p className="text-sm text-muted-foreground font-medium mb-2">Initializing Camera...</p>
              <p className="text-xs text-muted-foreground">Please wait...</p>
            </div>
          ) : (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={{
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                facingMode: 'user',
              }}
              onUserMedia={(stream) => {
                console.log('Camera stream received:', stream);
                // Register stream with camera manager
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach(track => track.stop());
                }
                cameraManager.registerStream(componentIdRef.current, stream);
                streamRef.current = stream;
                setHasError(false);
                setErrorMessage('');
                setIsInitializing(false);
              }}
              onUserMediaError={(error) => {
                console.error('Camera initialization error:', error);
                setIsInitializing(false);
                handleUserMediaError(error);
              }}
              mirrored={true}
              forceScreenshotSourceSize={false}
            />
          )}
        </div>

        <div className="flex gap-3">
          {!imgSrc && !hasError ? (
            <Button
              onClick={capture}
              disabled={isLoading}
              className="flex-1"
            >
              <Camera className="mr-2 h-4 w-4" />
              {isLoading ? 'Processing...' : 'Capture Photo'}
            </Button>
          ) : imgSrc ? (
            <Button
              onClick={retake}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
};

