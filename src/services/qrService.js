// src/services/qrService.js

import QRCode from 'qrcode';

// Generar código QR
export const generarQRCode = async (persona, empadronado) => {
  try {
    const datosQR = {
      nombre: persona.nombre,
      dni: persona.dni,
      asociacion: persona.asociacion || 'Sin asociación',
      empadronado: empadronado,
      timestamp: new Date().toISOString(),
    };

    const qrDataString = JSON.stringify(datosQR);

    const qrUrl = await QRCode.toDataURL(qrDataString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrUrl;
  } catch (error) {
    console.error('Error generando QR:', error);
    throw error;
  }
};

// Descargar código QR
export const descargarQR = (qrUrl, nombreArchivo = 'codigo-qr.png') => {
  try {
    // Crear un elemento <a> temporal
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = nombreArchivo;
    
    // Agregar al DOM, hacer click y remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ QR descargado:', nombreArchivo);
  } catch (error) {
    console.error('❌ Error descargando QR:', error);
    alert('Error al descargar el código QR');
  }
};