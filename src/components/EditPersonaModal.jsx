// src/components/EditPersonaModal.js

import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import supabaseService from '../services/supabaseService';

const EditPersonaModal = ({ persona, onGuardar, onCerrar }) => {
  const [nombre, setNombre] = useState(persona.nombre);
  const [dni, setDNI] = useState(persona.dni);
  const [asociacion, setAsociacion] = useState(persona.asociacion || 'Sin asociación');
  const [empadronado, setEmpadronado] = useState(persona.empadronado);
  const [foto, setFoto] = useState(null);
  const [previsualizacion, setPrevisualizacion] = useState(persona.foto_url);
  const [guardando, setGuardando] = useState(false);

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
      alert('Completa los campos obligatorios');
      return;
    }

    try {
      setGuardando(true);

      let fotoUrl = persona.foto_url;
      
      if (foto) {
        fotoUrl = await supabaseService.subirFoto(foto, dni);
      }

      await onGuardar(persona.id, {
        nombre,
        dni,
        asociacion,
        empadronado,
        foto_url: fotoUrl,
      });

      onCerrar();
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">Editar Persona</h2>
          <button
            onClick={onCerrar}
            className="hover:bg-white/20 rounded-full p-2 transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: Asociación de Comerciantes"
            />
          </div>

          <div>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
                id="foto-edit-input"
              />
              <label
                htmlFor="foto-edit-input"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                <Upload size={18} />
                <span className="text-sm">Cambiar Foto</span>
              </label>
              
              {previsualizacion && (
                <img
                  src={previsualizacion}
                  alt="Vista previa"
                  className="w-16 h-16 object-cover rounded-lg border-2 border-gray-300"
                />
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPersonaModal;