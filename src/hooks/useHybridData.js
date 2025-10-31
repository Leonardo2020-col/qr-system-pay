// src/hooks/useHybridData.js

import { useState, useEffect, useCallback } from 'react';
import supabaseService from '../services/supabaseService';
import googleSheetsSync from '../services/googleSheetsSync';

export const useHybridData = () => {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [googleSheetsReady, setGoogleSheetsReady] = useState(false);
  const [googleSheetsAuth, setGoogleSheetsAuth] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    const initGoogle = async () => {
      const initialized = await googleSheetsSync.initialize();
      setGoogleSheetsReady(initialized);
      if (initialized) {
        setGoogleSheetsAuth(googleSheetsSync.isAuthenticated());
      }
    };
    initGoogle();
  }, []);

  const cargarPersonas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supabaseService.obtenerPersonas();
      
      const personasTransformadas = data.map(p => ({
        id: p.id,
        nombre: p.nombre,
        dni: p.dni,
        asociacion: p.asociacion || 'Sin asociación',
        empadronado: p.empadronado,
        foto: p.foto_url || '',
        foto_url: p.foto_url || '',
        created_at: p.created_at,
      }));
      
      setPersonas(personasTransformadas);
      return personasTransformadas;
    } catch (err) {
      setError('Error al cargar personas: ' + err.message);
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const sincronizarConGoogleSheets = useCallback(async (personasData) => {
    console.log('🔄 Iniciando sincronización desde hook...');
    
    const estaAutenticado = googleSheetsSync.isAuthenticated();
    console.log('🔍 Estado de autenticación:', estaAutenticado);
    
    if (!estaAutenticado) {
      const error = 'No autenticado con Google Sheets';
      console.error('❌', error);
      throw new Error(error);
    }

    try {
      setSincronizando(true);
      const datosParaSincronizar = personasData || personas;
      
      console.log('📊 Datos a sincronizar:', datosParaSincronizar.length);
      
      await googleSheetsSync.sincronizarAGoogleSheets(datosParaSincronizar);
      
      console.log('✅ Sincronización completada');
      return true;
    } catch (err) {
      console.error('❌ Error en sincronización:', err);
      throw new Error(`Error al sincronizar: ${err.message}`);
    } finally {
      setSincronizando(false);
    }
  }, [personas]);

  const agregarPersona = useCallback(async (persona) => {
    try {
      setLoading(true);
      setError(null);
      await supabaseService.agregarPersona(persona);
      const personasActualizadas = await cargarPersonas();
      
      if (googleSheetsSync.isAuthenticated()) {
        try {
          await sincronizarConGoogleSheets(personasActualizadas);
        } catch (syncError) {
          console.warn('No se pudo sincronizar con Google Sheets:', syncError);
        }
      }
      
      return true;
    } catch (err) {
      setError('Error al agregar persona: ' + err.message);
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [cargarPersonas, sincronizarConGoogleSheets]);

  const actualizarPersona = useCallback(async (id, persona) => {
    try {
      setLoading(true);
      setError(null);
      await supabaseService.actualizarPersona(id, persona);
      const personasActualizadas = await cargarPersonas();
      
      if (googleSheetsSync.isAuthenticated()) {
        try {
          await sincronizarConGoogleSheets(personasActualizadas);
        } catch (syncError) {
          console.warn('No se pudo sincronizar con Google Sheets:', syncError);
        }
      }
      
      return true;
    } catch (err) {
      setError('Error al actualizar persona: ' + err.message);
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [cargarPersonas, sincronizarConGoogleSheets]);

  const eliminarPersona = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await supabaseService.eliminarPersona(id);
      const personasActualizadas = await cargarPersonas();
      
      if (googleSheetsSync.isAuthenticated()) {
        try {
          await sincronizarConGoogleSheets(personasActualizadas);
        } catch (syncError) {
          console.warn('No se pudo sincronizar con Google Sheets:', syncError);
        }
      }
      
      return true;
    } catch (err) {
      setError('Error al eliminar persona: ' + err.message);
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [cargarPersonas, sincronizarConGoogleSheets]);

  const conectarGoogleSheets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Iniciando conexión con Google Sheets...');
      
      await googleSheetsSync.signIn();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const estaAutenticado = googleSheetsSync.isAuthenticated();
      console.log('✅ Estado después de signIn:', estaAutenticado);
      
      setGoogleSheetsAuth(estaAutenticado);
      
      if (!estaAutenticado) {
        throw new Error('La autenticación no se completó correctamente');
      }
      
      if (personas.length > 0) {
        console.log('📊 Sincronizando personas existentes...');
        await sincronizarConGoogleSheets(personas);
      }
      
      return true;
    } catch (err) {
      const errorMsg = 'Error al conectar con Google Sheets: ' + err.message;
      setError(errorMsg);
      console.error('❌', errorMsg);
      setGoogleSheetsAuth(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [personas, sincronizarConGoogleSheets]);

  const desconectarGoogleSheets = useCallback(() => {
    googleSheetsSync.signOut();
    setGoogleSheetsAuth(false);
    setError(null);
  }, []);

  useEffect(() => {
    cargarPersonas();
  }, [cargarPersonas]);

  return {
    personas,
    loading,
    error,
    sincronizando,
    googleSheetsReady,
    googleSheetsAuth,
    cargarPersonas,
    agregarPersona,
    actualizarPersona,
    eliminarPersona,
    sincronizarConGoogleSheets,
    conectarGoogleSheets,
    desconectarGoogleSheets,
  };
};