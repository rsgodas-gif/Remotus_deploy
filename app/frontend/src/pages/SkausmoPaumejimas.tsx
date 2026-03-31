import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Phone } from 'lucide-react';

interface FlareLevel {
  level: number;
  title: string;
  description: string;
  emoji: string;
  color: string;
  exercises: string[];
}

const flareLevels: FlareLevel[] = [
  {
    level: 1,
    title: '1 lygis – labai didelis skausmas',
    description: 'Kai skausmas labai stiprus ir sunku judėti',
    emoji: '🔴',
    color: '#E8A87C',
    exercises: [
      'Diafragminis kvėpavimas – 3–5 min',
      'Dubens pakreipimai – labai švelniai',
      'Kelio pritraukimas prie krūtinės – po 5–6 kartus',
      'Vaiko poza – 30–45 s',
      'Trumpi pasivaikščiojimai kas 30–60 min',
    ],
  },
  {
    level: 2,
    title: '2 lygis – skausmas mažesnis, bet išlieka',
    description: 'Kai skausmas šiek tiek sumažėjo, bet dar jaučiamas',
    emoji: '🟡',
    color: '#E8C87C',
    exercises: [
      'Diafragminis kvėpavimas – 2 min',
      'Dubens pakreipimai – 2 min',
      'Keturių taškų siūbavimas – 2 min',
      'Dinaminis pilvo įtempimas – švelniai',
      'Sėdmenų tiltas – 8 kartus × 2',
      'Blauzdos tempimas – 1–2 min',
      'Vaiko poza – 45 s',
      'Vaikščiojimas 10–15 min',
    ],
  },
  {
    level: 3,
    title: '3 lygis – pagerėjimas',
    description: 'Kai jaučiatės geriau ir galite daugiau judėti',
    emoji: '🟢',
    color: '#5B8A72',
    exercises: [
      'Grįžkite prie pilno pratimų plano',
      'Pradėkite nuo mažesnio intensyvumo',
      'Stebėkite savijautą po pratimų',
      'Jei skausmas grįžta – grįžkite prie 2 lygio',
      'Vaikščiojimas 15–20 min',
    ],
  },
];

function FlareLevelCard({ flareLevel }: { flareLevel: FlareLevel }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-[#E8E5E0] shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left active:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{flareLevel.emoji}</span>
          <div>
            <h3 className="text-base font-semibold text-[#2D3436]">{flareLevel.title}</h3>
            <p className="text-sm text-[#636E72] mt-0.5">{flareLevel.description}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-6 h-6 text-[#636E72] flex-shrink-0" /> : <ChevronDown className="w-6 h-6 text-[#636E72] flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5">
          <ul className="space-y-2">
            {flareLevel.exercises.map((ex, i) => (
              <li key={i} className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: flareLevel.color + '20' }}
                >
                  <span className="text-xs font-bold" style={{ color: flareLevel.color }}>{i + 1}</span>
                </div>
                <p className="text-base text-[#2D3436]">{ex}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SkausmoPaumejimas() {
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
        <h1 className="text-2xl font-bold text-[#2D3436] mb-1">Skausmo paūmėjimas</h1>
        <p className="text-base text-[#636E72] mb-6">
          Ką daryti, kai nugaros skausmas sustiprėja.
        </p>

        {/* Main idea */}
        <div className="bg-[#6B9BD2]/10 rounded-2xl p-5 border border-[#6B9BD2]/20 mb-4">
          <h3 className="text-base font-semibold text-[#6B9BD2] mb-2">💡 Pagrindinė idėja</h3>
          <p className="text-base text-[#2D3436] leading-relaxed">
            Kai skausmas labai stiprus, daugiau dėmesio skiriama švelniam judesiui, tempimui ir dažnam pajudėjimui. Kai skausmas mažėja, po truputį grįžtama prie stiprinimo.
          </p>
        </div>

        {/* What to do */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8E5E0] shadow-sm mb-4">
          <h3 className="text-base font-semibold text-[#2D3436] mb-3">📋 Ką daryti paūmėjimo metu</h3>
          <ul className="space-y-2">
            {[
              'Kuo dažniau švelniai judėti',
              'Vengti ilgo sėdėjimo ar gulėjimo vienoje padėtyje',
              'Trumpai ir dažnai vaikščioti',
              'Rinktis lengvesnį pratimų lygį pagal savijautą',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-base text-[#2D3436]">
                <span className="text-[#5B8A72] font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Flare-up levels */}
        <h2 className="text-lg font-semibold text-[#2D3436] mb-3 mt-6">Pratimų lygiai pagal skausmą</h2>
        <div className="space-y-3">
          {flareLevels.map((level) => (
            <FlareLevelCard key={level.level} flareLevel={level} />
          ))}
        </div>

        {/* When to seek help */}
        <div className="mt-6 bg-[#E8A87C]/10 rounded-2xl p-5 border border-[#E8A87C]/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-[#E8A87C]" />
            <h3 className="text-base font-semibold text-[#E8A87C]">Kada kreiptis pagalbos</h3>
          </div>
          <ul className="space-y-2">
            {[
              'Jei skausmas labai stiprus ir nemažėja',
              'Jei atsiranda ryškus kojos silpnumas',
              'Jei sutrinka šlapinimasis ar tuštinimasis',
              'Jei atsiranda kiti neraminantys simptomai',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-base text-[#2D3436]">
                <span className="text-[#E8A87C] font-bold mt-0.5">!</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 p-3 bg-white rounded-xl flex items-center gap-3">
            <Phone className="w-5 h-5 text-[#E8A87C]" />
            <p className="text-base font-medium text-[#2D3436]">
              Kreipkitės į savo gydytoją
            </p>
          </div>
        </div>

        {/* Medication note */}
        <div className="mt-4 p-4 bg-[#F5F5F3] rounded-xl border border-[#E8E5E0]">
          <p className="text-sm text-[#636E72] leading-relaxed">
            ℹ️ Dėl vaistų vartojimo visada sekite savo gydytojo rekomendacijas. Ši programa nėra skirta vaistų skyrimui.
          </p>
        </div>
      </div>
    </div>
  );
}