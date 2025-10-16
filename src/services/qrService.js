// src/services/qrService.js

const QRCode = require('qrcode');

export const generarQRCode = async (persona, alDia) => {
  // Crear datos del QR CON la foto
  const datosQR = {
    nombre: persona.nombre,
    dni: persona.dni,
    email: persona.email || '',
    telefono: persona.telefono,
    ultimoPago: persona.ultimoPago,
    monto: persona.monto,
    foto: persona.foto || '', // ✅ INCLUIR FOTO
    estado: alDia ? 'AL DÍA' : 'PENDIENTE',
    fechaGeneracion: new Date().toISOString(),
  };

  const textoQR = JSON.stringify(datosQR);

  try {
    // Generar QR localmente
    const qrDataUrl = await QRCode.toDataURL(textoQR, {
      width: 400,
      margin: 2,
      color: {
        dark: '#4F46E5',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'L' // ⚠️ Baja corrección para permitir más datos
    });
    
    console.log('✅ QR generado correctamente con foto');
    return qrDataUrl;
  } catch (error) {
    console.error('❌ Error generando QR:', error);
    
    // Si falla (foto muy grande), intentar sin foto
    console.warn('⚠️ Foto muy grande, generando QR sin foto');
    const datosQRSinFoto = { ...datosQR, foto: '' };
    const textoQRSinFoto = JSON.stringify(datosQRSinFoto);
    
    const qrDataUrl = await QRCode.toDataURL(textoQRSinFoto, {
      width: 400,
      margin: 2,
      color: {
        dark: '#4F46E5',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
    
    return qrDataUrl;
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