import React from 'react'; //
import { CheckCircle, XCircle, QrCode, Trash2 } from 'lucide-react';
import { verificarPagoAlDia, formatearFecha, diasDesdeUltimoPago } from '../utils/dateUtils';

const PersonasList = ({ personas, onGenerarQR, onEliminar }) => {
  if (personas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No hay personas registradas</p>
        <p className="text-gray-400 text-sm mt-2">Agrega una nueva persona para comenzar</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">DNI</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Último Pago</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Monto</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {personas.map((persona, index) => {
            const alDia = verificarPagoAlDia(persona.ultimoPago);
            const dias = diasDesdeUltimoPago(persona.ultimoPago);

            return (
              <tr key={persona.id || index} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                  {persona.nombre}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">{persona.dni}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{persona.email}</td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {formatearFecha(persona.ultimoPago)}
                  {dias !== null && (
                    <span className="text-xs text-gray-400 block">
                      hace {dias} {dias === 1 ? 'día' : 'días'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  S/ {persona.monto.toFixed(2)}
                </td>
                <td className="px-4 py-4">
                  {alDia ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle size={16} />
                      Al día
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600 text-sm">
                      <XCircle size={16} />
                      Pendiente
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onGenerarQR(persona, alDia)}
                      className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-200 transition text-sm"
                      title="Generar QR"
                    >
                      <QrCode size={16} />
                      QR
                    </button>
                    <button
                      onClick={() => onEliminar(index)}
                      className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition text-sm"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
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

export default PersonasList;