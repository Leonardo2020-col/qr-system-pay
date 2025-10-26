// src/components/MonthStatusModal.jsx

import React, { useState, useEffect } from 'react';
import { X, Check, XCircle, Calendar, User, Phone, Mail, CheckCircle } from 'lucide-react';
import supabaseService from '../services/supabaseService';

const MESES_COMPLETOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MonthStatusModal = ({ persona, onCerrar, anioInicial = new Date().getFullYear() }) => {
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioInicial);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [estatusMes, setEstatusMes] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarEstatusMes();
  }, [persona, anioSeleccionado, mesSeleccionado]);

  const cargarEstatusMes = async () => {
    try {
      setCargando(true);
      const estatus = await supabaseService.obtenerEstatusMes(
        persona.id, 
        anioSeleccionado, 
        mesSeleccionado
      );
      setEstatusMes(estatus);
    } catch (error) {
      console.error('Error cargando estatus del mes:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleToggleEstatus = async () => {
    try {
      await supabaseService.toggleEstatusMensual(
        persona.id,
        anioSeleccionado,
        mesSeleccionado
      );
      await cargarEstatusMes();
    } catch (error) {
      console.error('Error actualizando estatus:', error);
      alert('Error al actualizar el estatus');
    }
  };

  if (!persona) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white rounded-t-2xl">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">Información del Cliente</h2>
            <button
              onClick={onCerrar}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Foto y nombre */}
          <div className="flex items-center gap-4">
            {persona.foto_url ? (
              <img 
                src={persona.foto_url} 
                alt={persona.nombre}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold text-3xl shadow-lg">
                {persona.nombre.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold">{persona.nombre}</h3>
              <p className="text-indigo-100">DNI: {persona.dni}</p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Información de contacto */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <User size={18} className="text-indigo-600" />
              Información de Contacto
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              {persona.email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail size={16} className="text-gray-400" />
                  <span>{persona.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-700">
                <Phone size={16} className="text-gray-400" />
                <span>{persona.telefono}</span>
              </div>
            </div>
          </div>

          {/* Selector de mes y año */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" />
              Seleccionar Período
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mes
                </label>
                <select
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {[2024, 2025, 2026, 2027].map(anio => (
                    <option key={anio} value={anio}>{anio}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Estatus del mes */}
          {cargando ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Cargando...</p>
            </div>
          ) : (
            <>
              <div className={`rounded-xl p-6 text-center ${
                estatusMes?.estatus
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300'
                  : 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300'
              }`}>
                {estatusMes?.estatus ? (
                  <>
                    <CheckCircle size={64} className="mx-auto text-green-600 mb-3" />
                    <h3 className="text-2xl font-bold text-green-800 mb-2">
                      ✓ Completado
                    </h3>
                    <p className="text-green-700 font-medium">
                      {MESES_COMPLETOS[mesSeleccionado - 1]} {anioSeleccionado}
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle size={64} className="mx-auto text-red-600 mb-3" />
                    <h3 className="text-2xl font-bold text-red-800 mb-2">
                      ✗ Pendiente
                    </h3>
                    <p className="text-red-700 font-medium">
                      {MESES_COMPLETOS[mesSeleccionado - 1]} {anioSeleccionado}
                    </p>
                  </>
                )}
              </div>

              {/* Botón para cambiar estatus */}
              <button
                onClick={handleToggleEstatus}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                  estatusMes?.estatus
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {estatusMes?.estatus ? (
                  <>
                    <X size={20} />
                    Marcar como Pendiente
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Marcar como Completado
                  </>
                )}
              </button>

              {/* Observaciones */}
              {estatusMes?.observaciones && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Observaciones:</strong> {estatusMes.observaciones}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onCerrar}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthStatusModal;