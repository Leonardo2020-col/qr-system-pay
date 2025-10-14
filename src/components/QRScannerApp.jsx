// src/components/QRScannerApp.jsx

import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle, XCircle, ArrowLeft, Camera, Home } from 'lucide-react';
import { verificarPagoAlDia, formatearFecha, diasDesdeUltimoPago } from '../utils/dateUtils';

const QRScannerApp = ({ onVolver }) => {
  const [persona, setPersona] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    if (scanning) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        'qr-reader',
        { 
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      html5QrcodeScanner.render(onScanSuccess, onScanError);
      setScanner(html5QrcodeScanner);

      function onScanSuccess(decodedText) {
        try {
          const personaData = JSON.parse(decodedText);
          setPersona(personaData);
          setScanning(false);
          html5QrcodeScanner.clear();
        } catch (error) {
          console.error('Error al parsear QR:', error);
          alert('Código QR inválido. Intenta de nuevo.');
        }
      }

      function onScanError(err) {
        // Ignorar errores de escaneo continuo
      }

      return () => {
        html5QrcodeScanner.clear().catch(err => {
          console.error('Error al limpiar escáner:', err);
        });
      };
    }
  }, [scanning]);

  const handleReset = () => {
    setPersona(null);
    setScanning(false);
    if (scanner) {
      scanner.clear();
    }
  };

  const handleManualInput = () => {
    const input = prompt('Pega el contenido del código QR (JSON):');
    if (input) {
      try {
        const personaData = JSON.parse(input);
        setPersona(personaData);
      } catch (error) {
        alert('Formato inválido. Debe ser un JSON válido.');
      }
    }
  };

  // Vista: Mostrar información de la persona
  if (persona) {
    const alDia = verificarPagoAlDia(persona.ultimoPago);
    const dias = diasDesdeUltimoPago(persona.ultimoPago);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 hover:opacity-80 transition bg-white/20 px-3 py-2 rounded-lg"
                >
                  <ArrowLeft size={20} />
                  Escanear otro
                </button>
                {onVolver && (
                  <button
                    onClick={onVolver}
                    className="flex items-center gap-2 hover:opacity-80 transition bg-white/20 px-3 py-2 rounded-lg"
                  >
                    <Home size={20} />
                    Inicio
                  </button>
                )}
              </div>
              <h1 className="text-2xl font-bold">Información del Cliente</h1>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Nombre */}
              <div className="text-center pb-4 border-b-2 border-gray-100">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {persona.nombre}
                </h2>
                <p className="text-gray-500 font-medium">DNI: {persona.dni}</p>
              </div>

              {/* Información detallada */}
              <div className="space-y-3">
                <InfoRow label="Email" value={persona.email} />
                <InfoRow label="Teléfono" value={persona.telefono} />
                <InfoRow label="Último Pago" value={formatearFecha(persona.ultimoPago)} />
                {dias !== null && (
                  <InfoRow 
                    label="Días desde último pago" 
                    value={`${dias} ${dias === 1 ? 'día' : 'días'}`} 
                  />
                )}
                <InfoRow label="Monto pagado" value={`S/ ${persona.monto}`} large />
              </div>

              {/* Estado de pago */}
              <div className={`rounded-2xl p-8 text-center shadow-lg ${
                alDia 
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-400' 
                  : 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-400'
              }`}>
                {alDia ? (
                  <>
                    <CheckCircle size={64} className="mx-auto text-green-600 mb-4" />
                    <h3 className="text-3xl font-bold text-green-800 mb-2">
                      ¡PAGOS AL DÍA!
                    </h3>
                    <p className="text-green-700 font-medium text-lg">
                      Cliente en situación regular
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle size={64} className="mx-auto text-red-600 mb-4" />
                    <h3 className="text-3xl font-bold text-red-800 mb-2">
                      PAGO PENDIENTE
                    </h3>
                    <p className="text-red-700 font-medium text-lg">
                      Requiere actualización de pago
                    </p>
                    {dias > 30 && (
                      <div className="mt-4 bg-red-200 rounded-lg p-3">
                        <p className="text-red-800 text-xl font-bold">
                          ⚠️ Mora: {dias - 30} días
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Estado del QR */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>Estado registrado:</strong> {persona.estado}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 text-center border-t">
              <p className="text-xs text-gray-500">
                Escaneado: {new Date().toLocaleString('es-PE')}
              </p>
              {persona.fechaGeneracion && (
                <p className="text-xs text-gray-400 mt-1">
                  QR generado: {new Date(persona.fechaGeneracion).toLocaleString('es-PE')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista: Escaneando
  if (scanning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex gap-2 mb-6">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition"
              >
                <ArrowLeft size={20} />
                Cancelar
              </button>
              {onVolver && (
                <button
                  onClick={onVolver}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-700 transition"
                >
                  <Home size={20} />
                  Inicio
                </button>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              📷 Escanea el código QR
            </h2>
            
            <div id="qr-reader" className="rounded-xl overflow-hidden mb-4"></div>
            
            <div className="space-y-3">
              <p className="text-center text-gray-600">
                Coloca el código QR frente a la cámara
              </p>

              <button
                onClick={handleManualInput}
                className="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                📝 Ingresar código manualmente
              </button>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Tip:</strong> Asegúrate de tener buena iluminación y mantén el código QR estable.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista: Inicio del escáner
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          {onVolver && (
            <button
              onClick={onVolver}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-700 transition mb-4"
            >
              <Home size={20} />
              Volver al inicio
            </button>
          )}
          
          <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Camera size={48} className="text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Escáner QR
          </h1>
          <p className="text-gray-600 text-lg">
            Verifica pagos al instante
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setScanning(true)}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-5 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition font-bold text-xl shadow-lg"
          >
            <Camera size={24} className="inline mr-2" />
            Iniciar Escaneo
          </button>

          <button
            onClick={handleManualInput}
            className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition font-medium"
          >
            📝 Ingresar código manualmente
          </button>
        </div>

        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-5">
          <p className="font-semibold text-indigo-900 mb-2">
            📱 Instrucciones:
          </p>
          <ol className="text-sm text-indigo-800 space-y-1 list-decimal list-inside">
            <li>Toca "Iniciar Escaneo"</li>
            <li>Permite acceso a la cámara</li>
            <li>Apunta al código QR</li>
            <li>¡Listo! Verás la información</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para filas de información
const InfoRow = ({ label, value, large }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-100">
    <span className="text-gray-600 font-medium">{label}:</span>
    <span className={`font-bold text-gray-800 ${large ? 'text-2xl text-indigo-600' : 'text-base'}`}>
      {value}
    </span>
  </div>
);

export default QRScannerApp;