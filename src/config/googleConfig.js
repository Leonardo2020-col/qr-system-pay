// src/config/googleConfig.js

export const GOOGLE_CONFIG = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || null,
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY || null,
  spreadsheetId: process.env.REACT_APP_GOOGLE_SPREADSHEET_ID || null,
  scope: 'https://www.googleapis.com/auth/spreadsheets',
};

export const GOOGLE_SHEETS_ENABLED = !!(
  GOOGLE_CONFIG.clientId && 
  GOOGLE_CONFIG.apiKey && 
  GOOGLE_CONFIG.spreadsheetId
);

export const SHEET_NAME = 'Personas';

export const COLUMNS = {
  NOMBRE: 'A',
  DNI: 'B',
  ASOCIACION: 'C',
  EMPADRONADO: 'D',
  FOTO: 'E',
  FECHA: 'F',
};

export const DATA_RANGE = `${SHEET_NAME}!A2:F`;

export const HEADERS = [
  'Nombre', 
  'DNI', 
  'Asociación', 
  'Empadronado', 
  'Foto URL', 
  'Fecha Registro'
];