import React, { useState, useEffect } from 'react';
import { UserPlus, LogIn, LogOut, RefreshCw, AlertCircle, QrCode } from 'lucide-react';
import { useGoogleSheets } from './hooks/useGoogleSheets';
import { generarQRCode } from './services/qrService';
import PersonasList from './components/PersonasList';
import PersonaForm from './components/PersonaForm';
import QRDisplay from './components/QRDisplay';
import SearchBar from './components/SearchBar';
import QRScannerApp from './components/QRScannerApp';

function App() {
  const {
    personas,
    loading,
    error,
    isAuthenticated,
    isInitialized,
    signIn,
    signOut,
    cargarPersonas,
    agregarPersona,
    eliminarPersona,
  } = useGoogleSheets();

  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
  const [estadoPago, setEstadoPago] = useState(false);
  const [mostrarEscaner, setMostrarEscaner] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      cargarPersonas();
    }
  }, [isAuthenticated, cargarPersonas]);

  const handleGenerarQR = (persona, alDia) => {
    const url = generarQRCode(persona, alDia);
    setQrUrl(url);
    setPersonaSeleccionada(persona);
    setEstadoPago(alDia);
  };

  const handleAgregarPersona = async (persona) => {
    const exito = await agregarPersona(persona);
    if (exito) {
      setMostrarFormulario(false);
    }
  };

  const handleEliminarPersona = async (index) => {
    if (window.confirm('¿Estás seguro de eliminar esta persona?')) {
      await eliminarPersona(index);
      
      if (personaSeleccionada && personaSeleccionada.id === personas[index].id) {
        setQrUrl('');
        setPersonaSeleccionada(null);
      }
    }
  };

  const personasFiltradas = personas.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.dni.includes(busqueda)
  );

  // Mostrar escáner
  if (mostrarEscaner) {
    return <QRScannerApp onVolver={() => setMostrarEscaner(false)} />;
  }

  // Pantalla de carga inicial
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-indigo-600" size={48} />
          <p className="text-gray-600 text-lg">Inicializando Google Sheets...</p>
        </div>
      </div>
    );
  }

  // Pantalla de inicio de sesión
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Sistema de Gestión QR
            </h1>
            <p className="text-gray-600">
              Control de pagos y generación de códigos QR
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={signIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white px-6 py-4 rounded-lg hover:bg-indigo-700 transition font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : (
                <LogIn size={20} />
              )}
              {loading ? 'Conectando...' : 'Iniciar sesión con Google'}
            </button>

            <button
              onClick={() => setMostrarEscaner(true)}
              className="w-full flex items-center justify-center gap-3 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition font-medium shadow-md"
            >
              <QrCode size={20} />
              Escanear Código QR
            </button>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Necesitas configurar las credenciales de Google Sheets 
              en el archivo <code className="bg-yellow-100 px-1 py-0.5 rounded">.env</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla principal (resto del código igual)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">
                Sistema de Gestión QR
              </h1>
              <p className="text-gray-600">Control de pagos y generación de códigos QR</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarEscaner(true)}
                className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition"
                title="Escanear QR"
              >
                <QrCode size={20} />
                Escanear
              </button>
              <button
                onClick={cargarPersonas}
                disabled={loading}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                title="Actualizar datos"
              >
                <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
                Actualizar
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition"
              >
                <LogOut size={20} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle size={24} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Lista de Personas ({personas.length})
              </h2>
              <button
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                <UserPlus size={20} />
                Agregar Persona
              </button>
            </div>

            {mostrarFormulario && (
              <div className="mb-6">
                <PersonaForm
                  onAgregar={handleAgregarPersona}
                  onCancelar={() => setMostrarFormulario(false)}
                />
              </div>
            )}

            <div className="mb-6">
              <SearchBar busqueda={busqueda} onBusquedaChange={setBusqueda} />
            </div>

            {loading && !mostrarFormulario ? (
              <div className="text-center py-12">
                <RefreshCw className="animate-spin mx-auto mb-4 text-indigo-600" size={48} />
                <p className="text-gray-600">Cargando datos...</p>
              </div>
            ) : (
              <PersonasList
                personas={personasFiltradas}
                onGenerarQR={handleGenerarQR}
                onEliminar={handleEliminarPersona}
              />
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Código QR</h2>
            <QRDisplay 
              qrUrl={qrUrl} 
              persona={personaSeleccionada} 
              alDia={estadoPago}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;