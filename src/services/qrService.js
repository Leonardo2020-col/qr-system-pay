// src/services/qrService.js

import QRCode from 'qrcode';

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