// src/components/PersonaTableWithMonths.jsx

import React from 'react';
import { Edit2, Trash2, QrCode, Calendar } from 'lucide-react';

const PersonaTableWithMonths = ({ 
  personas, 
  onVerDetalle, 
  onEditar, 
  onEliminar, 
  onGenerarQR,
  anioSeleccionado 
}) => {
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
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Foto
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
              Nombre
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              DNI
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Asociación
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Empadronado
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {personas.map((persona) => {
            if (!persona?.id) return null;
            
            return (
              <tr key={persona.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-4">
                  {persona.foto_url ? (
                    <img
                      src={persona.foto_url}
                      alt={persona.nombre}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {persona.nombre?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {persona.nombre || 'Sin nombre'}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-700">
                  {persona.dni || 'Sin DNI'}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {persona.asociacion || 'Sin asociación'}
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      persona.empadronado
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {persona.empadronado ? '✓ SÍ' : '✗ NO'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onVerDetalle(persona)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Ver estatus mensual"
                    >
                      <Calendar size={18} />
                    </button>
                    <button
                      onClick={() => onEditar(persona)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => onEliminar(persona.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => onGenerarQR(persona, persona.empadronado)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Generar QR"
                    >
                      <QrCode size={18} />
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