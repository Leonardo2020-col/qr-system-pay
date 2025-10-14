// src/utils/dateUtils.js

export const verificarPagoAlDia = (fechaPago, diasLimite = 30) => {
  if (!fechaPago) return false;
  
  const hoy = new Date();
  const ultimoPago = new Date(fechaPago);
  
  if (isNaN(ultimoPago.getTime())) return false;
  
  const diferenciaDias = Math.floor((hoy - ultimoPago) / (1000 * 60 * 60 * 24));
  return diferenciaDias <= diasLimite;
};

export const formatearFecha = (fecha) => {
  if (!fecha) return '';
  
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const diasDesdeUltimoPago = (fechaPago) => {
  if (!fechaPago) return null;
  
  const hoy = new Date();
  const ultimoPago = new Date(fechaPago);
  
  if (isNaN(ultimoPago.getTime())) return null;
  
  return Math.floor((hoy - ultimoPago) / (1000 * 60 * 60 * 24));
};

export const obtenerFechaActual = () => {
  const hoy = new Date();
  return hoy.toISOString().split('T')[0];
};