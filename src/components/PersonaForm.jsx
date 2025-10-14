// src/components/PersonaForm.jsx

import React, { useState } from 'react';
import { validarPersona } from '../utils/validators';
import { obtenerFechaActual } from '../utils/dateUtils';

const PersonaForm = ({ onAgregar, onCancelar }) => {
  const [persona, setPersona] = useState({
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    ultimoPago: obtenerFechaActual(),
    monto: '',
  });

  const [errores, setErrores] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPersona({ ...persona, [name]: value });
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errores[name]) {
      setErrores({ ...errores, [name]: null });
    }
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
    });
    setErrores({});
  };

  return (
    <div className="bg-gray-50 p-6 rounded-xl">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Nueva Persona</h3>
      <form onSubmit={handleSubmit}>
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
              placeholder="Email"
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
            className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium"
          >
            Guardar Persona
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