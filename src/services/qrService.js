// src/services/qrService.js

const QRCode = require('qrcode');

export const generarQRCode = async (persona, alDia) => {
  // Crear datos del QR SIN la foto
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
    // Primero intentar con la librería local
    const qrDataUrl = await QRCode.toDataURL(textoQR, {
      width: 400,
      margin: 2,
      color: {
        dark: '#4F46E5',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    console.log('✅ QR generado localmente');
    return qrDataUrl;
  } catch (error) {
    console.warn('⚠️ Error con librería local, usando API externa');
    
    // Fallback: Usar QuickChart API (sin límites y gratis)
    const encodedData = encodeURIComponent(textoQR);
    const qrUrl = `https://quickchart.io/qr?text=${encodedData}&size=400&margin=2&dark=4F46E5&light=FFFFFF`;
    
    console.log('✅ QR generado con QuickChart API');
    return qrUrl;
  }
};

export const descargarQR = async (qrUrl, nombreArchivo) => {
  try {
    // Si es una URL (API externa), descargar la imagen primero
    if (qrUrl.startsWith('http')) {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar el blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } else {
      // Si es Base64, descargar directamente
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Error descargando QR:', error);
    alert('Error al descargar el código QR');
  }
};

export const leerDatosQR = (textoQR) => {
  try {
    return JSON.parse(textoQR);
  } catch (error) {
    console.error('Error al leer QR:', error);
    return null;
  }
};