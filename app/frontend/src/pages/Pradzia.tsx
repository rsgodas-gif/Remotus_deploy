import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Play } from 'lucide-react';
import { usePatient } from '../contexts/PatientContext';
import { client } from '../lib/api';

/** Same parsing as Pratimai.tsx — keep embed URLs consistent app-wide. */
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0] || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const vParam = parsed.searchParams.get('v');
      if (vParam) return vParam;
      const pathParts = parsed.pathname.split('/');
      if (pathParts[1] === 'embed' || pathParts[1] === 'shorts') {
        return pathParts[2] || null;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

// TODO: load video_link from API/programs by exercise name when backend exposes a stable lookup.
const RUTINA_EXERCISES = [
  {
    title: 'Klubo lenkiamųjų tempimas',
    dose: '30–40 sek. kiekvienai pusei',
    videoUrl: 'https://youtu.be/pX4IJXjK7N0',
  },
  {
    title: 'Atversta knyga gulint rankomis',
    dose: '6–8 kartai kiekvienai pusei',
    videoUrl: 'https://youtu.be/cmSa-iSgoEA',
  },
  {
    title: 'Tiltelis',
    dose: '12 kartų, viršuje palaikant 2 sek.',
    videoUrl: 'https://youtu.be/sUSfRs2nOkY',
  },
  {
    title: 'Modifikuotas liemens pakėlimas (McGill)',
    dose: '8 kartai kiekvienai pusei, palaikant 5 sek.',
    videoUrl: 'https://youtu.be/zYf4nxrW6dI',
  },
  {
    title: 'Kojos tiesimas atgal keturių taškų padėtyje',
    dose: '8–10 kartų kiekvienai pusei',
    videoUrl: 'https://youtu.be/pnb6rNdAdhs',
  },
  {
    title: 'Svėrimai per juosmenį į sieną (Hip hinge)',
    dose: '10 kartų',
    videoUrl: 'https://youtu.be/YLLlzyJcSvA',
  },
] as const;

function PainScale({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-10 sm:gap-2">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${
            value === n
              ? 'bg-[#5B8A72] text-white shadow-sm'
              : 'bg-white border border-[#E8E5E0] text-[#2D3436] active:scale-[0.98]'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function RoutineVideoBlock({ videoUrl }: { videoUrl: string }) {
  const videoId = getYouTubeId(videoUrl);
  if (!videoId) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 w-full flex items-center justify-center gap-2 bg-[#5B8A72] text-white font-semibold py-3 rounded-xl text-base active:scale-[0.98] transition-transform"
      >
        <Play className="w-5 h-5" fill="white" />
        Žiūrėti video
      </a>
    );
  }
  return (
    <div className="mt-3 relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title="Pratimo video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: 'none' }}
      />
    </div>
  );
}

const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export default function Pradzia() {
  const navigate = useNavigate();
  const { login } = usePatient();
  const [painBefore, setPainBefore] = useState<number | null>(null);
  const [activationDone, setActivationDone] = useState(false);
  const [email, setEmail] = useState('');
  const [loginAlias, setLoginAlias] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const routineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activationDone && routineRef.current) {
      routineRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activationDone]);

  const handleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (painBefore === null) return;
    const em = email.trim();
    const alias = loginAlias.trim().toLowerCase();
    if (!alias) {
      setSubmitError('Įveskite prisijungimo vardą.');
      return;
    }
    if (!/^[a-z0-9._-]{3,40}$/.test(alias)) {
      setSubmitError('Prisijungimo vardas turi būti 3–40 simbolių (a-z, 0-9, ., _, -).');
      return;
    }
    if (!emailOk(em)) {
      setSubmitError('Įveskite teisingą el. pašto adresą.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/auth/pradzia-complete',
        method: 'POST',
        data: {
          first_name: 'Nenurodyta',
          last_name: '-',
          email: em,
          login_alias: alias,
          pain_before: painBefore,
        },
      });
      const patient = response.data;
      if (!patient.access_allowed) {
        login(patient);
        navigate('/prieiga-neleidziama');
        return;
      }
      login(patient);
      setActivationDone(true);
    } catch (err: unknown) {
      const detail =
        (err as { data?: { detail?: string } })?.data?.detail ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err as Error)?.message ||
        'Įvyko klaida. Bandykite dar kartą.';
      setSubmitError(typeof detail === 'string' ? detail : 'Įvyko klaida.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] px-4 py-8 pb-16" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-lg mx-auto space-y-10">
        <header className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#2D3436] leading-tight">
            Sveiki atvykę į Be skausmo per 10 dienų
          </h1>
          <form onSubmit={handleForm} className="space-y-4 bg-white border border-[#E8E5E0] rounded-2xl p-5 shadow-sm text-left">
            <p className="text-[#2D3436] font-medium text-sm">Pradžiai sukurkite prisijungimą:</p>
            <div>
              <label className="block text-xs font-medium text-[#636E72] mb-1">El. paštas</label>
              <input
                required
                type="email"
                className="w-full rounded-xl border border-[#E8E5E0] px-3 py-2.5 text-[#2D3436]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="pvz. vardas@gmail.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#636E72] mb-1">Prisijungimo vardas</label>
              <input
                required
                className="w-full rounded-xl border border-[#E8E5E0] px-3 py-2.5 text-[#2D3436]"
                value={loginAlias}
                onChange={(e) => setLoginAlias(e.target.value)}
                autoComplete="username"
                placeholder="pvz. alina.g"
              />
            </div>
            <p className="text-[#2D3436] font-medium text-sm pt-1">
              Prieš pradedami įvertinkite balą nuo 1-10.
            </p>
            <PainScale value={painBefore} onChange={setPainBefore} />
            {submitError && <p className="text-sm text-red-600">{submitError}</p>}
            <button
              type="submit"
              disabled={submitting || painBefore === null}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-[#5B8A72] disabled:opacity-45 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Tęsti
            </button>
          </form>
        </header>

        {activationDone && (
          <section ref={routineRef} className="space-y-4">
            <p className="text-[#2D3436] text-base font-semibold leading-relaxed">
              Pradedame nuo trumpos 5 minučių mankštos sumažinti skausmą čia ir dabar!
            </p>
            <h2 className="text-xl font-bold text-[#2D3436]">Greita pradžios rutina</h2>
            <p className="text-[#636E72] text-sm leading-relaxed">
              Atlikite pratimus iš eilės. Neskubėkite. Tikslas – sumažinti sustingimą ir skausmą po ilgo sėdėjimo.
            </p>
            <ol className="space-y-5 list-none p-0 m-0">
              {RUTINA_EXERCISES.map((ex, i) => (
                <li key={ex.title} className="bg-white rounded-2xl p-4 border border-[#E8E5E0] shadow-sm">
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#5B8A72]/15 text-[#5B8A72] font-bold text-sm flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#2D3436] text-base">{ex.title}</h3>
                      <p className="text-sm text-[#5B8A72] font-medium mt-1">⏱ {ex.dose}</p>
                      <RoutineVideoBlock videoUrl={ex.videoUrl} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => navigate('/pratimai')}
              className="w-full py-4 rounded-2xl font-semibold text-lg text-white bg-[#5B8A72] shadow-sm active:scale-[0.99] transition-transform"
            >
              Tęsti į programą
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
