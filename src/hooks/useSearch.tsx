'use client';
import React, { createContext, useState, useContext } from 'react';
import { useDebounce } from './use-debounce';


const SearchContext = createContext({
  searchTerm: '',
  setSearchTerm: (term: string) => {},
  debouncedSearchTerm: '',
});

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm, debouncedSearchTerm }}>
      {children}
    </SearchContext.Provider>
  );
};
