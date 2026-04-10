import { createContext, useContext } from 'react';

// Provides ambient context to Fld AI generation
// clientName: ragione sociale del cliente selezionato
// sectionLabel: sezione/modulo corrente (es. "Registro Trattamenti")
// recordName: nome del record in editing (es. "Rapporto con i clienti")
export const AICtx = createContext({ clientName: '', sectionLabel: '', recordName: '' });
export const useAICtx = () => useContext(AICtx);

// Helper: merge context keeping parent values, override with provided ones
export function useAIRecord(overrides) {
  const parent = useAICtx();
  return { ...parent, ...overrides };
}
