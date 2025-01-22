'use client';

import { createContext, useContext, useState } from 'react';

interface LibraryContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const LibraryContext = createContext<LibraryContextType>({
  searchQuery: '',
  setSearchQuery: () => {},
});

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <LibraryContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </LibraryContext.Provider>
  );
}

export const useLibrary = () => useContext(LibraryContext); 