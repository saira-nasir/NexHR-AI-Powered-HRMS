import React, { useEffect, useState } from 'react';
import { Camera, User, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CameraViewProps {
  onRecognition: (employee: any) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onRecognition }) => {
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const detected = Math.random() > 0.5;
      setFaceDetected(detected);
      if (detected) {
        const mockEmployee = {
          id: Math.floor(Math.random() * 100),
          name: ['Sarah Johnson', 'Michael Chen', 'Emily Davis', 'James Wilson', 'Lisa Anderson'][Math.floor(Math.random() * 5)],
          department: ['Engineering', 'Marketing', 'HR', 'Sales', 'Finance'][Math.floor(Math.random() * 5)],
          employeeId: `EMP${Math.floor(Math.random() * 9000) + 1000}`,
          status: 'recognized'
        };
        onRecognition(mockEmployee);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [onRecognition]);

  return (
    <Card className="relative h-full overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-50" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
          <Camera className="w-4 h-4 text-blue-400" />
          <span className="text-white text-sm">Camera Active</span>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
        <Badge variant={faceDetected ? 'default' : 'secondary'} className="bg-black/60 backdrop-blur-sm">
          {faceDetected ? 'Face Detected' : 'Scanning...'}
        </Badge>
      </div>

      {faceDetected && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-2 border-blue-400 rounded-lg z-20">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse" />
        </div>
      )}

      {!faceDetected && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <User className="w-24 h-24 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Position your face in the frame</p>
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span>Ready for recognition</span>
        </div>
        <div className="text-gray-400 text-xs font-mono bg-black/60 backdrop-blur-sm px-3 py-1 rounded">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </Card>
  );
};

export default CameraView;


