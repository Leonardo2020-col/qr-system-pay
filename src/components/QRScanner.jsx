// src/components/QRScanner.jsx

import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScan, onError }) => {
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      rememberLastUsedCamera: true,
    };

    html5QrcodeScannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      config,
      false
    );

    html5QrcodeScannerRef.current.render(
      (decodedText) => {
        // Detener escáner al detectar un código
        html5QrcodeScannerRef.current?.clear();
        onScan?.(decodedText);
      },
      (error) => {
        // Errores silenciosos durante el escaneo continuo
        // console.warn('Error escaneando:', error);
      }
    );

    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear().catch((error) => {
          console.error('Error limpiando escáner:', error);
        });
      }
    };
  }, [onScan]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        id="qr-reader" 
        ref={scannerRef}
        className="rounded-lg overflow-hidden shadow-lg"
      />
      <style>{`
        #qr-reader {
          border: none !important;
        }
        #qr-reader__dashboard_section {
          display: none !important;
        }
        #qr-reader__camera_selection {
          margin: 10px 0 !important;
        }
        #qr-reader video {
          border-radius: 8px !important;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;