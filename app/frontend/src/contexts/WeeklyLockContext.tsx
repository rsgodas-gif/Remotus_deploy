import { createContext, useContext, ReactNode } from 'react';
import { usePatient } from './PatientContext';
import { useWeeklyLock } from '../hooks/useWeeklyLock';

interface WeeklyLockContextType {
  isLocked: boolean;
  loading: boolean;
  lastProgressDate: string | null;
  refresh: () => void;
}

const WeeklyLockContext = createContext<WeeklyLockContextType>({
  isLocked: false,
  loading: true,
  lastProgressDate: null,
  refresh: () => {},
});

export function useWeeklyLockContext() {
  return useContext(WeeklyLockContext);
}

export function WeeklyLockProvider({ children }: { children: ReactNode }) {
  const { patient } = usePatient();
  const lockState = useWeeklyLock(patient?.id);

  return (
    <WeeklyLockContext.Provider value={lockState}>
      {children}
    </WeeklyLockContext.Provider>
  );
}