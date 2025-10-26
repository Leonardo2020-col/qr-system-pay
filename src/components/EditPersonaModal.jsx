// src/components/EditPersonaModal.jsx

import React, { useState, useEffect } from 'react';
import { X, Upload, Camera, Save, CheckSquare } from 'lucide-react';
import { validarPersona } from '../utils/validators';
import { comprimirImagen, validarTamañoImagen } from '../utils/imageUtils';

const EditPersonaModal = ({ persona, onGuardar, onCerrar }) => {
  const [datosEditados, setDatosEditados] = useState({
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    empadronado: false,
    monto: '',
    foto: '',
    foto_url: ''
  });

  const [errores, setErrores] = useState({});
  const [previsualizacion, setPrevisualizacion] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (persona) {
      setDatosEditados({
        nombre: persona.nombre || '',
        dni: persona.dni || '',
        email: persona.email || '',
        telefono: persona.telefono || '',
        empadronado: persona.empadronado || false,
        monto: persona.monto || '',
        foto: '',
        foto_url: persona.foto_url || ''
      });
      setPrevisualizacion(persona.foto_url || '');
    }
  }, [persona]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDatosEditados({ 
      ...datosEditados, 
      [name]: type === 'checkbox' ? checked : value 
    });
    
    if (errores[name]) {
      setErrores({ ...errores, [name]: null });
    }
  };

  const handleImagenChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        alert('La imagen es muy grande. Usa una imagen menor a 2MB.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Selecciona una imagen válida.');
        return;
      }

      setSubiendo(true);

      try {
        const base64Comprimido = await comprimirImagen(file, 150, 0.6);
        
        if (!validarTamañoImagen(base64Comprimido, 100)) {
          alert('La imagen es muy grande después de la compresión.');
          setSubiendo(false);
          return;
        }
        
        setDatosEditados({ ...datosEditados, foto: base64Comprimido });
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
    input.capture = 'environment';
    input.onchange = (e) => handleImagenChange(e);
    input.click();
  };

  const handleEliminarImagen = () => {
    setDatosEditados({ ...datosEditados, foto: '', foto_url: '' });
    setPrevisualizacion('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { valido, errores: nuevosErrores } = validarPersona(datosEditados);
    
    if (!valido) {
      setErrores(nuevosErrores);
      return;
    }

    setGuardando(true);
    try {
      await onGuardar(persona.id, datosEditados);
      onCerrar();
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  if (!persona) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Editar Persona</h2>
            <button
              onClick={onCerrar}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sección de foto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto del Cliente
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
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition shadow-md"
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
          </div>

          {/* Campos del formulario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="nombre"
                placeholder="Nombre completo"
                value={datosEditados.nombre}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DNI *
              </label>
              <input
                type="text"
                name="dni"
                placeholder="DNI (8 dígitos)"
                value={datosEditados.dni}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Email (opcional)"
                value={datosEditados.email}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                name="telefono"
                placeholder="Teléfono (9 dígitos)"
                value={datosEditados.telefono}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto (S/) *
              </label>
              <input
                type="number"
                name="monto"
                placeholder="Monto"
                value={datosEditados.monto}
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

            {/* Checkbox de Empadronado */}
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer bg-gray-50 px-4 py-2 border border-gray-300 rounded-lg hover:border-indigo-500 transition w-full">
                <input
                  type="checkbox"
                  name="empadronado"
                  checked={datosEditados.empadronado}
                  onChange={handleChange}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <CheckSquare 
                    size={20} 
                    className={datosEditados.empadronado ? 'text-green-600' : 'text-gray-400'} 
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {datosEditados.empadronado ? 'Empadronado' : 'No empadronado'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={subiendo || guardando}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium disabled:opacity-50"
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