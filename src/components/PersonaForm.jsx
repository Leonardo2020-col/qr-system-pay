// src/components/PersonaForm.jsx

import React, { useState } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import { validarPersona } from '../utils/validators';
import { obtenerFechaActual } from '../utils/dateUtils';
import { comprimirImagen, validarTamañoImagen } from '../utils/imageUtils';


const PersonaForm = ({ onAgregar, onCancelar }) => {
  const [persona, setPersona] = useState({
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    ultimoPago: obtenerFechaActual(),
    monto: '',
    foto: '',
  });

  const [errores, setErrores] = useState({});
  const [previsualizacion, setPrevisualizacion] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPersona({ ...persona, [name]: value });
    
    if (errores[name]) {
      setErrores({ ...errores, [name]: null });
    }
  };

  const handleImagenChange = async (e) => {
  const file = e.target.files[0];
  if (file) {
    // Validar tamaño original (máximo 2MB)
    if (file.size > 2000000) {
      alert('La imagen es muy grande. Por favor, usa una imagen menor a 2MB.');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida.');
      return;
    }

    setSubiendo(true);

    try {
      // Comprimir imagen
      const base64Comprimido = await comprimirImagen(file, 150, 0.6);
      
      // Validar tamaño final
      if (!validarTamañoImagen(base64Comprimido, 25)) {
        alert('La imagen sigue siendo muy grande después de la compresión. Intenta con una imagen más pequeña.');
        setSubiendo(false);
        return;
      }
      
      setPersona({ ...persona, foto: base64Comprimido });
      setPrevisualizacion(base64Comprimido);
      setSubiendo(false);
    } catch (error) {
      console.error('Error procesando imagen:', error);
      alert('Error al procesar la imagen');
      setSubiendo(false);
    }
  }
};

  const handleTomarFoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Usar cámara trasera
    input.onchange = (e) => handleImagenChange(e);
    input.click();
  };

  const handleEliminarImagen = () => {
    setPersona({ ...persona, foto: '' });
    setPrevisualizacion('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const { valido, errores: nuevosErrores } = validarPersona(persona);
    
    if (!valido) {
      setErrores(nuevosErrores);
      return;
    }

    onAgregar(persona);
    
    // Resetear formulario
    setPersona({
      nombre: '',
      dni: '',
      email: '',
      telefono: '',
      ultimoPago: obtenerFechaActual(),
      monto: '',
      foto: '',
    });
    setPrevisualizacion('');
    setErrores({});
  };
  
  return (
    <div className="bg-gray-50 p-6 rounded-xl">
      <h3 className="text-lg font-semibold mb-4">Nueva Persona</h3>
      <form onSubmit={handleSubmit}>
        {/* Sección de foto */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foto del Cliente (Opcional)
          </label>
          
          {previsualizacion ? (
            <div className="relative inline-block">
              <img 
                src={previsualizacion} 
                alt="Previsualización" 
                className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200 shadow-md"
              />
              <button
                type="button"
                onClick={handleEliminarImagen}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition shadow-md"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition">
                <Upload size={32} className="text-gray-400 mb-2" />
                <span className="text-xs text-gray-500 text-center px-2">Subir imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  className="hidden"
                  disabled={subiendo}
                />
              </label>

              <button
                type="button"
                onClick={handleTomarFoto}
                disabled={subiendo}
                className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition disabled:opacity-50"
              >
                <Camera size={32} className="text-gray-400 mb-2" />
                <span className="text-xs text-gray-500 text-center px-2">Tomar foto</span>
              </button>
            </div>
          )}
          
          {subiendo && (
            <p className="text-sm text-indigo-600 mt-2">Procesando imagen...</p>
          )}
          
          <p className="text-xs text-gray-500 mt-2">
          La imagen se comprimirá automáticamente. Tamaño recomendado: menor a 1MB
          </p>
        </div>

        {/* Campos del formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre completo"
              value={persona.nombre}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
                errores.nombre ? 'border-red-500' : 'border-gray-300 focus:border-indigo-500'
              }`}
            />
            {errores.nombre && (
              <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>
            )}
          </div>

          <div>
            <input
              type="text"
              name="dni"
              placeholder="DNI (8 dígitos)"
              value={persona.dni}
              onChange={handleChange}
              maxLength="8"
              className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
                errores.dni ? 'border-red-500' : 'border-gray-300 focus:border-indigo-500'
              }`}
            />
            {errores.dni && (
              <p className="text-red-500 text-xs mt-1">{errores.dni}</p>
            )}
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email (opcional)"
              value={persona.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
                errores.email ? 'border-red-500' : 'border-gray-300 focus:border-indigo-500'
              }`}
            />
            {errores.email && (
              <p className="text-red-500 text-xs mt-1">{errores.email}</p>
            )}
          </div>

          <div>
            <input
              type="tel"
              name="telefono"
              placeholder="Teléfono (9 dígitos)"
              value={persona.telefono}
              onChange={handleChange}
              maxLength="9"
              className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
                errores.telefono ? 'border-red-500' : 'border-gray-300 focus:border-indigo-500'
              }`}
            />
            {errores.telefono && (
              <p className="text-red-500 text-xs mt-1">{errores.telefono}</p>
            )}
          </div>

          <div>
            <input
              type="date"
              name="ultimoPago"
              value={persona.ultimoPago}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
                errores.ultimoPago ? 'border-red-500' : 'border-gray-300 focus:border-indigo-500'
              }`}
            />
            {errores.ultimoPago && (
              <p className="text-red-500 text-xs mt-1">{errores.ultimoPago}</p>
            )}
          </div>

          <div>
            <input
              type="number"
              name="monto"
              placeholder="Monto (S/)"
              value={persona.monto}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
                errores.monto ? 'border-red-500' : 'border-gray-300 focus:border-indigo-500'
              }`}
            />
            {errores.monto && (
              <p className="text-red-500 text-xs mt-1">{errores.monto}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            disabled={subiendo}
            className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {subiendo ? 'Procesando...' : 'Guardar Persona'}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonaForm;