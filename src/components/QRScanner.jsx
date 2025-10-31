// src/components/QRScanner.jsx

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, AlertCircle } from 'lucide-react';

const QRScanner = ({ onScan, onError }) => {
  const [error, setError] = useState(null);
  const [escaneando, setEscaneando] = useState(false);
  const html5QrcodeRef = useRef(null);

  useEffect(() => {
    let isActive = true;

    const iniciarScanner = async () => {
      try {
        // Crear instancia del escáner
        html5QrcodeRef.current = new Html5Qrcode("qr-reader");
        
        // Configuración del escáner
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        };

        // Iniciar el escáner
        await html5QrcodeRef.current.start(
          { facingMode: "environment" }, // Usar cámara trasera
          config,
          (decodedText) => {
            if (isActive) {
              console.log("✅ QR escaneado:", decodedText);
              detenerScanner();
              onScan?.(decodedText);
            }
          },
          (errorMessage) => {
            // Errores normales del escaneo continuo - ignorar
          }
        );

        setEscaneando(true);
      } catch (err) {
        console.error("❌ Error al iniciar el escáner:", err);
        setError(err.message || "No se pudo acceder a la cámara");
        onError?.(err);
      }
    };

    const detenerScanner = () => {
      if (html5QrcodeRef.current && escaneando) {
        html5QrcodeRef.current.stop().then(() => {
          console.log("🛑 Escáner detenido");
        }).catch((err) => {
          console.error("Error al detener el escáner:", err);
        });
      }
    };

    iniciarScanner();

    // Cleanup
    return () => {
      isActive = false;
      detenerScanner();
    };
  }, []);

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-red-50 border-2 border-red-200 rounded-lg">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle size={64} className="text-red-500" />
          <h3 className="text-xl font-bold text-red-800">
            Error al acceder a la cámara
          </h3>
          <p className="text-sm text-red-700">{error}</p>
          <div className="text-xs text-red-600 mt-2 text-left bg-white p-4 rounded">
            <p className="font-semibold mb-2">Posibles soluciones:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Asegúrate de dar permiso de cámara</li>
              <li>Verifica que ninguna otra app esté usando la cámara</li>
              <li>Recarga la página y vuelve a intentar</li>
              <li>Prueba con un navegador diferente (Chrome recomendado)</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        id="qr-reader" 
        className="rounded-lg overflow-hidden shadow-lg border-4 border-indigo-200"
        style={{ minHeight: '300px' }}
      />
      <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <p className="text-sm text-indigo-800 text-center font-medium">
          📱 Apunta la cámara al código QR
        </p>
        <p className="text-xs text-indigo-600 text-center mt-2">
          El escaneo es automático
        </p>
      </div>
    </div>
  );
};

export default QRScanner;