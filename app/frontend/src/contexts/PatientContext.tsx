import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  assigned_program: string;
  week: number;
  access_allowed: boolean;
  login_alias?: string;
  problem_situation?: string;
}

interface PatientContextType {
  patient: Patient | null;
  loading: boolean;
  login: (patient: Patient) => void;
  logout: () => void;
}

const PatientContext = createContext<PatientContextType>({
  patient: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function usePatient() {
  return useContext(PatientContext);
}

function getStoredPatient(): Patient | null {
  try {
    const data = sessionStorage.getItem('patient');
    if (!data) return null;
    const parsed = JSON.parse(data);
    // Validate that it has the required fields
    if (parsed && typeof parsed.id === 'number' && typeof parsed.name === 'string' && typeof parsed.access_allowed === 'boolean') {
      return parsed as Patient;
    }
    // Invalid data, clear it
    sessionStorage.removeItem('patient');
    return null;
  } catch {
    sessionStorage.removeItem('patient');
    return null;
  }
}

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredPatient();
    setPatient(stored);
    setLoading(false);
  }, []);

  const login = (p: Patient) => {
    setPatient(p);
    sessionStorage.setItem('patient', JSON.stringify(p));
  };

  const logout = () => {
    setPatient(null);
    sessionStorage.removeItem('patient');
  };

  return (
    <PatientContext.Provider value={{ patient, loading, login, logout }}>
      {children}
    </PatientContext.Provider>
  );
}