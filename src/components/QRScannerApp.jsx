import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, ArrowLeft, Camera, Home, Video, User, Upload, Calendar } from 'lucide-react'; // ✅ Agregado Calendar
import supabaseService from '../services/supabaseService';

// ✅ Componente auxiliar para manejar carga de imágenes
const FotoPersona = ({ foto, nombre }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!foto || foto.trim() === '') {
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
  
  // ✅ NUEVO: Flag para evitar múltiples escaneos simultáneos
  const [processingQR, setProcessingQR] = useState(false);
  
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Debug de estados
  useEffect(() => {
    console.log('📊 Estados:', {
      scanning,
      scannerStarted,
      hasPersona: !!persona,
      hasDNI: !!currentDNI,
      processingQR
    });
  }, [scanning, scannerStarted, persona, currentDNI, processingQR]);

  // ✅ Cargar cámaras al montar el componente
  useEffect(() => {
    const getCameras = async () => {
      try {
        setCamerasLoading(true);
        setCameraError(null);
        
        console.log('🔍 Detectando cámaras...');
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('API de cámara no disponible');
        }
        
        const devices = await Html5Qrcode.getCameras();
        
        console.log('📹 Cámaras detectadas:', devices.length);
        
        if (devices && devices.length > 0) {
          setCameras(devices);
          
          const backCamera = devices.find(d => {
            const label = d.label.toLowerCase();
            return label.includes('back') || 
                   label.includes('trasera') ||
                   label.includes('rear') ||
                   label.includes('environment');
          });
          
          const defaultCamera = backCamera || devices[0];
          setSelectedCamera(defaultCamera.id);
          
          console.log('✅ Cámara seleccionada:', defaultCamera.label || defaultCamera.id);
        } else {
          setCameraError('No se encontraron cámaras');
        }
      } catch (err) {
        console.error('❌ Error obteniendo cámaras:', err);
        setCameraError('Error al acceder a la cámara');
      } finally {
        setCamerasLoading(false);
      }
    };

    getCameras();
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    if (!selectedCamera) {
      alert('Por favor selecciona una cámara');
      return;
    }

    console.log('🎬 Iniciando escaneo...');
    
    // Cambiar estado para renderizar el elemento
    setScanning(true);
    
    // Esperar a que React renderice
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const readerElement = document.getElementById('qr-reader');
      if (!readerElement) {
        console.error('❌ Elemento qr-reader no encontrado');
        setScanning(false);
        alert('Error de inicialización. Intenta de nuevo.');
        return;
      }

      console.log('✅ Elemento encontrado');

      // Limpiar escáner previo
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
          scannerRef.current = null;
        } catch (e) {
          console.log('Limpiando escáner previo');
        }
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        selectedCamera,
        config,
        onScanSuccess,
        onScanError
      );

      setScannerStarted(true);
      console.log('✅ Escáner iniciado');
    } catch (err) {
      console.error('❌ Error:', err);
      
      setScanning(false);
      setScannerStarted(false);
      
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        } catch (e) {}
        scannerRef.current = null;
      }
      
      let errorMessage = '❌ Error al iniciar cámara.\n\nUsa "Subir Imagen".';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = '⚠️ Permiso denegado.\n\n1. Permite cámara\n2. Recarga\n\nO usa "Subir Imagen".';
      } else if (err.name === 'NotFoundError') {
        errorMessage = '⚠️ No se encontró cámara.\n\nUsa "Subir Imagen".';
      } else if (err.name === 'NotReadableError') {
        errorMessage = '⚠️ Cámara en uso.\n\nCierra otras apps.';
      }
      
      alert(errorMessage);
    }
  };

  const onScanSuccess = async (decodedText) => {
    // ✅ CRÍTICO: Evitar procesamiento múltiple
    if (processingQR) {
      console.log('⚠️ Ya procesando QR, ignorando...');
      return;
    }

    setProcessingQR(true);
    console.log('🔒 Bloqueando nuevos escaneos');

    try {
      const personaData = JSON.parse(decodedText);
      
      if (currentDNI === personaData.dni) {
        console.log('⚠️ DNI duplicado');
        setProcessingQR(false);
        return;
      }
      
      console.log('📋 QR detectado - DNI:', personaData.dni);
      
      // ✅ Detener escáner INMEDIATAMENTE
      if (scannerRef.current) {
        try {
          console.log('🛑 Deteniendo escáner...');
          await scannerRef.current.stop();
          console.log('✅ Escáner detenido');
          scannerRef.current = null;
        } catch (e) {
          console.error('Error deteniendo:', e);
        }
      }
      
      setScannerStarted(false);
      setScanning(false);
      
      // Buscar foto en Supabase
      console.log('🔍 Buscando persona en Supabase...');
      try {
        const personaCompleta = await supabaseService.buscarPorDNI(personaData.dni);
        
        if (personaCompleta?.foto_url && personaCompleta.foto_url.trim() !== '') {
          let fotoUrl = personaCompleta.foto_url.trim();
          if (fotoUrl.startsWith('http:')) {
            fotoUrl = fotoUrl.replace('http:', 'https:');
          }
          personaData.foto = fotoUrl;
          console.log('✅ Foto encontrada');
        } else {
          personaData.foto = null;
          console.log('⚠️ Sin foto');
        }
      } catch (err) {
        console.error('❌ Error buscando foto:', err);
        personaData.foto = null;
      }
      
      // Establecer datos
      console.log('💾 Guardando datos...');
      setCurrentDNI(personaData.dni);
      setPersona(personaData);
      
      // Limpiar DOM del escáner
      setTimeout(() => {
        const el = document.getElementById('qr-reader');
        if (el) {
          el.innerHTML = '';
          console.log('🧹 DOM limpiado');
        }
      }, 100);
      
      console.log('✅ Proceso completado');
      
    } catch (error) {
      console.error('❌ Error parseando QR:', error);
      alert('Código QR inválido. Intenta de nuevo.');
      setProcessingQR(false);
    } finally {
      // Liberar el flag después de un delay
      setTimeout(() => {
        setProcessingQR(false);
        console.log('🔓 Desbloqueando escaneos');
      }, 1000);
    }
  };

  const onScanError = (err) => {
    // Ignorar errores continuos de escaneo
  };

  const handleReset = async () => {
    console.log('🔄 Reset completo iniciado');
    
    // Detener escáner
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        console.log('✅ Escáner detenido en reset');
      } catch (e) {
        console.log('Error en reset:', e);
      }
      scannerRef.current = null;
    }
    
    // Limpiar estados
    setPersona(null);
    setCurrentDNI(null);
    setScanning(false);
    setScannerStarted(false);
    setProcessingImage(false);
    setProcessingQR(false);
    
    // Limpiar DOM
    const el = document.getElementById('qr-reader');
    if (el) {
      el.innerHTML = '';
      console.log('🧹 DOM limpiado en reset');
    }
    
    console.log('✅ Reset completado');
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
      alert('No se pudo leer el código QR. Intenta con otra imagen más clara.');
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

  // ========================================
  // VISTA 1: Mostrar información de la persona
  // ========================================
  // ========================================
