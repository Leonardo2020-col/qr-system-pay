
import React from 'react';
import { CheckCircle, XCircle, QrCode, Download } from 'lucide-react';
import { descargarQR } from '../services/qrService';

const QRDisplay = ({ qrUrl, persona, empadronado }) => {
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
        {/* Foto y nombre */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-indigo-200">
          {persona.foto && (
            <img 
              src={persona.foto} 
              alt={persona.nombre}
              className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <div>
            <h3 className="font-bold text-xl text-gray-800">
              {persona.nombre}
            </h3>
            <p className="text-sm text-gray-600">DNI: {persona.dni}</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-700">
          {persona.email && (
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-semibold">{persona.email}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">Teléfono:</span>
            <span className="font-semibold">{persona.telefono}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Monto:</span>
            <span className="font-semibold">S/ {parseFloat(persona.monto || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className={`p-5 rounded-xl text-center ${
        empadronado
          ? 'bg-green-100 text-green-800 border-2 border-green-300' 
          : 'bg-red-100 text-red-800 border-2 border-red-300'
      }`}>
        {empadronado ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle size={28} />
            <div>
              <p className="font-bold text-lg">EMPADRONADO</p>
              <p className="text-sm mt-1">Situación regular</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <XCircle size={28} />
            <div>
              <p className="font-bold text-lg">NO EMPADRONADO</p>
              <p className="text-sm mt-1">Requiere empadronamiento</p>
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
          y su estado de empadronamiento al momento de generación.
        </p>
      </div>
    </div>
  );
};

export default QRDisplay;