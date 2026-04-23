import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Check, ChevronDown, ChevronUp, Loader2, X } from 'lucide-react';
import { usePatient } from '../contexts/PatientContext';
import { client } from '../lib/api';

const EXERCISE_IMAGE = 'https://mgx-backend-cdn.metadl.com/generate/images/1015757/2026-03-10/ca963e1e-2863-4d73-b9cb-d7476a162e90.png';

interface ProgramExercise {
  id: number;
  program_name: string;
  week: number;
  exercise_group: string;
  exercise_group_emoji: string;
  exercise_group_order: number;
  exercise_name: string;
  time_reps: string;
  video_link: string;
  short_instruction: string;
  exercise_order: number;
}

interface ExerciseGroup {
  title: string;
  emoji: string;
  order: number;
  exercises: ProgramExercise[];
}

interface DayExercise {
  id: number;
  day_number: number;
  order_index: number;
  exercise_name: string;
  sets: string;
  reps_or_time: string;
  instructions: string[];
  video_link?: string;
  completed: boolean;
}

interface ProgramDayState {
  day_number: number;
  locked: boolean;
  completed: boolean;
  all_exercises_completed: boolean;
  pain_today: number | null;
  exercises: DayExercise[];
}

interface BeSkausmoState {
  title: string;
  unlocked_day: number;
  program_completed: boolean;
  days: ProgramDayState[];
}

function doneDayWord(n: number): string {
  return n === 1 ? 'dieną' : 'dienas';
}

function remainingDayWord(n: number): string {
  return n === 1 ? 'diena' : 'dienos';
}

