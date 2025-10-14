// src/services/qrService.js

export const generarQRCode = (persona, alDia) => {
  const datosQR = {
    nombre: persona.nombre,
    dni: persona.dni,
    email: persona.email,
    telefono: persona.telefono,
    ultimoPago: persona.ultimoPago,
    monto: persona.monto,
    estado: alDia ? 'AL DÍA' : 'PENDIENTE',
    fechaGeneracion: new Date().toISOString(),
  };

  const textoQR = JSON.stringify(datosQR);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(textoQR)}`;
  
  return qrUrl;
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