import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, RotateCcw, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface WebcamCaptureProps {
  onCapture: (file: File) => void;
  isLoading?: boolean;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, isLoading }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const mounted = useRef(true);
  const requestInProgress = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    console.error('❌ Camera error:', message);
    toast.error('Camera Error', { description: message, duration: 4000 });
  }, []);

  const stopCurrentStream = useCallback(async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const requestCamera = useCallback(async () => {
    if (requestInProgress.current) {
      console.log('⏳ Request already in progress');
      return;
    }

    requestInProgress.current = true;
    setCameraState('requesting');
    setErrorMessage('');

    try {
      await stopCurrentStream();

      if (!mounted.current) {
        requestInProgress.current = false;
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });
      } catch (e) {
        console.log('⚠️ High-res camera failed, retrying with basic constraints...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
      }

      if (!mounted.current) {
        stream.getTracks().forEach((track) => track.stop());
        requestInProgress.current = false;
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        try {
          await videoRef.current.play();
          console.log('✅ Video playing successfully');
        } catch (playError) {
          console.error('❌ Play error:', playError);
        }

        if (mounted.current) {
          setCameraState('active');
          setErrorMessage('');
          requestInProgress.current = false;
          console.log('✅ Camera state set to active');
        }
      }
    } catch (error: any) {
      console.error('❌ Camera access error:', error);

      if (!mounted.current) {
        requestInProgress.current = false;
    return;
      }

      let message = 'Could not access camera';
    
      if (error.name === 'NotAllowedError') {
        message = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        message = 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        message = 'Camera is in use by another application. Please close other apps using the camera and try again.';
      } else if (error.name === 'AbortError') {
        message = 'Camera request was cancelled. Please try again.';
      } else if (error.name === 'OverconstrainedError') {
        message = 'Camera does not meet requirements. Please try again.';
      }

      setCameraState('error');
      showError(message);
      requestInProgress.current = false;
    }
  }, [showError, stopCurrentStream]);

  useEffect(() => {
    mounted.current = true;
    requestInProgress.current = false;
    setCameraState('idle');
    setErrorMessage('');
    setImgSrc(null);

    return () => {
      mounted.current = false;
      stopCurrentStream();
    };
  }, [stopCurrentStream]);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      showError('Failed to capture image');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      showError('Failed to get canvas context');
      return;
    }

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          showError('Failed to process image');
          return;
        }

          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const imageSrc = canvas.toDataURL('image/jpeg');
        setImgSrc(imageSrc);
          onCapture(file);
      },
      'image/jpeg',
      0.95,
    );
  }, [onCapture, showError]);

  const retake = useCallback(() => {
          setImgSrc(null);
  }, []);

  const forceRefresh = useCallback(async () => {
    requestInProgress.current = false;

    setCameraState('idle');
    setErrorMessage('');
    setImgSrc(null);

    await stopCurrentStream();

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (mounted.current) {
      requestCamera();
    }
  }, [requestCamera, stopCurrentStream]);

  return (
    <Card className="p-6 shadow-lg">
      <div className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="relative rounded-lg overflow-hidden bg-muted aspect-video min-h-[300px]">
          {imgSrc ? (
            <img src={imgSrc || '/placeholder.svg'} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                  cameraState === 'active' ? 'opacity-100 z-20' : 'opacity-0'
                }`}
              />

              {cameraState === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted p-8 text-center z-10">
                  <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-2">Camera Access Required</p>
                  <p className="text-xs text-muted-foreground mb-4 max-w-xs">Click below to enable your camera</p>
                  <Button onClick={requestCamera} disabled={requestInProgress.current}>
                    <Camera className="mr-2 h-4 w-4" />
                    Enable Camera
                  </Button>
                </div>
              )}

              {cameraState === 'requesting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted p-8 text-center z-10">
                  <Camera className="w-12 h-12 text-muted-foreground mb-4 animate-pulse" />
                  <p className="text-sm font-medium mb-2">Starting Camera...</p>
                  <p className="text-xs text-muted-foreground mb-4">Please wait</p>
              <Button
                    onClick={async () => {
                      requestInProgress.current = false;
                      await stopCurrentStream();
                      setCameraState('idle');
                  setErrorMessage('');
                }}
                variant="outline"
                size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {cameraState === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted p-8 text-center z-10">
                  <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                  <p className="text-sm font-medium mb-2">Camera Error</p>
                  <p className="text-xs text-muted-foreground mb-4 max-w-xs">{errorMessage}</p>
                  <div className="flex gap-2">
                    <Button onClick={forceRefresh} variant="default" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
            </div>
              )}
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex gap-3">
          {imgSrc ? (
            <Button onClick={retake} variant="outline" disabled={isLoading} className="flex-1 bg-transparent">
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake
            </Button>
          ) : (
            cameraState === 'active' && (
              <>
                <Button onClick={capture} disabled={isLoading} className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              {isLoading ? 'Processing...' : 'Capture Photo'}
            </Button>
                <Button onClick={forceRefresh} variant="outline" size="icon" title="Refresh Camera">
                  <RefreshCw className="h-4 w-4" />
            </Button>
              </>
            )
          )}
        </div>
      </div>
    </Card>
  );
};