/**
 * Extract YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    // youtu.be short links
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0] || null;
    }
    // youtube.com variants
    if (parsed.hostname.includes('youtube.com')) {
      // /watch?v=ID
      const vParam = parsed.searchParams.get('v');
      if (vParam) return vParam;
      // /embed/ID or /shorts/ID
      const pathParts = parsed.pathname.split('/');
      if (pathParts[1] === 'embed' || pathParts[1] === 'shorts') {
        return pathParts[2] || null;
      }
    }
  } catch {
    // not a valid URL
  }
  return null;
}

function YouTubeEmbed({ videoUrl, onClose }: { videoUrl: string; onClose: () => void }) {
  const videoId = getYouTubeId(videoUrl);

  if (!videoId) {
    // Fallback: open in new tab if we can't parse the URL
    return (
      <div className="mt-3">
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-[#5B8A72] text-white font-semibold py-3 rounded-xl text-base active:scale-[0.98] transition-transform"
        >
          <Play className="w-5 h-5" fill="white" />
          Žiūrėti video
        </a>
      </div>
    );
  }

  return (
    <div className="mt-3 relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#5B8A72]">▶ Video</span>
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-sm text-[#636E72] active:opacity-70"
        >
          <X className="w-4 h-4" />
          Uždaryti
        </button>
      </div>
      <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title="Pratimo video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
}

function getCompletedExercises(patientId: number): Record<string, boolean> {
  try {
    const data = localStorage.getItem(`completedExercises_${patientId}`);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveCompletedExercises(patientId: number, completed: Record<string, boolean>) {
  localStorage.setItem(`completedExercises_${patientId}`, JSON.stringify(completed));
}

function ExerciseCard({ exercise, completed, onToggle }: {
  exercise: ProgramExercise;
  completed: boolean;
  onToggle: () => void;
}) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className={`bg-white rounded-xl p-4 border transition-colors ${completed ? 'border-[#5B8A72] bg-[#5B8A72]/5' : 'border-[#E8E5E0]'}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center mt-0.5 transition-colors ${
            completed
              ? 'bg-[#5B8A72] border-[#5B8A72]'
              : 'border-[#D1D5DB] bg-white'
          }`}
          aria-label={completed ? 'Pažymėti kaip neatliktą' : 'Pažymėti kaip atliktą'}
        >
          {completed && <Check className="w-5 h-5 text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <h4 className={`text-base font-semibold ${completed ? 'text-[#5B8A72]' : 'text-[#2D3436]'}`}>
            {exercise.exercise_name}
          </h4>
          <p className="text-sm text-[#5B8A72] font-medium mt-1">⏱ {exercise.time_reps}</p>
        </div>
      </div>

      {exercise.video_link && !showVideo && (
        <button
          onClick={() => setShowVideo(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-[#5B8A72] text-white font-semibold py-3 rounded-xl text-base active:scale-[0.98] transition-transform"
        >
          <Play className="w-5 h-5" fill="white" />
          Žiūrėti video
        </button>
      )}

      {exercise.video_link && showVideo && (
        <YouTubeEmbed videoUrl={exercise.video_link} onClose={() => setShowVideo(false)} />
      )}
    </div>
  );
}

function ExerciseGroupSection({ group, completed, onToggle }: {
  group: ExerciseGroup;
  completed: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const completedCount = group.exercises.filter((e) => completed[String(e.id)]).length;

  return (
    <div className="bg-white rounded-2xl border border-[#E8E5E0] shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left active:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{group.emoji}</span>
          <div>
            <h3 className="text-lg font-semibold text-[#2D3436]">{group.title}</h3>
            <p className="text-sm text-[#636E72]">
              {completedCount}/{group.exercises.length} atlikta
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-6 h-6 text-[#636E72]" />
        ) : (
          <ChevronDown className="w-6 h-6 text-[#636E72]" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {group.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              completed={!!completed[String(exercise.id)]}
              onToggle={() => onToggle(String(exercise.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Pratimai() {
  const navigate = useNavigate();
  const { patient } = usePatient();
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [beSkausmoState, setBeSkausmoState] = useState<BeSkausmoState | null>(null);
  const [painToday, setPainToday] = useState<number | null>(null);
  const [daySubmitting, setDaySubmitting] = useState(false);
  const [openDayVideos, setOpenDayVideos] = useState<Record<number, boolean>>({});
  const [openDayPanels, setOpenDayPanels] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!patient) return;
    if (patient.assigned_program === 'Be skausmo-10') return;
    setCompleted(getCompletedExercises(patient.id));
  }, [patient]);

  useEffect(() => {
    if (!beSkausmoState) return;
    const next: Record<number, boolean> = {};
    for (const day of beSkausmoState.days) {
      next[day.day_number] = day.day_number === beSkausmoState.unlocked_day && !day.completed;
    }
    setOpenDayPanels(next);
  }, [beSkausmoState]);

  useEffect(() => {
    if (!patient) return;
    if (patient.assigned_program === 'Be skausmo-10') return;
    saveCompletedExercises(patient.id, completed);
  }, [completed, patient]);

  useEffect(() => {
    if (!patient) return;

    async function fetchExercises() {
      setLoading(true);
      setError('');
      try {
        if (patient!.assigned_program === 'Be skausmo-10') {
          const response = await client.apiCall.invoke({
            url: `/api/v1/be-skausmo-10/state?patient_id=${patient!.id}`,
            method: 'GET',
          });
          setBeSkausmoState(response.data as BeSkausmoState);
          return;
        }

        const response = await client.entities.programs.query({
          query: {
            program_name: patient!.assigned_program,
            week: patient!.week,
          },
          sort: 'exercise_order',
          limit: 100,
        });

        const items: ProgramExercise[] = (response.data as any).items || [];

        // Group exercises by exercise_group
        const groupMap = new Map<string, ExerciseGroup>();
        for (const item of items) {
          const key = item.exercise_group;
          if (!groupMap.has(key)) {
            groupMap.set(key, {
              title: item.exercise_group,
              emoji: item.exercise_group_emoji || '📋',
              order: item.exercise_group_order || 0,
              exercises: [],
            });
          }
          groupMap.get(key)!.exercises.push(item);
        }

        // Sort groups by order, then exercises within each group
        const groups = Array.from(groupMap.values())
          .sort((a, b) => a.order - b.order)
          .map((g) => ({
            ...g,
            exercises: g.exercises.sort((a, b) => (a.exercise_order || 0) - (b.exercise_order || 0)),
          }));

        setExerciseGroups(groups);
      } catch (err: unknown) {
        console.error('Error fetching exercises:', err);
        setError('Nepavyko įkelti pratimų. Bandykite dar kartą.');
      } finally {
        setLoading(false);
      }
    }

    fetchExercises();
  }, [patient]);

  const toggleExercise = (id: string) => {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDayExercise = async (dayNumber: number, orderIndex: number, completedNow: boolean) => {
    if (!patient || !beSkausmoState) return;
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/be-skausmo-10/exercises/complete',
        method: 'POST',
        data: {
          patient_id: patient.id,
          day_number: dayNumber,
          order_index: orderIndex,
          completed: !completedNow,
        },
      });
      setBeSkausmoState(response.data as BeSkausmoState);
    } catch (err: unknown) {
      const detail =
        (err as { data?: { detail?: string } })?.data?.detail ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Nepavyko išsaugoti pratimo būsenos.';
      setError(detail);
    }
  };

  const submitDayPain = async (dayNumber: number) => {
    if (!patient || painToday === null) return;
    setDaySubmitting(true);
    setError('');
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/be-skausmo-10/submit-day',
        method: 'POST',
        data: {
          patient_id: patient.id,
          day_number: dayNumber,
          pain_today: painToday,
        },
      });
      setBeSkausmoState(response.data as BeSkausmoState);
      setPainToday(null);
    } catch (err: unknown) {
      const detail =
        (err as { data?: { detail?: string } })?.data?.detail ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Nepavyko pateikti dienos įvertinimo.';
      setError(detail);
    } finally {
      setDaySubmitting(false);
    }
  };

  const toggleDayVideo = (exerciseId: number) => {
    setOpenDayVideos((prev) => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  const toggleDayPanel = (dayNumber: number, locked: boolean) => {
    if (locked) return;
    setOpenDayPanels((prev) => ({ ...prev, [dayNumber]: !prev[dayNumber] }));
  };

  const totalExercises = exerciseGroups.reduce((sum, g) => sum + g.exercises.length, 0);
  const totalCompleted = Object.values(completed).filter(Boolean).length;

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
        {/* Hero */}
        <img
          src={EXERCISE_IMAGE}
          alt="Pratimai"
          className="w-full h-40 object-cover rounded-2xl mb-5"
        />

        <h1 className="text-2xl font-bold text-[#2D3436] mb-1">Pratimai</h1>
        <p className="text-base text-[#636E72] mb-1">
          {patient?.assigned_program} {patient?.assigned_program === 'Be skausmo-10' ? '· 10 dienų programa' : `· ${patient?.week} savaitė`}
        </p>
        <p className="text-sm text-[#636E72] mb-4">
          Atlikite pratimus iš eilės. Paspauskite „Žiūrėti video" norėdami pamatyti, kaip atlikti pratimą.
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#5B8A72] animate-spin mb-3" />
            <p className="text-[#636E72]">Kraunami pratimai...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center">
            <p>{error}</p>
          </div>
        ) : patient?.assigned_program === 'Be skausmo-10' ? (
          beSkausmoState ? (
            <>
              <div className="rounded-2xl p-5 mb-6 border border-[#DCE8E1] bg-gradient-to-br from-[#F5FBF7] via-white to-[#EEF7F1] shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#5B8A72] font-semibold tracking-wide uppercase">{beSkausmoState.title}</p>
                    <p className="text-base font-semibold text-[#2D3436] mt-1">
                      Jau atlikote {beSkausmoState.days.filter((d) => d.completed).length} {doneDayWord(beSkausmoState.days.filter((d) => d.completed).length)}, liko {10 - beSkausmoState.days.filter((d) => d.completed).length} {remainingDayWord(10 - beSkausmoState.days.filter((d) => d.completed).length)}.
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white border border-[#D7E7DD] shadow-sm flex items-center justify-center text-[#5B8A72] font-bold">
                    {beSkausmoState.days.filter((d) => d.completed).length}/10
                  </div>
                </div>
                <div className="mt-3 w-full h-2 rounded-full bg-white/80 border border-[#E4EFE8] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#5B8A72] to-[#7AA88E] transition-all duration-500"
                    style={{ width: `${(beSkausmoState.days.filter((d) => d.completed).length / 10) * 100}%` }}
                  />
                </div>
                {beSkausmoState.program_completed && (
                  <p className="text-sm text-[#5B8A72] mt-1 font-medium">Programa baigta</p>
                )}
              </div>

              <div className="space-y-4">
                {beSkausmoState.days.map((day) => (
                  <div
                    key={day.day_number}
                    className={`rounded-2xl border p-4 shadow-sm transition-all ${
                      day.completed
                        ? 'bg-gradient-to-br from-[#DDF5E6] via-[#EAFBF0] to-[#D4F3E0] border-[#5B8A72] shadow-[0_0_0_1px_rgba(91,138,114,0.25),0_12px_24px_-12px_rgba(91,138,114,0.75)]'
                        : 'bg-white border-[#E8E5E0] hover:shadow-md'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleDayPanel(day.day_number, day.locked)}
                      className="w-full flex items-center justify-between mb-3 text-left"
                    >
                      <h3 className="text-lg font-semibold text-[#2D3436]">Diena {day.day_number}</h3>
                      <div className="flex items-center gap-2">
                        {day.locked ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Diena užrakinta</span>
                      ) : day.completed ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-[#5B8A72]/15 text-[#5B8A72]">Atlikta</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Atrakinta</span>
                      )}
                        {!day.locked && (openDayPanels[day.day_number] ? <ChevronUp className="w-5 h-5 text-[#636E72]" /> : <ChevronDown className="w-5 h-5 text-[#636E72]" />)}
                      </div>
                    </button>

                    {!day.locked && openDayPanels[day.day_number] && (
                      <div className="space-y-3">
                        {day.exercises.map((exercise) => (
                          <div key={exercise.id} className="border border-[#E8E5E0] rounded-xl p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="font-semibold text-[#2D3436]">{exercise.order_index}. {exercise.exercise_name}</p>
                                <p className="text-sm text-[#5B8A72] mt-1">{exercise.sets} x {exercise.reps_or_time}</p>
                                <ol className="mt-2 text-sm text-[#636E72] list-decimal list-inside space-y-1">
                                  {exercise.instructions.map((step, idx) => <li key={idx}>{step}</li>)}
                                </ol>
                                {!!exercise.video_link && !openDayVideos[exercise.id] && (
                                  <button
                                    onClick={() => toggleDayVideo(exercise.id)}
                                    className="mt-3 w-full sm:w-auto flex items-center justify-center gap-2 bg-[#5B8A72] text-white font-semibold px-4 py-2 rounded-xl text-sm active:scale-[0.98] transition-transform"
                                  >
                                    <Play className="w-4 h-4" fill="white" />
                                    Žiūrėti video
                                  </button>
                                )}
                                {!!exercise.video_link && openDayVideos[exercise.id] && (
                                  <YouTubeEmbed
                                    videoUrl={exercise.video_link}
                                    onClose={() => toggleDayVideo(exercise.id)}
                                  />
                                )}
                              </div>
                              <button
                                disabled={day.completed}
                                onClick={() => toggleDayExercise(day.day_number, exercise.order_index, exercise.completed)}
                                className={`px-3 py-2 text-sm rounded-lg border ${
                                  exercise.completed
                                    ? 'bg-[#5B8A72] text-white border-[#5B8A72]'
                                    : 'bg-white text-[#2D3436] border-[#D1D5DB]'
                                } ${day.completed ? 'opacity-60 cursor-not-allowed' : ''}`}
                              >
                                {exercise.completed ? 'Atlikta' : 'Pažymėti kaip atliktą'}
                              </button>
                            </div>
                          </div>
                        ))}

                        {day.all_exercises_completed && !day.completed && (
                          <div className="bg-[#FAFAF8] border border-[#E8E5E0] rounded-xl p-4">
                            <p className="text-sm font-medium text-[#2D3436] mb-2">Skausmas šiandien</p>
                            <div className="grid grid-cols-6 gap-2 mb-3">
                              {Array.from({ length: 11 }, (_, n) => (
                                <button
                                  key={n}
                                  onClick={() => setPainToday(n)}
                                  className={`h-9 rounded-lg text-sm font-semibold ${
                                    painToday === n ? 'bg-[#5B8A72] text-white' : 'bg-white border border-[#E8E5E0] text-[#2D3436]'
                                  }`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => submitDayPain(day.day_number)}
                              disabled={painToday === null || daySubmitting}
                              className="w-full py-3 rounded-xl bg-[#5B8A72] text-white font-semibold disabled:opacity-50"
                            >
                              {daySubmitting ? 'Siunčiama...' : 'Pateikti dienos įvertinimą'}
                            </button>
                          </div>
                        )}

                        {day.completed && day.day_number < 10 && (
                          <p className="text-sm font-medium text-[#5B8A72]">Atrakinta kita diena</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-[#E8E5E0] text-center">
              <p className="text-[#636E72] text-base">Kraunama 10 dienų programa...</p>
            </div>
          )
        ) : exerciseGroups.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-[#E8E5E0] text-center">
            <p className="text-[#636E72] text-base">
              Šiai programai ir savaitei pratimų dar nėra.
            </p>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="bg-white rounded-xl p-4 border border-[#E8E5E0] mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#636E72]">Šiandienos progresas</span>
                <span className="text-sm font-semibold text-[#5B8A72]">{totalCompleted}/{totalExercises}</span>
              </div>
              <div className="w-full h-3 bg-[#E8E5E0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5B8A72] rounded-full transition-all duration-500"
                  style={{ width: `${totalExercises > 0 ? (totalCompleted / totalExercises) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Exercise Groups */}
            <div className="space-y-4">
              {exerciseGroups.map((group) => (
                <ExerciseGroupSection
                  key={group.title}
                  group={group}
                  completed={completed}
                  onToggle={toggleExercise}
                />
              ))}
            </div>

            {/* Reset button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setCompleted({})}
                className="text-sm text-[#636E72] underline active:opacity-70"
              >
                Atstatyti visus žymėjimus
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}