// src/components/PersonaForm.js

import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import supabaseService from '../services/supabaseService';

const PersonaForm = ({ onAgregar, onCancelar }) => {
  const [nombre, setNombre] = useState('');
  const [dni, setDNI] = useState('');
  const [asociacion, setAsociacion] = useState('');
  const [empadronado, setEmpadronado] = useState(false);
  const [foto, setFoto] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [previsualizacion, setPrevisualizacion] = useState(null);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }

      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrevisualizacion(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre || !dni) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    try {
      let fotoUrl = null;

      if (foto) {
        setSubiendoFoto(true);
        fotoUrl = await supabaseService.subirFoto(foto, dni);
      }

      const nuevaPersona = {
        nombre,
        dni,
        asociacion: asociacion || 'Sin asociación',
        empadronado,
        foto_url: fotoUrl,
      };

      await onAgregar(nuevaPersona);
      
      setNombre('');
      setDNI('');
      setAsociacion('');
      setEmpadronado(false);
      setFoto(null);
      setPrevisualizacion(null);
    } catch (error) {
      console.error('Error al agregar persona:', error);
      alert('Error al agregar persona. Intenta de nuevo.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-800">Nueva Persona</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ej: Juan Pérez"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            DNI <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={dni}
            onChange={(e) => setDNI(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ej: 12345678"
            maxLength="8"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Asociación
          </label>
          <input
            type="text"
            value={asociacion}
            onChange={(e) => setAsociacion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ej: Asociación de Comerciantes"
          />
        </div>

        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={empadronado}
              onChange={(e) => setEmpadronado(e.target.checked)}
              className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Empadronado
            </span>
          </label>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Foto (opcional)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFotoChange}
            className="hidden"
            id="foto-input"
          />
          <label
            htmlFor="foto-input"
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            <Upload size={18} />
            <span className="text-sm">Subir Foto</span>
          </label>
          
          {previsualizacion && (
            <div className="relative">
              <img
                src={previsualizacion}
                alt="Vista previa"
                className="w-16 h-16 object-cover rounded-lg border-2 border-gray-300"
              />
              <button
                type="button"
                onClick={() => {
                  setFoto(null);
                  setPrevisualizacion(null);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={subiendoFoto}
          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
        >
          {subiendoFoto ? 'Subiendo foto...' : 'Agregar'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default PersonaForm;