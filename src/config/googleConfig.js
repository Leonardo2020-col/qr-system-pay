// src/config/googleConfig.js
//
export const GOOGLE_CONFIG = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
  spreadsheetId: process.env.REACT_APP_SPREADSHEET_ID,
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
  ULTIMO_PAGO: 'E',
  MONTO: 'F',
};

// Rango completo para leer datos
export const DATA_RANGE = `${SHEET_NAME}!A2:F`;

// Headers de la hoja
export const HEADERS = ['Nombre', 'DNI', 'Email', 'Telefono', 'UltimoPago', 'Monto'];