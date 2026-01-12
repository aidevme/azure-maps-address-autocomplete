import * as React from 'react';
import { PcfContextService } from './PcfContextService';

interface PcfContextProviderProps {
  pcfcontext: PcfContextService;
  children: React.ReactNode;
}

const PcfContext = React.createContext<PcfContextService | undefined>(undefined);

export const PcfContextProvider = ({ pcfcontext, children }: PcfContextProviderProps) => {
  return (
    <PcfContext.Provider value={pcfcontext}>
      {children}
    </PcfContext.Provider>
  );
};

export const usePcfContext = (): PcfContextService => {
  const context = React.useContext(PcfContext);
  if (!context) {
    throw new Error('usePcfContext must be used within a PcfContextProvider');
  }
  return context;
};