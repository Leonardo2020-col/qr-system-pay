import React from 'react'; //
import { Search } from 'lucide-react';

const SearchBar = ({ busqueda, onBusquedaChange }) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 text-gray-400" size={20} />
      <input
        type="text"
        placeholder="Buscar por nombre o DNI..."
        value={busqueda}
        onChange={(e) => onBusquedaChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
      />
    </div>
  );
};

export default SearchBar;