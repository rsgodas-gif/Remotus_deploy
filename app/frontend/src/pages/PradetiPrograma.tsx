import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

const steps = [
  { number: 1, text: 'Pradėkite nuo pratimų plano', emoji: '🏋️' },
  { number: 2, text: 'Žiūrėkite vaizdo įrašus ir atlikite pratimus', emoji: '📹' },
  { number: 3, text: 'Laikykitės jums tinkamo mitybos lygio', emoji: '🥗' },
  { number: 4, text: 'Įgyvendinkite gyvensenos įpročius', emoji: '🌿' },
  { number: 5, text: 'Jei skausmas paūmėja – naudokite paūmėjimo skyrių', emoji: '⚡' },
  { number: 6, text: 'Kartą per savaitę įvertinkite progresą', emoji: '📊' },
];

export default function PradetiPrograma() {
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
        <h1 className="text-2xl font-bold text-[#2D3436] mb-2">
          Kaip naudotis programa
        </h1>
        <p className="text-base text-[#636E72] mb-6">
          Sekite šiuos paprastus žingsnius:
        </p>

        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white rounded-2xl p-5 border border-[#E8E5E0] shadow-sm flex items-start gap-4"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#5B8A72]/10 flex items-center justify-center text-2xl">
                {step.emoji}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm text-[#5B8A72] font-semibold mb-1">
                  {step.number} žingsnis
                </p>
                <p className="text-base text-[#2D3436] font-medium leading-relaxed">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button
            onClick={() => navigate('/pratimai')}
            className="w-full bg-[#5B8A72] text-white text-lg font-semibold py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-6 h-6" />
            Pradėti pratimus
          </button>
        </div>
      </div>
    </div>
  );
}