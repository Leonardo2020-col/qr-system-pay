// src/components/QRScannerApp.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, ArrowLeft, Camera, Home, Video, User } from 'lucide-react';
import supabaseService from '../services/supabaseService';

const QRScannerApp = ({ onVolver }) => {
  const [persona, setPersona] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [scannerStarted, setScannerStarted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices);
        const backCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('trasera')
        );
        setSelectedCamera(backCamera ? backCamera.id : devices[0].id);
      }
    }).catch(err => {
      console.error('Error obteniendo cámaras:', err);
    });
  }, []);

  const startScanning = async () => {
    if (!selectedCamera) {
      alert('Por favor selecciona una cámara');
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanError
      );

      setScannerStarted(true);
    } catch (err) {
      console.error('Error iniciando escáner:', err);
      alert('Error al iniciar la cámara. Verifica los permisos.');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scannerStarted) {
      try {
        await scannerRef.current.stop();
        setScannerStarted(false);
      } catch (err) {
        console.error('Error deteniendo escáner:', err);
      }
    }
  };

  const onScanSuccess = async (decodedText) => {
    try {
      const personaData = JSON.parse(decodedText);
      
      // Buscar la foto en Supabase usando el DNI
      console.log('🔍 Buscando foto para DNI:', personaData.dni);
      const personaCompleta = await supabaseService.buscarPorDNI(personaData.dni);
      
      if (personaCompleta && personaCompleta.foto_url) {
        personaData.foto = personaCompleta.foto_url;
        console.log('✅ Foto encontrada:', personaCompleta.foto_url);
      } else {
        console.log('⚠️ No se encontró foto para este DNI');
      }
      
      setPersona(personaData);
      setScanning(false);
      setImageError(false);
      setImageLoaded(false);
      stopScanning();
    } catch (error) {
      console.error('Error al parsear QR:', error);
      alert('Código QR inválido. Intenta de nuevo.');
    }
  };

  const onScanError = (err) => {
    // Ignorar errores de escaneo continuo
  };

  const handleReset = async () => {
    await stopScanning();
    setPersona(null);
    setScanning(false);
    setScannerStarted(false);
    setImageError(false);
    setImageLoaded(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  // Vista: Mostrar información de la persona
  if (persona) {
    const empadronado = persona.empadronado || false;
    const tieneFoto = persona.foto && persona.foto.trim() !== '';
    const esUrlSupabase = tieneFoto && (persona.foto.includes('supabase') || persona.foto.startsWith('http'));

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 hover:opacity-80 transition bg-white/20 px-3 py-2 rounded-lg text-sm"
                >
                  <ArrowLeft size={18} />
                  <span className="hidden sm:inline">Escanear otro</span>
                </button>
                {onVolver && (
                  <button
                    onClick={onVolver}
                    className="flex items-center gap-2 hover:opacity-80 transition bg-white/20 px-3 py-2 rounded-lg text-sm"
                  >
                    <Home size={18} />
                    <span className="hidden sm:inline">Inicio</span>
                  </button>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold">Información del Cliente</h1>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Foto y Nombre */}
              <div className="text-center pb-4 border-b-2 border-gray-100">
                <div className="mb-4 flex justify-center relative">
                  {tieneFoto && !imageError ? (
                    <>
                      {/* Skeleton loader mientras carga */}
                      {!imageLoaded && (
                        <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse"></div>
                      )}
                      <img 
                        src={persona.foto} 
                        alt={persona.nombre}
                        className={`w-32 h-32 rounded-full object-cover border-4 border-indigo-200 shadow-lg transition-opacity duration-300 ${
                          imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
                        }`}
                        onError={(e) => {
                          console.error('❌ Error cargando imagen:', persona.foto);
                          setImageError(true);
                          setImageLoaded(true);
                        }}
                        onLoad={() => {
                          console.log('✅ Imagen cargada correctamente');
                          setImageError(false);
                          setImageLoaded(true);
                        }}
                      />
                    </>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                      {persona.nombre ? (
                        <span className="text-5xl font-bold">
                          {persona.nombre.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <User size={48} />
                      )}
                    </div>
                  )}
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                  {persona.nombre}
                </h2>
                <p className="text-gray-500 font-medium">DNI: {persona.dni}</p>
              </div>

              {/* Información detallada */}
              <div className="space-y-3">
                {persona.email && persona.email.trim() !== '' && (
                  <InfoRow label="Email" value={persona.email} />
                )}
                <InfoRow label="Teléfono" value={persona.telefono} />
                <InfoRow label="Monto pagado" value={`S/ ${persona.monto}`} large />
              </div>

              {/* Estado de empadronamiento */}
              <div className={`rounded-2xl p-6 md:p-8 text-center shadow-lg ${
                empadronado
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-400' 
                  : 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-400'
              }`}>
                {empadronado ? (
                  <>
                    <CheckCircle size={56} className="mx-auto text-green-600 mb-3 md:mb-4" />
                    <h3 className="text-2xl md:text-3xl font-bold text-green-800 mb-2">
                      ¡EMPADRONADO!
                    </h3>
                    <p className="text-green-700 font-medium text-base md:text-lg">
                      Cliente en situación regular
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle size={56} className="mx-auto text-red-600 mb-3 md:mb-4" />
                    <h3 className="text-2xl md:text-3xl font-bold text-red-800 mb-2">
                      NO EMPADRONADO
                    </h3>
                    <p className="text-red-700 font-medium text-base md:text-lg">
                      Requiere empadronamiento
                    </p>
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
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition font-medium"
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
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              📷 Escanea el código QR
            </h2>
            
            <p className="text-center text-gray-600 mb-6">
              {scannerStarted ? 'Coloca el código QR frente a la cámara' : 'Selecciona una cámara y comienza'}
            </p>
            
            {/* Área del escáner */}
            <div id="qr-reader" className="rounded-xl overflow-hidden mb-6 bg-gray-100" style={{ minHeight: '250px' }}></div>
            
            {/* Selector de cámara */}
            {cameras.length > 0 && !scannerStarted && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Cámara:
                </label>
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || `Cámara ${camera.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botones de acción */}
            <div className="space-y-3">
              {!scannerStarted ? (
                <button
                  onClick={startScanning}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-4 rounded-lg hover:bg-green-700 transition font-bold text-lg shadow-md"
                >
                  <Video size={24} />
                  Iniciar Escaneo
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-4 rounded-lg hover:bg-red-700 transition font-bold text-lg shadow-md"
                >
                  <XCircle size={24} />
                  Detener Escaneo
                </button>
              )}
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>💡 Consejo:</strong> Mantén el código QR estable y con buena iluminación para un escaneo rápido.
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
              className="flex items-center gap-2 text-gray-600 hover:text-gray-700 transition mb-4 mx-auto"
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
            Verifica el estado de empadronamiento al instante
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setScanning(true)}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-5 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition font-bold text-xl shadow-lg"
          >
            <Camera size={24} className="inline mr-2" />
            Abrir Escáner de Cámara
          </button>
        </div>

        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-5">
          <p className="font-semibold text-indigo-900 mb-2">
            📱 Instrucciones:
          </p>
          <ol className="text-sm text-indigo-800 space-y-1 list-decimal list-inside">
            <li>Toca "Abrir Escáner de Cámara"</li>
            <li>Selecciona la cámara que deseas usar</li>
            <li>Presiona "Iniciar Escaneo"</li>
            <li>Apunta al código QR del cliente</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para filas de información
const InfoRow = ({ label, value, large }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-100">
    <span className="text-gray-600 font-medium text-sm md:text-base">{label}:</span>
    <span className={`font-bold text-gray-800 text-right ${large ? 'text-xl md:text-2xl text-indigo-600' : 'text-sm md:text-base'} break-words max-w-[60%]`}>
      {value}
    </span>
  </div>
);

export default QRScannerApp;