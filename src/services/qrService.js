// src/services/qrService.js

import QRCode from 'qrcode';

export const generarQRCode = async (persona, alDia) => {
  // Crear datos del QR SIN la foto para reducir tamaño
  const datosQR = {
    nombre: persona.nombre,
    dni: persona.dni,
    email: persona.email || '',
    telefono: persona.telefono,
    ultimoPago: persona.ultimoPago,
    monto: persona.monto,
    estado: alDia ? 'AL DÍA' : 'PENDIENTE',
    fechaGeneracion: new Date().toISOString(),
  };

  const textoQR = JSON.stringify(datosQR);

  try {
    // Generar QR localmente usando qrcode
    const qrDataUrl = await QRCode.toDataURL(textoQR, {
      width: 400,
      margin: 2,
      color: {
        dark: '#4F46E5', // Color indigo
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // Alta corrección de errores
    });
    
    console.log('✅ QR generado correctamente');
    return qrDataUrl;
  } catch (error) {
    console.error('❌ Error generando QR:', error);
    throw error;
  }
};

export const descargarQR = (qrUrl, nombreArchivo) => {
  const link = document.createElement('a');
  link.href = qrUrl;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const leerDatosQR = (textoQR) => {
  try {
    return JSON.parse(textoQR);
  } catch (error) {
    console.error('Error al leer QR:', error);
    return null;
  }
};