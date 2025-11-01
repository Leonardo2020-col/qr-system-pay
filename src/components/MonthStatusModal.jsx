// src/components/MonthStatusModal.jsx

import React, { useState, useEffect } from 'react';
import { X, Calendar, Check } from 'lucide-react';
import supabaseService from '../services/supabaseService';

const MonthStatusModal = ({ persona, onCerrar, anioInicial }) => {
  const [estatusMensual, setEstatusMensual] = useState({});
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioInicial || new Date().getFullYear());
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    cargarEstatusMensual();
  }, [anioSeleccionado]);

  const cargarEstatusMensual = async () => {
    setCargando(true);
    try {
      const estatus = await supabaseService.obtenerEstatusMensual(
        persona.id,
        anioSeleccionado
      );
      setEstatusMensual(estatus || {});
    } catch (error) {
      console.error('Error cargando estatus mensual:', error);
      setEstatusMensual({});
    } finally {
      setCargando(false);
    }
  };

  const handleToggleEstatus = async (mes) => {
    const mesNumero = mes + 1;
    const estatusActual = estatusMensual[mesNumero] || false;
    const nuevoEstatus = !estatusActual;

    // Actualización optimista
    setEstatusMensual(prev => ({
      ...prev,
      [mesNumero]: nuevoEstatus
    }));

    setGuardando(true);
    try {
      await supabaseService.actualizarEstatusMensual(
        persona.id,
        anioSeleccionado,
        mesNumero,
        nuevoEstatus
      );
    } catch (error) {
      console.error('Error actualizando estatus:', error);
      // Revertir cambio
      setEstatusMensual(prev => ({
        ...prev,
        [mesNumero]: estatusActual
      }));
      alert('Error al actualizar el estatus');
    } finally {
      setGuardando(false);
    }
  };

  const contarCheckeados = () => {
    return Object.values(estatusMensual).filter(Boolean).length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {persona.foto_url ? (
                <img
                  src={persona.foto_url}
                  alt={persona.nombre}
                  className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold text-2xl shadow-lg">
                  {persona.nombre?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{persona.nombre}</h2>
                <p className="text-indigo-100 text-sm">DNI: {persona.dni}</p>
                {persona.asociacion && (
                  <p className="text-indigo-100 text-sm">Asociación: {persona.asociacion}</p>
                )}
              </div>
            </div>
            <button
              onClick={onCerrar}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Selector de año y estadísticas */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Calendar size={24} className="text-indigo-600" />
              <h3 className="text-xl font-bold text-gray-800">Estatus Mensual</h3>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-2 rounded-lg border border-green-200">
                <span className="text-sm font-medium text-green-800">
                  {contarCheckeados()} / 12 meses checkeados
                </span>
              </div>
              
              <select
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          {/* Grid de meses */}
          {cargando ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">Cargando estatus...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {mesesNombres.map((mes, idx) => {
                const mesNumero = idx + 1;
                const estaCheckeado = estatusMensual[mesNumero] || false;
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleToggleEstatus(idx)}
                    disabled={guardando}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                      estaCheckeado
                        ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-400 shadow-md'
                        : 'bg-white border-gray-300 hover:border-indigo-400 hover:shadow-md'
                    } ${guardando ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        estaCheckeado
                          ? 'bg-green-500 text-white scale-110'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        <Check size={20} strokeWidth={3} className={estaCheckeado ? 'animate-in zoom-in' : ''} />
                      </div>
                      
                      <p className={`font-semibold text-sm ${
                        estaCheckeado ? 'text-green-800' : 'text-gray-700'
                      }`}>
                        {mes}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Leyenda */}
          <div className="mt-6 flex items-center justify-center gap-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm text-gray-700">Checkeado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-300"></div>
              <span className="text-sm text-gray-700">No checkeado</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onCerrar}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthStatusModal;