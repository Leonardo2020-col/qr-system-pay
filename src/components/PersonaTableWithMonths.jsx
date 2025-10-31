// src/components/PersonaTableWithMonths.jsx

import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, QrCode, Eye } from 'lucide-react';
import supabaseService from '../services/supabaseService';

const PersonaTableWithMonths = ({ 
  personas, 
  onVerDetalle, 
  onEditar, 
  onEliminar, 
  onGenerarQR,
  anioSeleccionado 
}) => {
  const [estatusPorPersona, setEstatusPorPersona] = useState({});
  const [cargandoEstatus, setCargandoEstatus] = useState(true);

  const meses = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  useEffect(() => {
    cargarEstatusMensuales();
  }, [personas, anioSeleccionado]);

  const cargarEstatusMensuales = async () => {
  if (!personas || personas.length === 0) {
    setCargandoEstatus(false);
    setEstatusPorPersona({});
    return;
  }

  setCargandoEstatus(true);
  const estatusMap = {};

  try {
    // Cargar en paralelo para ser más rápido
    const promesas = personas
      .filter(p => p?.id) // Solo personas con ID válido
      .map(async (persona) => {
        try {
          const estatus = await supabaseService.obtenerEstatusMensual(
            persona.id,
            anioSeleccionado
          );
          return { id: persona.id, estatus: estatus || {} };
        } catch (error) {
          console.error(`Error cargando estatus para ${persona.nombre}:`, error);
          return { id: persona.id, estatus: {} };
        }
      });

    const resultados = await Promise.all(promesas);
    
    resultados.forEach(({ id, estatus }) => {
      estatusMap[id] = estatus;
    });

    setEstatusPorPersona(estatusMap);
  } catch (error) {
    console.error('Error general cargando estatus:', error);
    // Establecer estatus vacío para todas las personas
    personas.forEach(p => {
      if (p?.id) estatusMap[p.id] = {};
    });
    setEstatusPorPersona(estatusMap);
  } finally {
    setCargandoEstatus(false);
  }
};

  const handleToggleEstatus = async (persona, mes) => {
    if (!persona?.id) {
      console.error('Persona inválida:', persona);
      return;
    }

    const mesNumero = mes + 1;
    const estatusActual = estatusPorPersona[persona.id]?.[mesNumero] || false;
    const nuevoEstatus = !estatusActual;

    // Actualización optimista
    const estatusOptimista = { ...estatusPorPersona };
    if (!estatusOptimista[persona.id]) {
      estatusOptimista[persona.id] = {};
    }
    estatusOptimista[persona.id][mesNumero] = nuevoEstatus;
    setEstatusPorPersona(estatusOptimista);

    try {
      await supabaseService.actualizarEstatusMensual(
        persona.id,
        anioSeleccionado,
        mesNumero,
        nuevoEstatus
      );
    } catch (error) {
      console.error('Error actualizando estatus:', error);
      alert('Error al actualizar el estatus');
      cargarEstatusMensuales();
    }
  };

  if (!personas || personas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm md:text-base">
          No hay personas registradas. Agrega la primera persona para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Foto
            </th>
            <th className="sticky left-[60px] z-10 bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
              Nombre
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              DNI
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
              Asociación
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Emp.
            </th>
            {meses.map((mes, idx) => (
              <th
                key={idx}
                className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {mes}
              </th>
            ))}
            <th className="sticky right-0 z-10 bg-gray-50 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {personas.map((persona) => {
            if (!persona?.id) return null;
            
            return (
              <tr key={persona.id} className="hover:bg-gray-50 transition">
                <td className="sticky left-0 z-10 bg-white px-3 py-4">
                  {persona.foto_url ? (
                    <img
                      src={persona.foto_url}
                      alt={persona.nombre}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-sm">
                      {persona.nombre?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </td>
                <td className="sticky left-[60px] z-10 bg-white px-3 py-4 text-sm font-medium text-gray-900">
                  {persona.nombre || 'Sin nombre'}
                </td>
                <td className="px-3 py-4 text-sm text-gray-900">
                  {persona.dni || 'Sin DNI'}
                </td>
                <td className="px-3 py-4 text-sm text-gray-600">
                  {persona.asociacion || 'Sin asociación'}
                </td>
                <td className="px-3 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      persona.empadronado
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {persona.empadronado ? 'SÍ' : 'NO'}
                  </span>
                </td>
                {meses.map((_, idx) => {
                  const mesNumero = idx + 1;
                  const estatus = estatusPorPersona[persona.id]?.[mesNumero] || false;
                  
                  return (
                    <td key={idx} className="px-2 py-4 text-center">
                      {cargandoEstatus ? (
                        <div className="w-6 h-6 mx-auto rounded bg-gray-100 animate-pulse"></div>
                      ) : (
                        <button
                          onClick={() => handleToggleEstatus(persona, idx)}
                          className={`w-6 h-6 rounded transition-all ${
                            estatus
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-red-300 hover:bg-red-400'
                          }`}
                          title={`${meses[idx]}: ${estatus ? 'Pagado' : 'No pagado'}`}
                        />
                      )}
                    </td>
                  );
                })}
                <td className="sticky right-0 z-10 bg-white px-3 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onVerDetalle(persona)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Ver detalle"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEditar(persona)}
                      className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onEliminar(persona.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => onGenerarQR(persona, persona.empadronado)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition"
                      title="Generar QR"
                    >
                      <QrCode size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PersonaTableWithMonths;