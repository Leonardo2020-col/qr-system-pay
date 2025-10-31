// src/components/QRScanner.jsx

import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, AlertCircle } from 'lucide-react';

const QRScanner = ({ onScan, onError }) => {
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [iniciando, setIniciando] = useState(true);

  useEffect(() => {
    if (!scannerRef.current) return;

    const iniciarScanner = async () => {
      try {
        // Verificar permisos de cámara primero
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
        };

        html5QrcodeScannerRef.current = new Html5QrcodeScanner(
          'qr-reader',
          config,
          false
        );

        html5QrcodeScannerRef.current.render(
          (decodedText) => {
            console.log('✅ QR escaneado:', decodedText);
            html5QrcodeScannerRef.current?.clear().catch(err => {
              console.warn('Error limpiando escáner:', err);
            });
            onScan?.(decodedText);
          },
          (error) => {
            // Errores normales del escaneo continuo - no mostrar
          }
        );

        setIniciando(false);
      } catch (error) {
        console.error('❌ Error accediendo a la cámara:', error);
        setPermisoDenegado(true);
        setIniciando(false);
        onError?.(error);
      }
    };

    iniciarScanner();

    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear().catch((error) => {
          console.error('Error limpiando escáner:', error);
        });
      }
    };
  }, [onScan, onError]);

  if (permisoDenegado) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-red-50 border-2 border-red-200 rounded-lg">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle size={64} className="text-red-500" />
          <h3 className="text-xl font-bold text-red-800">
            Permiso de Cámara Denegado
          </h3>
          <p className="text-sm text-red-700">
            Para escanear códigos QR, necesitamos acceso a tu cámara.
          </p>
          <div className="text-xs text-red-600 mt-2">
            <p className="font-semibold mb-2">Cómo habilitar la cámara:</p>
            <ol className="text-left list-decimal list-inside space-y-1">
              <li>Ve a la configuración de tu navegador</li>
              <li>Busca "Permisos" o "Privacidad"</li>
              <li>Encuentra "Cámara"</li>
              <li>Permite el acceso para este sitio</li>
              <li>Recarga la página</li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }

  if (iniciando) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-indigo-50 border-2 border-indigo-200 rounded-lg">
        <div className="flex flex-col items-center gap-4 text-center">
          <Camera size={64} className="text-indigo-500 animate-pulse" />
          <h3 className="text-xl font-bold text-indigo-800">
            Iniciando cámara...
          </h3>
          <p className="text-sm text-indigo-700">
            Por favor, espera un momento
          </p>
        </div>
      </div>
    );
  }

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
        #qr-reader__scan_region {
          border: 2px solid #6366f1 !important;
        }
      `}</style>
      <p className="text-center mt-4 text-sm text-gray-600">
        📱 Coloca el código QR dentro del marco
      </p>
    </div>
  );
};

export default QRScanner;