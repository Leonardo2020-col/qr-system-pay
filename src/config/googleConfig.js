// src/config/googleConfig.js

export const GOOGLE_CONFIG = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
  spreadsheetId: process.env.REACT_APP_GOOGLE_SPREADSHEET_ID,
  scope: 'https://www.googleapis.com/auth/spreadsheets',
  discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
};

// Nombre de la hoja en Google Sheets
export const SHEET_NAME = 'Personas';

// Rango de columnas (A = nombre, B = DNI, C = email, etc.)
export const COLUMNS = {
  NOMBRE: 'A',
  DNI: 'B',
  EMAIL: 'C',
  TELEFONO: 'D',
  EMPADRONADO: 'E',
  MONTO: 'F',
  FOTO: 'G',
  FECHA: 'H',
};

// Rango completo para leer datos (ajustado a 8 columnas)
export const DATA_RANGE = `${SHEET_NAME}!A2:H`;

// Headers de la hoja (debe coincidir con el servicio googleSheetsSync.js)
export const HEADERS = [
  'Nombre', 
  'DNI', 
  'Email', 
  'Teléfono', 
  'Empadronado', 
  'Monto', 
  'Foto URL', 
  'Fecha Registro'
];