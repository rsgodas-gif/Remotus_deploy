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

  useEffect(() => {
    if (!patient) return;
    setCompleted(getCompletedExercises(patient.id));
  }, [patient]);

  useEffect(() => {
    if (!patient) return;
    saveCompletedExercises(patient.id, completed);
  }, [completed, patient]);

  useEffect(() => {
    if (!patient) return;

    async function fetchExercises() {
      setLoading(true);
      setError('');
      try {
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
          {patient?.assigned_program} · {patient?.week} savaitė
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