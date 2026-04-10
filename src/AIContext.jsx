import { createContext, useContext } from 'react';

// Provides ambient context to Fld components (client name, current section)
export const AICtx = createContext({ clientName: '', sectionLabel: '' });
export const useAICtx = () => useContext(AICtx);
