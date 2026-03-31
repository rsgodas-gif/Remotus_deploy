import { usePatient } from '../contexts/PatientContext';
import { ShieldX, LogOut } from 'lucide-react';

export default function AccessDenied() {
  const { patient, logout } = usePatient();

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-5" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#2D3436] mb-2">
          Prieiga nesuteikta
        </h1>
        <p className="text-base text-[#636E72] mb-2">
          {patient?.name ? `Sveiki, ${patient.name}.` : ''}
        </p>
        <p className="text-base text-[#636E72] mb-6">
          Jūsų prieiga prie programos šiuo metu yra išjungta. Kreipkitės į savo gydytoją dėl prieigos suteikimo.
        </p>
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 mx-auto bg-white text-[#636E72] font-medium py-3 px-6 rounded-xl border border-[#E8E5E0] active:scale-[0.98] transition-all"
        >
          <LogOut className="w-5 h-5" />
          Atsijungti
        </button>
      </div>
    </div>
  );
}