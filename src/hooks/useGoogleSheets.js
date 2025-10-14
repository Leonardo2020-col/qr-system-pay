// src/hooks/useGoogleSheets.js

import { useState, useEffect, useCallback } from 'react';
import googleSheetsService from '../services/googleSheets';

export const useGoogleSheets = () => {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar Google API
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await googleSheetsService.initialize();
        setIsInitialized(true);
        setIsAuthenticated(googleSheetsService.checkSignInStatus());
      } catch (err) {
        setError('Error al inicializar Google Sheets');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Iniciar sesión
  const signIn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await googleSheetsService.signIn();
      setIsAuthenticated(true);
    } catch (err) {
      setError('Error al iniciar sesión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cerrar sesión
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await googleSheetsService.signOut();
      setIsAuthenticated(false);
      setPersonas([]);
    } catch (err) {
      setError('Error al cerrar sesión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar personas
  const cargarPersonas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await googleSheetsService.leerPersonas();
      setPersonas(data);
    } catch (err) {
      setError('Error al cargar personas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Agregar persona
  const agregarPersona = useCallback(async (persona) => {
    try {
      setLoading(true);
      setError(null);
      await googleSheetsService.agregarPersona(persona);
      await cargarPersonas();
      return true;
    } catch (err) {
      setError('Error al agregar persona');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [cargarPersonas]);

  // Actualizar persona
  const actualizarPersona = useCallback(async (index, persona) => {
    try {
      setLoading(true);
      setError(null);
      await googleSheetsService.actualizarPersona(index, persona);
      await cargarPersonas();
      return true;
    } catch (err) {
      setError('Error al actualizar persona');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [cargarPersonas]);

  // Eliminar persona
  const eliminarPersona = useCallback(async (index) => {
    try {
      setLoading(true);
      setError(null);
      await googleSheetsService.eliminarPersona(index);
      await cargarPersonas();
      return true;
    } catch (err) {
      setError('Error al eliminar persona');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [cargarPersonas]);

  return {
    personas,
    loading,
    error,
    isAuthenticated,
    isInitialized,
    signIn,
    signOut,
    cargarPersonas,
    agregarPersona,
    actualizarPersona,
    eliminarPersona,
  };
};