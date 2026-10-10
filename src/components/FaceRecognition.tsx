'use client';

import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';

interface FaceCaptureProps {
  onCapture: (base64Image: string) => void;
  buttonText?: string;
  scanButtonText?: string;
}

export default function FaceCapture({ 
  onCapture, 
  buttonText = "Capturer", 
  scanButtonText = "Scan"
}: FaceCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [captured, setCaptured] = useState(false);

  const startCamera = async () => {
    setCameraActive(true);
  };

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
      setCaptured(true);
      setCameraActive(false); // Arrêter la caméra après capture
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!cameraActive ? (
        <button
          onClick={startCamera}
          className="bg-[#c9a96e] text-white px-8 py-2 rounded-full hover:bg-[#b88a4a] transition-all duration-200 shadow-md"
        >
          {scanButtonText}
        </button>
      ) : (
        <>
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl border-2 border-[#c9a96e] shadow-md">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full object-cover"
              videoConstraints={{ facingMode: 'user' }}
            />
            <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-white bg-black/50 py-1">
              Positionnez votre visage
            </div>
          </div>
          <button
            onClick={capture}
            disabled={captured}
            className="bg-[#c9a96e] text-white px-8 py-2 rounded-full hover:bg-[#b88a4a] transition-all disabled:opacity-50"
          >
            {buttonText}
          </button>
        </>
      )}
    </div>
  );
}