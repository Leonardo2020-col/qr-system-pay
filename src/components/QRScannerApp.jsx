// src/components/QRScannerApp.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, ArrowLeft, Camera, Home, Video, User, Upload } from 'lucide-react';
import supabaseService from '../services/supabaseService';

const QRScannerApp = ({ onVolver }) => {
  const [persona, setPersona] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [scannerStarted, setScannerStarted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [currentDNI, setCurrentDNI] = useState(null);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  // Efecto para cargar la imagen cuando cambie el DNI
  useEffect(() => {
    // Reset de estados cuando no hay DNI
    if (!currentDNI) {
      setImageLoaded(false);
      setImageError(false);
      return;
    }

    // Esperar a que persona esté disponible
    if (!persona) {
      return;
    }

    // Solo procesar si hay foto
    if (persona?.foto && persona.foto.trim() !== '') {
      console.log('🔄 Cargando imagen ÚNICA VEZ para DNI:', currentDNI);
      
      // Reset inmediato de estados
      setImageLoaded(false);
      setImageError(false);

      // Precargar imagen usando objeto Image
      const img = new Image();
      let timeoutId;
      let mounted = true;
      
      const handleLoad = () => {
        if (mounted) {
          console.log('✅ Imagen cargada exitosamente');
          setImageLoaded(true);
          setImageError(false);
        }
        if (timeoutId) clearTimeout(timeoutId);
      };
      
      const handleError = () => {
        if (mounted) {
          console.error('❌ Error cargando imagen');
          setImageError(true);
          setImageLoaded(true);
        }
        if (timeoutId) clearTimeout(timeoutId);
      };
      
      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleError);
      
      // Timeout de 5 segundos
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn('⏱️ Timeout: Imagen tardó más de 5 segundos');
          setImageError(true);
          setImageLoaded(true);
        }
      }, 5000);
      
      img.src = persona.foto;
      
      return () => {
        mounted = false;
        img.removeEventListener('load', handleLoad);
        img.removeEventListener('error', handleError);
        if (timeoutId) clearTimeout(timeoutId);
        img.src = '';
      };
    } else {
      // Si no hay foto, marcar como "cargado"
      setImageLoaded(true);
      setImageError(false);
    }
  }, [currentDNI, persona]); // ✅ Incluye persona en las dependencias

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
      
      // ⚠️ Prevenir llamadas duplicadas
      if (currentDNI === personaData.dni) {
        console.log('⚠️ DNI ya procesado, ignorando duplicado');
        return;
      }
      
      // Establecer el DNI actual ANTES de buscar la foto
      setCurrentDNI(personaData.dni);
      
      // Buscar la foto en Supabase usando el DNI
      console.log('🔍 Buscando foto ÚNICA VEZ para DNI:', personaData.dni);
      
      try {
        const personaCompleta = await supabaseService.buscarPorDNI(personaData.dni);
        
        if (personaCompleta && personaCompleta.foto_url) {
          let fotoUrl = personaCompleta.foto_url.trim();
          
          if (fotoUrl.startsWith('http:')) {
            fotoUrl = fotoUrl.replace('http:', 'https:');
          }
          
          personaData.foto = fotoUrl;
          console.log('✅ Foto encontrada y procesada');
        } else {
          console.log('⚠️ No se encontró foto para este DNI');
          personaData.foto = null;
        }
      } catch (fotoError) {
        console.error('❌ Error buscando foto en Supabase:', fotoError);
        personaData.foto = null;
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
    setCurrentDNI(null);
    setScanning(false);
    setScannerStarted(false);
    setImageError(false);
    setImageLoaded(false);
    setProcessingImage(false);
  };

  // Manejar subida de imagen QR
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
      console.error('Error escaneando imagen:', error);
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

  // Vista: Mostrar información de la persona
  if (persona) {
    const empadronado = persona.empadronado || false;
    const tieneFoto = persona.foto && persona.foto.trim() !== '';

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
                <div className="mb-4 flex justify-center items-center">
                  <div className="relative inline-block" style={{ width: '128px', height: '128px' }}>
                    {tieneFoto && imageLoaded && !imageError ? (
                      // CASO 1: Imagen cargada exitosamente
                      <img 
                        ref={imgRef}
                        src={persona.foto}
                        alt={persona.nombre}
                        style={{
                          width: '128px',
                          height: '128px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '4px solid rgb(199, 210, 254)',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    ) : tieneFoto && !imageLoaded && !imageError ? (
                      // CASO 2: Cargando imagen
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
                    ) : (
                      // CASO 3: Sin foto o error cargando
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
                          {persona.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* CSS para animación de spinner */}
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                
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
            
            <div id="qr-reader" className="rounded-xl overflow-hidden mb-6 bg-gray-100" style={{ minHeight: '250px' }}></div>
            
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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div id="qr-file-reader" style={{ display: 'none' }}></div>

        <div className="space-y-3">
          <button
            onClick={() => setScanning(true)}
            disabled={processingImage}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-5 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition font-bold text-xl shadow-lg disabled:opacity-50"
          >
            <Camera size={24} className="inline mr-2" />
            Abrir Escáner de Cámara
          </button>

          <button
            onClick={handleUploadClick}
            disabled={processingImage}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-5 rounded-xl hover:from-green-700 hover:to-green-800 transition font-bold text-xl shadow-lg disabled:opacity-50"
          >
            {processingImage ? (
              <>
                <div className="inline-block animate-spin mr-2 h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
                Procesando...
              </>
            ) : (
              <>
                <Upload size={24} className="inline mr-2" />
                Subir Imagen de QR
              </>
            )}
          </button>
        </div>

        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-5">
          <p className="font-semibold text-indigo-900 mb-2">
            📱 Opciones:
          </p>
          <ul className="text-sm text-indigo-800 space-y-2">
            <li className="flex items-start gap-2">
              <Camera size={16} className="mt-0.5 flex-shrink-0" />
              <span><strong>Cámara:</strong> Escanea en tiempo real</span>
            </li>
            <li className="flex items-start gap-2">
              <Upload size={16} className="mt-0.5 flex-shrink-0" />
              <span><strong>Subir imagen:</strong> Selecciona una foto del QR desde tu galería</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, large }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-100">
    <span className="text-gray-600 font-medium text-sm md:text-base">{label}:</span>
    <span className={`font-bold text-gray-800 text-right ${large ? 'text-xl md:text-2xl text-indigo-600' : 'text-sm md:text-base'} break-words max-w-[60%]`}>
      {value}
    </span>
  </div>
);

export default QRScannerApp;