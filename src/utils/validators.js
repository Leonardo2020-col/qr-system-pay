// src/utils/validators.js

export const validarEmail = (email) => {
  // Si está vacío, es válido (campo opcional)
  if (!email || email.trim() === '') return true;
  
  // Si tiene contenido, validar formato
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validarDNI = (dni) => {
  // Para Perú: 8 dígitos
  const regex = /^\d{8}$/;
  return regex.test(dni);
};

export const validarTelefono = (telefono) => {
  // Para Perú: 9 dígitos
  const regex = /^\d{9}$/;
  return regex.test(telefono);
};

export const validarNombre = (nombre) => {
  return nombre && nombre.trim().length >= 3;
};

export const validarMonto = (monto) => {
  return !isNaN(monto) && parseFloat(monto) > 0;
};

export const validarFecha = (fecha) => {
  if (!fecha) return false;
  const date = new Date(fecha);
  return !isNaN(date.getTime());
};

export const validarPersona = (persona) => {
  const errores = {};

  if (!validarNombre(persona.nombre)) {
    errores.nombre = 'El nombre debe tener al menos 3 caracteres';
  }

  if (!validarDNI(persona.dni)) {
    errores.dni = 'El DNI debe tener 8 dígitos';
  }

  // Solo validar email si tiene contenido
  if (persona.email && persona.email.trim() !== '' && !validarEmail(persona.email)) {
    errores.email = 'Email inválido';
  }

  if (!validarTelefono(persona.telefono)) {
    errores.telefono = 'El teléfono debe tener 9 dígitos';
  }

  if (!validarFecha(persona.ultimoPago)) {
    errores.ultimoPago = 'Fecha inválida';
  }

  if (!validarMonto(persona.monto)) {
    errores.monto = 'El monto debe ser mayor a 0';
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores,
  };
};