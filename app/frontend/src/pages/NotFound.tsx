import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="text-center max-w-sm">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold text-[#2D3436] mb-2">Puslapis nerastas</h1>
        <p className="text-base text-[#636E72] mb-6">
          Šis puslapis neegzistuoja. Grįžkite į pagrindinį puslapį.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-[#5B8A72] text-white text-lg font-semibold py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-sm flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-6 h-6" />
          Grįžti į pradžią
        </button>
      </div>
    </div>
  );
}