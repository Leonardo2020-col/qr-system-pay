// src/hooks/useSupabase.js

import { useState, useEffect, useCallback } from 'react';
import supabaseService from '../services/supabaseService';

export const useSupabase = () => {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarPersonas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supabaseService.obtenerPersonas();
      
      // Transformar datos para mantener compatibilidad con componentes
      const personasTransformadas = data.map(p => ({
        id: p.id,
        nombre: p.nombre,
        dni: p.dni,
        email: p.email || '',
        telefono: p.telefono,
        empadronado: p.empadronado,
        monto: parseFloat(p.monto),
        foto: p.foto_url || '',
        foto_url: p.foto_url || '',
        created_at: p.created_at,
      }));
      
      setPersonas(personasTransformadas);
    } catch (err) {
      setError('Error al cargar personas: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const agregarPersona = useCallback(async (persona) => {
    try {
      setLoading(true);
      setError(null);
      await supabaseService.agregarPersona(persona);
      await cargarPersonas();
      return true;
    } catch (err) {
      setError('Error al agregar persona: ' + err.message);
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [cargarPersonas]);

  const actualizarPersona = useCallback(async (id, persona) => {
    try {
      setLoading(true);
      setError(null);
      await supabaseService.actualizarPersona(id, persona);
      await cargarPersonas();
      return true;
    } catch (err) {
      setError('Error al actualizar persona: ' + err.message);
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [cargarPersonas]);

  const eliminarPersona = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await supabaseService.eliminarPersona(id);
      await cargarPersonas();
      return true;
    } catch (err) {
      setError('Error al eliminar persona: ' + err.message);
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [cargarPersonas]);

  // Cargar personas al montar el componente
  useEffect(() => {
    cargarPersonas();
  }, [cargarPersonas]);

  return {
    personas,
    loading,
    error,
    cargarPersonas,
    agregarPersona,
    actualizarPersona,
    eliminarPersona,
  };
};