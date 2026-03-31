import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { client } from '../lib/api';
import { Heart, LogIn, Loader2 } from 'lucide-react';

export default function Prisijungti() {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = usePatient();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = identifier.trim();
    if (!trimmed) {
      setError('Įveskite el. paštą, telefono numerį arba vartotojo vardą');
      return;
    }

    setLoading(true);
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/auth/patient-login',
        method: 'POST',
        data: { identifier: trimmed },
      });

      const patient = response.data;

      if (!patient.access_allowed) {
        login(patient);
        navigate('/prieiga-neleidziama');
        return;
      }

      login(patient);
      navigate('/');
    } catch (err: any) {
      const detail =
        err?.data?.detail ||
        err?.response?.data?.detail ||
        err?.message ||
        'Prisijungimo klaida. Bandykite dar kartą.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-5" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#5B8A72]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-[#5B8A72]" />
          </div>
          <h1 className="text-2xl font-bold text-[#2D3436]">Nugaros priežiūra</h1>
          <p className="text-base text-[#636E72] mt-2">
            Prisijunkite prie savo programos
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E5E0]">
          <label className="block text-sm font-medium text-[#2D3436] mb-2">
            El. paštas, telefono numeris arba vartotojo vardas
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setError('');
            }}
            placeholder="pvz. jonas@test.lt, +37061111111 arba rimute.b"
            className="w-full px-4 py-3 rounded-xl border border-[#E8E5E0] text-base text-[#2D3436] placeholder:text-[#636E72]/50 focus:outline-none focus:ring-2 focus:ring-[#5B8A72]/30 focus:border-[#5B8A72] transition-colors"
            autoComplete="email"
            autoFocus
          />

          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-[#5B8A72] text-white font-semibold py-3.5 rounded-xl text-base active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {loading ? 'Jungiamasi...' : 'Prisijungti'}
          </button>
        </form>

        <p className="text-center text-sm text-[#636E72]/60 mt-6">
          Jei neturite prieigos, informacija remotus.pro ar healthwf8@gmail.com
        </p>
      </div>
    </div>
  );
}