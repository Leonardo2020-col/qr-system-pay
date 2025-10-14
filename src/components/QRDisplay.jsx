// src/components/QRDisplay.jsx

import React from 'react';
import { CheckCircle, XCircle, QrCode, Download } from 'lucide-react';
import { formatearFecha } from '../utils/dateUtils';
import { descargarQR } from '../services/qrService';

const QRDisplay = ({ qrUrl, persona, alDia }) => {
  if (!qrUrl || !persona) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        <div className="text-center">
          <QrCode size={64} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">Selecciona una persona</p>
          <p className="text-sm mt-2">para generar su código QR</p>
        </div>
      </div>
    );
  }

  const handleDescargar = () => {
    descargarQR(qrUrl, `QR-${persona.nombre.replace(/\s+/g, '-')}.png`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-xl">
        <img 
          src={qrUrl} 
          alt="Código QR" 
          className="w-full rounded-lg shadow-md"
        />
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-5 rounded-xl">
        <h3 className="font-bold text-xl text-gray-800 mb-3">
          {persona.nombre}
        </h3>
        
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span className="text-gray-600">DNI:</span>
            <span className="font-semibold">{persona.dni}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-semibold">{persona.email}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Teléfono:</span>
            <span className="font-semibold">{persona.telefono}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Último Pago:</span>
            <span className="font-semibold">{formatearFecha(persona.ultimoPago)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Monto:</span>
            <span className="font-semibold">S/ {persona.monto.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className={`p-5 rounded-xl text-center ${
        alDia 
          ? 'bg-green-100 text-green-800 border-2 border-green-300' 
          : 'bg-red-100 text-red-800 border-2 border-red-300'
      }`}>
        {alDia ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle size={28} />
            <div>
              <p className="font-bold text-lg">PAGOS AL DÍA</p>
              <p className="text-sm mt-1">Situación regular</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <XCircle size={28} />
            <div>
              <p className="font-bold text-lg">PAGO PENDIENTE</p>
              <p className="text-sm mt-1">Requiere actualización</p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleDescargar}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition font-medium shadow-md"
      >
        <Download size={20} />
        Descargar Código QR
      </button>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Nota:</strong> El código QR contiene toda la información de la persona 
          y su estado de pago al momento de generación.
        </p>
      </div>
    </div>
  );
};

export default QRDisplay;