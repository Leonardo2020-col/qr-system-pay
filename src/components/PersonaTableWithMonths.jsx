// src/components/PersonaTableWithMonths.jsx

import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Edit, Trash2, RefreshCw } from 'lucide-react';
import supabaseService from '../services/supabaseService';

const MESES = [
  { num: 1, nombre: 'Ene' },
  { num: 2, nombre: 'Feb' },
  { num: 3, nombre: 'Mar' },
  { num: 4, nombre: 'Abr' },
  { num: 5, nombre: 'May' },
  { num: 6, nombre: 'Jun' },
  { num: 7, nombre: 'Jul' },
  { num: 8, nombre: 'Ago' },
  { num: 9, nombre: 'Sep' },
  { num: 10, nombre: 'Oct' },
  { num: 11, nombre: 'Nov' },
  { num: 12, nombre: 'Dic' },
];

const PersonaTableWithMonths = ({ 
  personas, 
  onVerDetalle, 
  onEditar, 
  onEliminar,
  anioSeleccionado = new Date().getFullYear()
}) => {
  const [estatusPorPersona, setEstatusPorPersona] = useState({});
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(null); // {personaId, mes}

  useEffect(() => {
    cargarEstatus();
  }, [personas, anioSeleccionado]);

  const cargarEstatus = async () => {
    try {
      setCargando(true);
      const todosEstatus = await supabaseService.obtenerTodosEstatusMensuales(anioSeleccionado);
      
      // Organizar por persona
      const estatusPorId = {};
      todosEstatus.forEach(estatus => {
        if (!estatusPorId[estatus.persona_id]) {
          estatusPorId[estatus.persona_id] = {};
        }
        estatusPorId[estatus.persona_id][estatus.mes] = estatus.estatus;
      });

      setEstatusPorPersona(estatusPorId);
    } catch (error) {
      console.error('Error cargando estatus:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleToggleEstatus = async (personaId, mes) => {
    try {
      setActualizando({ personaId, mes });
      
      await supabaseService.toggleEstatusMensual(personaId, anioSeleccionado, mes);
      
      // Actualizar estado local
      setEstatusPorPersona(prev => ({
        ...prev,
        [personaId]: {
          ...prev[personaId],
          [mes]: !prev[personaId]?.[mes]
        }
      }));
    } catch (error) {
      console.error('Error actualizando estatus:', error);
      alert('Error al actualizar el estatus');
    } finally {
      setActualizando(null);
    }
  };

  if (personas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No hay personas registradas</p>
        <p className="text-gray-400 text-sm mt-2">Agrega una nueva persona para comenzar</p>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="animate-spin mx-auto text-indigo-600 mb-4" size={40} />
        <p className="text-gray-600">Cargando estatus mensuales...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold border-r border-indigo-500 min-w-[200px]">
              Nombre Completo
            </th>
            {MESES.map(mes => (
              <th 
                key={mes.num} 
                className="px-3 py-3 text-center text-sm font-semibold border-r border-indigo-500 min-w-[60px]"
              >
                {mes.nombre}
              </th>
            ))}
            <th className="px-4 py-3 text-center text-sm font-semibold min-w-[150px]">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {personas.map((persona) => (
            <tr key={persona.id} className="hover:bg-gray-50 transition">
              {/* Nombre completo con foto */}
              <td className="px-4 py-3 text-sm text-gray-900 font-medium border-r border-gray-200">
                <div className="flex items-center gap-3">
                  {persona.foto_url ? (
                    <img 
                      src={persona.foto_url} 
                      alt={persona.nombre}
                      className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                      {persona.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">{persona.nombre}</p>
                    <p className="text-xs text-gray-500">DNI: {persona.dni}</p>
                  </div>
                </div>
              </td>

              {/* Columnas de meses con check/X */}
              {MESES.map(mes => {
                const tieneCheck = estatusPorPersona[persona.id]?.[mes.num] || false;
                const estaActualizando = actualizando?.personaId === persona.id && actualizando?.mes === mes.num;

                return (
                  <td 
                    key={mes.num} 
                    className="px-3 py-3 text-center border-r border-gray-200"
                  >
                    <button
                      onClick={() => handleToggleEstatus(persona.id, mes.num)}
                      disabled={estaActualizando}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all transform hover:scale-110 disabled:opacity-50 ${
                        tieneCheck 
                          ? 'bg-green-100 hover:bg-green-200 text-green-600' 
                          : 'bg-red-100 hover:bg-red-200 text-red-600'
                      }`}
                      title={tieneCheck ? 'Marcar como pendiente' : 'Marcar como completado'}
                    >
                      {estaActualizando ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : tieneCheck ? (
                        <Check size={20} strokeWidth={3} />
                      ) : (
                        <X size={20} strokeWidth={3} />
                      )}
                    </button>
                  </td>
                );
              })}

              {/* Acciones */}
              <td className="px-4 py-3">
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => onVerDetalle(persona)}
                    className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                    title="Ver detalles"
                  >
                    <Eye size={16} />
                    Ver
                  </button>
                  <button
                    onClick={() => onEditar(persona)}
                    className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-200 transition text-sm font-medium"
                    title="Editar"
                  >
                    <Edit size={16} />
                    Editar
                  </button>
                  <button
                    onClick={() => onEliminar(persona.id)}
                    className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PersonaTableWithMonths;