// VISTA 1: Mostrar información de la persona
// ========================================
if (persona) {
  const empadronado = persona.empadronado || false;

  // ✅ NUEVO: Estados para el selector de mes
  const [mesSeleccionado, setMesSeleccionado] = React.useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = React.useState(new Date().getFullYear());
  const [estatusMes, setEstatusMes] = React.useState(null);
  const [cargandoEstatus, setCargandoEstatus] = React.useState(true);

  // ✅ Nombres de meses
  const MESES_COMPLETOS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // ✅ Cargar estatus del mes cuando cambia la selección
  React.useEffect(() => {
    const cargarEstatusMes = async () => {
      try {
        setCargandoEstatus(true);
        const estatus = await supabaseService.obtenerEstatusMes(
  persona.id || await buscarIdPorDNI(persona.dni), // Buscar por DNI si no hay ID
  anioSeleccionado,
  mesSeleccionado
);
        setEstatusMes(estatus);
      } catch (error) {
        console.error('Error cargando estatus:', error);
        setEstatusMes({ estatus: false }); // Por defecto en false si hay error
      } finally {
        setCargandoEstatus(false);
      }
    };

    cargarEstatusMes();
  }, [mesSeleccionado, anioSeleccionado, persona]);

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
            </div>

            {/* ✅ NUEVO: Selector de Mes y Año */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-5 rounded-xl">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-indigo-600" />
                Estatus Mensual
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mes
                  </label>
                  <select
                    value={mesSeleccionado}
                    onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                  >
                    {MESES_COMPLETOS.map((mes, index) => (
                      <option key={index} value={index + 1}>
                        {mes}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Año
                  </label>
                  <select
                    value={anioSeleccionado}
                    onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                  >
                    {[2024, 2025, 2026, 2027].map(anio => (
                      <option key={anio} value={anio}>{anio}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ✅ Mostrar estatus del mes seleccionado */}
              {cargandoEstatus ? (
                <div className="text-center py-4">
                  <div className="animate-spin w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-xs text-gray-600 mt-2">Cargando...</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium text-sm">
                      Estatus de {MESES_COMPLETOS[mesSeleccionado - 1]}:
                    </span>
                    <span className={`text-2xl md:text-3xl font-bold ${
                      estatusMes?.estatus ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {estatusMes?.estatus ? '✓' : '✗'}
                    </span>
                  </div>
                  <p className={`text-xs mt-2 font-medium ${
                    estatusMes?.estatus ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {estatusMes?.estatus ? 'Completado' : 'Pendiente'}
                  </p>
                </div>
              )}
            </div>

            {/* ✅ Estado de empadronamiento */}
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
                <strong>Estado registrado:</strong> {persona.estado || 'Activo'}
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
  // VISTA 2: Escaneando
  // ========================================
  if (scanning && !persona) {
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
              {/* ✅ Elemento para el escáner */}
              <div 
                id="qr-reader" 
                className="rounded-xl overflow-hidden mb-4"
                style={{ minHeight: '300px' }}
              ></div>
              
              {/* Selector de cámara */}
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
  // VISTA 3: Pantalla inicial
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

            {/* Estado de carga de cámaras */}
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