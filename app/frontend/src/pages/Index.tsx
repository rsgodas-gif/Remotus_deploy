import { useNavigate } from 'react-router-dom';
import { Heart, Dumbbell, Apple, Sun, AlertCircle, BarChart3, PlayCircle, LogOut, User } from 'lucide-react';
import { usePatient } from '../contexts/PatientContext';

const HERO_IMAGE = 'https://mgx-backend-cdn.metadl.com/generate/images/1015757/2026-03-10/87f7ae28-be33-4933-b4f5-bea8209191f2.png';

interface NavCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  accent?: string;
  priority?: boolean;
}

function NavCard({ title, description, icon, path, accent = '#5B8A72', priority = false }: NavCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className={`w-full text-left rounded-2xl p-5 shadow-sm border transition-all duration-200 active:scale-[0.98] ${
        priority
          ? 'bg-[#5B8A72] text-white border-[#4a7a62] shadow-md'
          : 'bg-white text-[#2D3436] border-[#E8E5E0] hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: priority ? 'rgba(255,255,255,0.2)' : `${accent}1A` }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-semibold ${priority ? 'text-white' : 'text-[#2D3436]'}`}>
            {title}
          </h3>
          <p className={`text-sm mt-0.5 ${priority ? 'text-white/80' : 'text-[#636E72]'}`}>
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function HomePage() {
  const { patient, logout } = usePatient();

  return (
    <div className="min-h-screen bg-[#FAFAF8]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Nugaros priežiūra"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FAFAF8]" />
      </div>

      <div className="px-5 pb-10 -mt-6 relative z-10">
        {/* Welcome */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E5E0] mb-6">
          {/* Patient info bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#5B8A72]/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-[#5B8A72]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2D3436]">{patient?.name}</p>
                <p className="text-xs text-[#636E72]">
                  {patient?.assigned_program} · {patient?.week} savaitė
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-[#636E72] bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors active:scale-[0.97]"
            >
              <LogOut className="w-4 h-4" />
              Atsijungti
            </button>
          </div>

          <h1 className="text-2xl font-bold text-[#2D3436] mb-3">
            Sveiki! 👋
          </h1>
          {patient?.problem_situation ? (
            <div className="mb-3 p-3 bg-[#F0F4F2] rounded-xl border border-[#D4E2DA]">
              <p className="text-xs font-semibold text-[#5B8A72] uppercase tracking-wide mb-1">Probleminė situacija</p>
              <p className="text-sm text-[#2D3436] font-medium">{patient.problem_situation}</p>
            </div>
          ) : null}
          <p className="text-base text-[#636E72] leading-relaxed">
            Ši programa skirta padėti sumažinti nugaros skausmą ir grąžinti daugiau laisvo judėjimo kasdienybėje.
          </p>
          <p className="text-base text-[#636E72] leading-relaxed mt-2">
            Programoje rasite pratimus, vaizdo įrašus, mitybos rekomendacijas, gyvensenos patarimus ir veiksmus, ką daryti skausmui paūmėjus.
          </p>
          <div className="mt-4 p-3 bg-[#5B8A72]/10 rounded-xl">
            <p className="text-base text-[#5B8A72] font-medium">
              💡 Jei naudojatės pirmą kartą, pradėkite nuo skilties „Kaip naudotis programa?"
            </p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="space-y-3">
          <NavCard
            title="Pratimai"
            description="Pratimų planas ir vaizdo įrašai"
            icon={<Dumbbell className="w-7 h-7 text-white" />}
            path="/pratimai"
            priority
          />
          <NavCard
            title="Kaip naudotis programa?"
            description="Pradėti programą"
            icon={<PlayCircle className="w-7 h-7 text-[#5B8A72]" />}
            path="/pradeti"
            accent="#5B8A72"
          />
          <NavCard
            title="Mityba"
            description="Mitybos rekomendacijos"
            icon={<Apple className="w-7 h-7 text-[#6B9BD2]" />}
            path="/mityba"
            accent="#6B9BD2"
          />
          <NavCard
            title="Gyvensena"
            description="Kasdieniai įpročiai"
            icon={<Sun className="w-7 h-7 text-[#E8A87C]" />}
            path="/gyvensena"
            accent="#E8A87C"
          />
          <NavCard
            title="Skausmo paūmėjimas"
            description="Ką daryti, kai skauda labiau"
            icon={<AlertCircle className="w-7 h-7 text-[#E8A87C]" />}
            path="/skausmo-paumejimas"
            accent="#E8A87C"
          />
          <NavCard
            title="Savaitės progresas"
            description="Savaitinis įsivertinimas"
            icon={<BarChart3 className="w-7 h-7 text-[#7FB3D3]" />}
            path="/progresas"
            accent="#7FB3D3"
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#636E72]/60">
            Nugaros skausmo mažinimo programa
          </p>
        </div>
      </div>
    </div>
  );
}