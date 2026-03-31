import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

const LIFESTYLE_IMAGE = 'https://mgx-backend-cdn.metadl.com/generate/images/1015757/2026-03-10/85e847ef-d400-4e7f-99f0-4a916e7e13b0.png';

interface LifestyleSection {
  id: string;
  title: string;
  emoji: string;
  tips: string[];
}

const sections: LifestyleSection[] = [
  {
    id: 'vaiksciojimas',
    title: 'Vaikščiojimas',
    emoji: '🚶',
    tips: [
      'Vaikščiojimas – labai svarbi programos dalis',
      'Pradėkite nuo 5–10 min 1–2 kartus per dieną',
      'Ilgainiui siekite 20–30 min per dieną',
      'Svarbiausia – nuoseklumas, ne greitis',
    ],
  },
  {
    id: 'sedejimas',
    title: 'Sėdėjimas',
    emoji: '🪑',
    tips: [
      'Atsikelkite kas 45–60 minučių',
      'Pajudėkite bent 1–2 minutes',
      'Svarbu dažnai keisti kūno padėtį',
      'Kojos ant žemės, ekranas akių lygyje',
    ],
  },
  {
    id: 'miegas',
    title: 'Miegas',
    emoji: '😴',
    tips: [
      'Tikslas – 7,5–8 valandos miego',
      'Ant šono su pagalve tarp kelių',
      'Arba ant nugaros su pagalve po keliais',
      'Venkite miego ant pilvo',
    ],
  },
  {
    id: 'savistaba',
    title: 'Savistaba',
    emoji: '📝',
    tips: [
      'Stebėkite skausmą (1–10)',
      'Stebėkite judėjimo lengvumą',
      'Stebėkite energijos lygį',
      'Stebėkite reakciją į pratimus',
      'Kartą per savaitę įvertinkite bendrą progresą',
    ],
  },
];

function LifestyleCard({ section, defaultOpen = false }: { section: LifestyleSection; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl border border-[#E8E5E0] shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left active:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{section.emoji}</span>
          <h3 className="text-lg font-semibold text-[#2D3436]">{section.title}</h3>
        </div>
        {open ? <ChevronUp className="w-6 h-6 text-[#636E72]" /> : <ChevronDown className="w-6 h-6 text-[#636E72]" />}
      </button>
      {open && (
        <div className="px-5 pb-5">
          <ul className="space-y-3">
            {section.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#5B8A72]/10 flex items-center justify-center mt-0.5">
                  <span className="text-sm font-semibold text-[#5B8A72]">{i + 1}</span>
                </div>
                <p className="text-base text-[#2D3436] leading-relaxed pt-0.5">{tip}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Gyvensena() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAF8]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#FAFAF8] border-b border-[#E8E5E0] px-5 py-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#5B8A72] font-medium text-lg active:opacity-70"
        >
          <ArrowLeft className="w-6 h-6" />
          Grįžti
        </button>
      </div>

      <div className="px-5 py-6 pb-10">
        <img
          src={LIFESTYLE_IMAGE}
          alt="Gyvensena"
          className="w-full h-40 object-cover rounded-2xl mb-5"
        />

        <h1 className="text-2xl font-bold text-[#2D3436] mb-1">Gyvensena</h1>
        <p className="text-base text-[#636E72] mb-6">
          Paprasti kasdieniai įpročiai, kurie padeda mažinti nugaros skausmą.
        </p>

        <div className="space-y-4">
          {sections.map((section, i) => (
            <LifestyleCard key={section.id} section={section} defaultOpen={i === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}