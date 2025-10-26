// src/App.js

import React, { useState } from 'react';
import { UserPlus, RefreshCw, AlertCircle, QrCode, Cloud, LogIn, LogOut, Calendar } from 'lucide-react';
import { useHybridData } from './hooks/useHybridData';
import { generarQRCode } from './services/qrService';
import PersonaTableWithMonths from './components/PersonaTableWithMonths';
import PersonaForm from './components/PersonaForm';
import QRDisplay from './components/QRDisplay';
import SearchBar from './components/SearchBar';
import QRScannerApp from './components/QRScannerApp';
import MonthStatusModal from './components/MonthStatusModal';
import EditPersonaModal from './components/EditPersonaModal';
import supabaseService from './services/supabaseService';

function App() {
  const { 
    personas, 
    loading, 
    error, 
    sincronizando,
    googleSheetsReady,
    googleSheetsAuth,
    cargarPersonas, 
    agregarPersona, 
    eliminarPersona,
    sincronizarConGoogleSheets,
    conectarGoogleSheets,
    desconectarGoogleSheets,
  } = useHybridData();

  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
  const [estadoPago, setEstadoPago] = useState(false);
  const [mostrarEscaner, setMostrarEscaner] = useState(false);
  const [generandoQR, setGenerandoQR] = useState(false);
  
  // ✅ Nuevos estados para modales
  const [mostrarModalMes, setMostrarModalMes] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [personaParaModal, setPersonaParaModal] = useState(null);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  const handleGenerarQR = async (persona, empadronado) => {
    try {
      setGenerandoQR(true);
      const url = await generarQRCode(persona, empadronado);
      setQrUrl(url);
      setPersonaSeleccionada(persona);
      setEstadoPago(empadronado);
    } catch (error) {
      console.error('Error generando QR:', error);
      alert('Error al generar el código QR. Intenta de nuevo.');
    } finally {
      setGenerandoQR(false);
    }
  };

  const handleAgregarPersona = async (persona) => {
    const exito = await agregarPersona(persona);
    if (exito) {
      setMostrarFormulario(false);
      // Recargar para obtener estatus mensuales
      await cargarPersonas();
    }
  };

  const handleEliminarPersona = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta persona? Esto también eliminará todos sus registros mensuales.')) {
      await eliminarPersona(id);
      
      if (personaSeleccionada && personaSeleccionada.id === id) {
        setQrUrl('');
        setPersonaSeleccionada(null);
      }
    }
  };

  // ✅ Abrir modal de detalle mensual
  const handleVerDetalle = (persona) => {
    setPersonaParaModal(persona);
    setMostrarModalMes(true);
  };

  // ✅ Abrir modal de edición
  const handleEditar = (persona) => {
    setPersonaParaModal(persona);
    setMostrarModalEditar(true);
  };

  // ✅ Guardar edición
  const handleGuardarEdicion = async (personaId, datosEditados) => {
    try {
      await supabaseService.actualizarPersona(personaId, datosEditados);
      await cargarPersonas();
      alert('✅ Persona actualizada correctamente');
    } catch (error) {
      console.error('Error actualizando persona:', error);
      throw error;
    }
  };

  const handleSincronizar = async () => {
    try {
      await sincronizarConGoogleSheets();
      alert('✅ Datos sincronizados con Google Sheets');
    } catch (error) {
      alert('❌ Error al sincronizar: ' + error.message);
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

  // Pantalla principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-1">
                Sistema de Gestión QR
              </h1>
              <p className="text-xs md:text-sm lg:text-base text-gray-600">
                Control de estatus mensual y generación de códigos QR
              </p>
            </div>
            
            {/* Selector de año */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-lg border border-indigo-200">
              <Calendar size={20} className="text-indigo-600" />
              <label className="text-sm font-medium text-gray-700">Año:</label>
              <select
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
              <button
                onClick={() => setMostrarEscaner(true)}
                className="flex flex-col items-center justify-center gap-1 bg-green-100 text-green-700 px-2 py-3 rounded-lg hover:bg-green-200 transition"
              >
                <QrCode size={18} className="md:w-5 md:h-5" />
                <span className="text-xs font-medium">Escanear</span>
              </button>
              
              <button
                onClick={cargarPersonas}
                disabled={loading}
                className="flex flex-col items-center justify-center gap-1 bg-gray-100 text-gray-700 px-2 py-3 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                <RefreshCw className={`${loading ? 'animate-spin' : ''} w-[18px] h-[18px] md:w-5 md:h-5`} />
                <span className="text-xs font-medium">Actualizar</span>
              </button>

              {/* Botones de Google Sheets */}
              {googleSheetsReady && (
                googleSheetsAuth ? (
                  <>
                    <button
                      onClick={handleSincronizar}
                      disabled={sincronizando || loading}
                      className="flex flex-col items-center justify-center gap-1 bg-blue-100 text-blue-700 px-2 py-3 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
                    >
                      <Cloud className={`${sincronizando ? 'animate-bounce' : ''} w-[18px] h-[18px] md:w-5 md:h-5`} />
                      <span className="text-xs font-medium">
                        {sincronizando ? 'Sync...' : 'Sheets'}
                      </span>
                    </button>
                    <button
                      onClick={desconectarGoogleSheets}
                      className="flex flex-col items-center justify-center gap-1 bg-red-100 text-red-700 px-2 py-3 rounded-lg hover:bg-red-200 transition"
                    >
                      <LogOut size={18} className="md:w-5 md:h-5" />
                      <span className="text-xs font-medium">Salir</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={conectarGoogleSheets}
                    disabled={loading}
                    className="flex flex-col items-center justify-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-3 rounded-lg hover:bg-indigo-200 transition disabled:opacity-50 col-span-2"
                  >
                    <LogIn size={18} className="md:w-5 md:h-5" />
                    <span className="text-xs font-medium">Conectar Sheets</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Error global */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 md:mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm md:text-base">Error</p>
              <p className="text-xs md:text-sm mt-1 break-words">{error}</p>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Tabla de personas con estatus mensuales */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-4 md:p-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800">
                Lista de Personas ({personas.length})
              </h2>
              <button
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm md:text-base w-full sm:w-auto"
              >
                <UserPlus size={18} className="md:w-5 md:h-5" />
                <span>Agregar Persona</span>
              </button>
            </div>

            {mostrarFormulario && (
              <div className="mb-4 md:mb-6">
                <PersonaForm
                  onAgregar={handleAgregarPersona}
                  onCancelar={() => setMostrarFormulario(false)}
                />
              </div>
            )}

            <div className="mb-4 md:mb-6">
              <SearchBar busqueda={busqueda} onBusquedaChange={setBusqueda} />
            </div>

            {loading && !mostrarFormulario ? (
              <div className="text-center py-8 md:py-12">
                <RefreshCw className="animate-spin mx-auto mb-4 text-indigo-600" size={40} />
                <p className="text-gray-600 text-sm md:text-base">Cargando datos...</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <div className="inline-block min-w-full align-middle px-4 md:px-0">
                  <PersonaTableWithMonths
                    personas={personasFiltradas}
                    onVerDetalle={handleVerDetalle}
                    onEditar={handleEditar}
                    onEliminar={handleEliminarPersona}
                    onGenerarQR={handleGenerarQR}
                    anioSeleccionado={anioSeleccionado}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Panel de QR */}
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 overflow-hidden">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-4 md:mb-6">
              Código QR
            </h2>
            
            {generandoQR ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="animate-spin text-indigo-600 mb-4" size={48} />
                <p className="text-gray-600 text-sm">Generando código QR...</p>
              </div>
            ) : (
              <QRDisplay 
                qrUrl={qrUrl} 
                persona={personaSeleccionada} 
                empadronado={estadoPago}
              />
            )}
          </div>
        </div>
      </div>

      {/* ✅ Modal de estatus mensual */}
      {mostrarModalMes && personaParaModal && (
        <MonthStatusModal
          persona={personaParaModal}
          onCerrar={() => {
            setMostrarModalMes(false);
            setPersonaParaModal(null);
          }}
          anioInicial={anioSeleccionado}
        />
      )}

      {/* ✅ Modal de edición */}
      {mostrarModalEditar && personaParaModal && (
        <EditPersonaModal
          persona={personaParaModal}
          onGuardar={handleGuardarEdicion}
          onCerrar={() => {
            setMostrarModalEditar(false);
            setPersonaParaModal(null);
          }}
        />
      )}
    </div>
  );
}

export default App;