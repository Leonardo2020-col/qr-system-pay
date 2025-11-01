// src/components/LoginScreen.jsx

import React, { useState } from 'react';
import { Lock, QrCode, Eye, EyeOff } from 'lucide-react';

const LoginScreen = ({ onLoginSuccess, onScanMode }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Contraseña por defecto (cámbiala por la tuya)
  const CORRECT_PASSWORD = '12345';

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (password === CORRECT_PASSWORD) {
        onLoginSuccess();
      } else {
        setError('Contraseña incorrecta');
        setPassword('');
      }
      setLoading(false);
    }, 500);
  };

  const handleScanMode = () => {
    onScanMode();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-xl mb-4">
            <QrCode size={40} className="text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Sistema QR
          </h1>
          <p className="text-indigo-200">
            Control de Empadronamiento
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Input de contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye size={20} className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Botón de login */}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Acceder'}
            </button>
          </form>
        </div>

        {/* Botón de modo escanear */}
        <button
          onClick={handleScanMode}
          className="w-full bg-white/10 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-white/20 transition font-medium border border-white/30 flex items-center justify-center gap-2"
        >
          <QrCode size={20} />
          Solo Escanear (Sin Login)
        </button>

        {/* Footer */}
        <p className="text-center text-indigo-200 text-sm mt-6">
          Sistema de Gestión QR © 2025
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;