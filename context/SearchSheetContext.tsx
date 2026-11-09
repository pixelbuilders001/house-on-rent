'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SearchSheetContextType {
  isSearchSheetOpen: boolean;
  openSearchSheet: () => void;
  closeSearchSheet: () => void;
  toggleSearchSheet: () => void;
}

const SearchSheetContext = createContext<SearchSheetContextType>({
  isSearchSheetOpen: false,
  openSearchSheet: () => {},
  closeSearchSheet: () => {},
  toggleSearchSheet: () => {},
});

export function SearchSheetProvider({ children }: { children: React.ReactNode }) {
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);
  const pathname = usePathname();

  // Close search sheet when navigation occurs
  useEffect(() => {
    setIsSearchSheetOpen(false);
  }, [pathname]);

  const openSearchSheet = useCallback(() => {
    setIsSearchSheetOpen(true);
  }, []);

  const closeSearchSheet = useCallback(() => {
    setIsSearchSheetOpen(false);
  }, []);

  const toggleSearchSheet = useCallback(() => {
    setIsSearchSheetOpen((prev) => !prev);
  }, []);

  return (
    <SearchSheetContext.Provider
      value={{
        isSearchSheetOpen,
        openSearchSheet,
        closeSearchSheet,
        toggleSearchSheet,
      }}
    >
      {children}
    </SearchSheetContext.Provider>
  );
}

export function useSearchSheet() {
  const ctx = useContext(SearchSheetContext);
  if (!ctx) {
    throw new Error('useSearchSheet must be used within a SearchSheetProvider');
  }
  return ctx;
}
