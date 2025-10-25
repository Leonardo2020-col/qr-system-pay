// src/components/QRScannerApp.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, ArrowLeft, Camera, Home, Video, User, Upload } from 'lucide-react';
import supabaseService from '../services/supabaseService';

// ✅ Componente auxiliar para manejar carga de imágenes
const FotoPersona = ({ foto, nombre }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!foto || foto.trim() === '') {
    // Sin foto: mostrar inicial
    return (
      <div 
        style={{
          width: '128px',
          height: '128px',
          borderRadius: '50%',
          background: 'linear-gradient(to bottom right, rgb(129, 140, 248), rgb(79, 70, 229))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <span style={{ fontSize: '3rem', fontWeight: 'bold' }}>
          {nombre.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <>
      {loading && !error && (
        <div 
          style={{
            width: '128px',
            height: '128px',
            borderRadius: '50%',
            background: 'linear-gradient(to bottom right, rgb(229, 231, 235), rgb(209, 213, 219))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '4px solid rgb(199, 210, 254)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div 
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid rgba(79, 70, 229, 0.3)',
              borderTop: '4px solid rgb(79, 70, 229)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
        </div>
      )}
      
      {error ? (
        <div 
          style={{
            width: '128px',
            height: '128px',
            borderRadius: '50%',
            background: 'linear-gradient(to bottom right, rgb(129, 140, 248), rgb(79, 70, 229))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}
        >
          <span style={{ fontSize: '3rem', fontWeight: 'bold' }}>
            {nombre.charAt(0).toUpperCase()}
          </span>
        </div>
      ) : (
        <img 
          src={foto}
          alt={nombre}
          onLoad={() => {
            console.log('✅ Imagen cargada');
            setLoading(false);
          }}
          onError={(e) => {
            console.error('❌ Error cargando imagen');
            setError(true);
            setLoading(false);
          }}
          style={{
            width: '128px',
            height: '128px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '4px solid rgb(199, 210, 254)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            display: loading ? 'none' : 'block'
          }}
        />
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

const QRScannerApp = ({ onVolver }) => {
  const [persona, setPersona] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [scannerStarted, setScannerStarted] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [currentDNI, setCurrentDNI] = useState(null);
  const [camerasLoading, setCamerasLoading] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ Cargar cámaras al montar el componente
  useEffect(() => {
    const getCameras = async () => {
      try {
        setCamerasLoading(true);
        setCameraError(null);
        
        const devices = await Html5Qrcode.getCameras();
        
        if (devices && devices.length > 0) {
          setCameras(devices);
          
          // Buscar cámara trasera primero
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('trasera') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          
          setSelectedCamera(backCamera ? backCamera.id : devices[0].id);
          console.log('✅ Cámaras encontradas:', devices.length);
        } else {
          setCameraError('No se encontraron cámaras disponibles');
          console.warn('⚠️ No hay cámaras disponibles');
        }
      } catch (err) {
        console.error('❌ Error obteniendo cámaras:', err);
        setCameraError('Error al acceder a la cámara. Verifica los permisos.');
      } finally {
        setCamerasLoading(false);
      }
    };

    getCameras();
  }, []);

  const startScanning = async () => {
    if (!selectedCamera) {
      alert('Por favor selecciona una cámara');
      return;
    }

    try {
      // ✅ Limpiar escáner previo si existe
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        } catch (e) {
          console.log('No había escáner previo activo');
        }
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      // ✅ Configuración optimizada para móviles
      const config = {
        fps: 10,
        qrbox: function(viewfinderWidth, viewfinderHeight) {
          // Calcula el tamaño del cuadro de escaneo dinámicamente
          let minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          let qrboxSize = Math.floor(minEdge * 0.7);
          return {
            width: qrboxSize,
            height: qrboxSize
          };
        },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        selectedCamera,
        config,
        onScanSuccess,
        onScanError
      );

      setScannerStarted(true);
      setScanning(true);
      console.log('✅ Escáner iniciado correctamente');
    } catch (err) {
      console.error('❌ Error iniciando escáner:', err);
      
      // ✅ Mensajes de error específicos
      if (err.name === 'NotAllowedError') {
        alert('⚠️ Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.');
      } else if (err.name === 'NotFoundError') {
        alert('⚠️ No se encontró ninguna cámara en tu dispositivo.');
      } else if (err.name === 'NotReadableError') {
        alert('⚠️ La cámara está siendo usada por otra aplicación. Cierra otras apps y vuelve a intentar.');
      } else if (err.name === 'OverconstrainedError') {
        alert('⚠️ No se pudo iniciar la cámara con la configuración solicitada.');
      } else {
        alert('❌ Error al iniciar la cámara: ' + err.message);
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scannerStarted) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        setScannerStarted(false);
        setScanning(false);
        console.log('✅ Escáner detenido');
      } catch (err) {
        console.error('❌ Error deteniendo escáner:', err);
      }
    }
  };

  const onScanSuccess = async (decodedText) => {
    try {
      const personaData = JSON.parse(decodedText);
      
      if (currentDNI === personaData.dni) {
        console.log('⚠️ DNI ya procesado, ignorando duplicado');
        return;
      }
      
      console.log('📋 Datos del QR:', personaData);
      
      // ✅ Buscar persona completa en Supabase
      try {
        const personaCompleta = await supabaseService.buscarPorDNI(personaData.dni);
        
        if (personaCompleta) {
          console.log('✅ Persona encontrada en Supabase');
          
          // ✅ Usar foto de Supabase si existe
          if (personaCompleta.foto_url && personaCompleta.foto_url.trim() !== '') {
            let fotoUrl = personaCompleta.foto_url.trim();
            
            // Forzar HTTPS
            if (fotoUrl.startsWith('http:')) {
              fotoUrl = fotoUrl.replace('http:', 'https:');
            }
            
            personaData.foto = fotoUrl;
            console.log('🖼️ Foto URL:', fotoUrl);
          } else {
            console.log('⚠️ Persona encontrada pero sin foto');
            personaData.foto = null;
          }
        } else {
          console.log('⚠️ Persona no encontrada en Supabase');
          personaData.foto = null;
        }
      } catch (fotoError) {
        console.error('❌ Error buscando en Supabase:', fotoError);
        personaData.foto = null;
      }
      
      // ✅ Establecer DNI y persona
      setCurrentDNI(personaData.dni);
      setPersona(personaData);
      setScanning(false);
      
      await stopScanning();
    } catch (error) {
      console.error('❌ Error al parsear QR:', error);
      alert('Código QR inválido. Por favor, intenta de nuevo.');
    }
  };

  const onScanError = (err) => {
    // Ignorar errores de escaneo continuo para no saturar la consola
  };

  const handleReset = async () => {
    await stopScanning();
    setPersona(null);
    setCurrentDNI(null);
    setScanning(false);
    setScannerStarted(false);
    setProcessingImage(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    setProcessingImage(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-file-reader');
      
      const result = await html5QrCode.scanFile(file, true);
      
      await onScanSuccess(result);
      
      html5QrCode.clear();
    } catch (error) {
      console.error('❌ Error escaneando imagen:', error);
      alert('No se pudo leer el código QR de la imagen. Intenta con otra imagen más clara.');
    } finally {
      setProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  // ========================================
  // VISTA: Mostrar información de la persona
  // ========================================
  if (persona) {
    const empadronado = persona.empadronado || false;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
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

            <div className="p-6 space-y-6">
              <div className="text-center pb-4 border-b-2 border-gray-100">
                <div className="mb-4 flex justify-center items-center">
                  <FotoPersona foto={persona.foto} nombre={persona.nombre} />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                  {persona.nombre}
                </h2>
                <p className="text-gray-500 font-medium">DNI: {persona.dni}</p>
              </div>

              <div className="space-y-3">
                {persona.email && persona.email.trim() !== '' && (
                  <InfoRow label="Email" value={persona.email} />
                )}
                <InfoRow label="Teléfono" value={persona.telefono} />
                <InfoRow label="Monto pagado" value={`S/ ${persona.monto}`} large />
              </div>

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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>Estado registrado:</strong> {persona.estado}
                </p>
              </div>
            </div>

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

  // ========================================
  // VISTA: Escaneando
  // ========================================
  if (scanning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 hover:opacity-80 transition bg-white/20 px-3 py-2 rounded-lg text-sm"
                >
                  <ArrowLeft size={18} />
                  <span>Cancelar</span>
                </button>
                {onVolver && (
                  <button
                    onClick={onVolver}
                    className="flex items-center gap-2 hover:opacity-80 transition bg-white/20 px-3 py-2 rounded-lg text-sm ml-auto"
                  >
                    <Home size={18} />
                    <span>Inicio</span>
                  </button>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold">Escaneando QR</h1>
            </div>

            <div className="p-6">
              <div id="qr-reader" className="rounded-xl overflow-hidden mb-4"></div>
              
              {/* ✅ Selector de cámara solo si hay múltiples */}
              {cameras.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar cámara:
                  </label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    disabled={scannerStarted}
                  >
                    {cameras.map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.label || `Cámara ${camera.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <Camera size={32} className="mx-auto text-blue-600 mb-2" />
                <p className="text-sm text-blue-700 font-medium">
                  Apunta la cámara al código QR
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  La detección es automática
                </p>
              </div>
            </div>
          </div>
        </div>
        <div id="qr-file-reader" style={{ display: 'none' }}></div>
      </div>
    );
  }

  // ========================================
  // VISTA: Pantalla inicial
  // ========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
            {onVolver && (
              <button
                onClick={onVolver}
                className="flex items-center gap-2 hover:opacity-80 transition mb-4 bg-white/20 px-3 py-2 rounded-lg text-sm"
              >
                <Home size={18} />
                <span>Volver al inicio</span>
              </button>
            )}
            <h1 className="text-2xl md:text-3xl font-bold">Escáner de QR</h1>
            <p className="text-indigo-100 mt-2">Verifica el estado de empadronamiento</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center mb-4">
                <Camera size={48} className="text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Escanear código QR
              </h2>
              <p className="text-gray-600 text-sm">
                Elige cómo deseas escanear el código
              </p>
            </div>

            {/* ✅ Mostrar estado de carga de cámaras */}
            {camerasLoading ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-blue-700">Detectando cámaras...</p>
              </div>
            ) : cameraError ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700 text-center">
                  ⚠️ {cameraError}
                </p>
                <p className="text-xs text-yellow-600 text-center mt-2">
                  Puedes usar la opción de subir imagen
                </p>
              </div>
            ) : (
              <button
                onClick={startScanning}
                disabled={cameras.length === 0}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-4 px-6 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Video size={24} />
                <span className="font-semibold text-lg">Usar Cámara</span>
              </button>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">O</span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={handleUploadClick}
              disabled={processingImage}
              className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-4 px-6 rounded-xl hover:bg-indigo-50 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <Upload size={24} />
              <span className="font-semibold text-lg">
                {processingImage ? 'Procesando...' : 'Subir Imagen'}
              </span>
            </button>

            <div className="bg-gray-50 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <User size={18} />
                ¿Cómo funciona?
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Escanea el código QR del cliente</li>
                <li>• Verifica su estado de empadronamiento</li>
                <li>• Visualiza sus datos de forma segura</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div id="qr-file-reader" style={{ display: 'none' }}></div>
    </div>
  );
};

// ✅ Componente auxiliar para mostrar información
const InfoRow = ({ label, value, large }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-100">
    <span className="text-gray-600 font-medium text-sm md:text-base">{label}:</span>
    <span className={`font-bold text-gray-800 text-right ${large ? 'text-xl md:text-2xl text-indigo-600' : 'text-sm md:text-base'} break-words max-w-[60%]`}>
      {value}
    </span>
  </div>
);

export default QRScannerApp;