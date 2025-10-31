// src/components/QRScannerApp.jsx

import React, { useState, useEffect } from 'react';
import QRScanner from './QRScanner';
import { ArrowLeft, Calendar } from 'lucide-react';
import supabaseService from '../services/supabaseService';

const QRScannerApp = ({ onVolver }) => {
  const [datosPersona, setDatosPersona] = useState(null);
  const [error, setError] = useState(null);
  const [escaneando, setEscaneando] = useState(true);
  const [estatusMensual, setEstatusMensual] = useState({});
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    if (datosPersona?.id) {
      cargarEstatusMensual();
    }
  }, [datosPersona, anioSeleccionado]);

  const cargarEstatusMensual = async () => {
    if (!datosPersona?.id) return;

    try {
      const estatus = await supabaseService.obtenerEstatusMensual(
        datosPersona.id,
        anioSeleccionado
      );
      setEstatusMensual(estatus);
    } catch (error) {
      console.error('Error cargando estatus mensual:', error);
    }
  };

  const handleScan = async (data) => {
    if (!data) return;

    try {
      setEscaneando(false);
      const parsedData = JSON.parse(data);
      
      const persona = await supabaseService.buscarPorDNI(parsedData.dni);
      
      if (persona) {
        setDatosPersona(persona);
        setError(null);
      } else {
        setError('Persona no encontrada en la base de datos');
        setTimeout(() => {
          setEscaneando(true);
          setError(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Error procesando QR:', err);
      setError('Error al procesar el código QR');
      setTimeout(() => {
        setEscaneando(true);
        setError(null);
      }, 3000);
    }
  };

  const handleError = (err) => {
    console.error('Error del escáner:', err);
    setError('Error al acceder a la cámara. Por favor, verifica los permisos.');
  };

  const reiniciarEscaner = () => {
    setDatosPersona(null);
    setError(null);
    setEscaneando(true);
    setEstatusMensual({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
            <button
              onClick={onVolver}
              className="flex items-center gap-2 mb-4 hover:bg-white/20 px-3 py-2 rounded-lg transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Volver</span>
            </button>
            <h1 className="text-2xl font-bold">Escáner de Códigos QR</h1>
            <p className="text-indigo-100 mt-1">
              {escaneando ? 'Apunta la cámara al código QR' : 'Datos de la persona'}
            </p>
          </div>

          <div className="p-6">
            {escaneando && !datosPersona && (
              <div className="space-y-4">
                <QRScanner onScan={handleScan} onError={handleError} />
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                )}
              </div>
            )}

            {datosPersona && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {datosPersona.foto_url ? (
                    <img
                      src={datosPersona.foto_url}
                      alt={datosPersona.nombre}
                      className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl">
                      {datosPersona.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {datosPersona.nombre}
                    </h2>
                    <p className="text-gray-600">DNI: {datosPersona.dni}</p>
                    {datosPersona.asociacion && (
                      <p className="text-gray-600">
                        Asociación: {datosPersona.asociacion}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Estado</span>
                    <p className="text-lg font-bold mt-1">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                          datosPersona.empadronado
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {datosPersona.empadronado ? '✓ Empadronado' : '✗ No Empadronado'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={20} className="text-indigo-600" />
                      <h3 className="font-bold text-gray-800">Estatus Mensual {anioSeleccionado}</h3>
                    </div>
                    <select
                      value={anioSeleccionado}
                      onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {mesesNombres.map((mes, idx) => {
                      const mesNumero = idx + 1;
                      const estaCheckeado = estatusMensual[mesNumero] || false;
                      
                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg text-center text-sm font-medium ${
                            estaCheckeado
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <div>{mes}</div>
                          <div className="text-xs mt-1">
                            {estaCheckeado ? '✓ Checkeado' : '○ No checkeado'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={reiniciarEscaner}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Escanear otro código
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerApp;