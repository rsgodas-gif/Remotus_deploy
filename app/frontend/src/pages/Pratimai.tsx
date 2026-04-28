import { useMemo, useState, useEffect } from 'react';
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

const DAY_MOTIVATIONS = [
  'Puiki pradžia, tęskite judesį.',
  'Pirmyn, jau kuriate įprotį.',
  'Stabiliai judate, taip ir toliau.',
  'Jūsų nugara dėkoja už pastangas.',
  'Pusiaukelė, puikus nuoseklumas.',
  'Maži žingsniai kuria didelį rezultatą.',
  'Jėga auga su kiekviena diena.',
  'Išlaikykite tempą, finišas artėja.',
  'Beveik finišas, jūs puikūs.',
  'Sveikiname, užbaigėte 10 dienų.',
] as const;

function getDayMotivation(dayNumber: number): string {
  return DAY_MOTIVATIONS[Math.max(0, Math.min(DAY_MOTIVATIONS.length - 1, dayNumber - 1))];
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

function CompactAutoVideo({ videoUrl }: { videoUrl: string }) {
  const videoId = getYouTubeId(videoUrl);
  if (!videoId) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center justify-center gap-2 bg-[#5B8A72] text-white font-semibold px-4 py-2 rounded-xl text-sm"
      >
        <Play className="w-4 h-4" fill="white" />
        Atidaryti video
      </a>
    );
  }
  return (
    <div className="mt-3 max-w-[360px] w-full">
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

function ExerciseVideoPreview({ videoUrl, onOpen }: { videoUrl?: string; onOpen: () => void }) {
  if (!videoUrl) {
    return (
      <div className="w-full rounded-xl border border-dashed border-[#E1DDD6] bg-[#F8F7F4] h-[180px] flex items-center justify-center text-sm text-[#8A8F93]">
        Video bus įkeltas netrukus
      </div>
    );
  }

  const videoId = getYouTubeId(videoUrl);
  const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-xl bg-black"
      style={{ aspectRatio: '16 / 9' }}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt="Pratimo video peržiūra"
          className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-active:scale-[0.99] group-hover:scale-[1.02]"
        />
      ) : (
        <div className="h-full w-full bg-[#1F1F1F]" />
      )}
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-16 w-16 rounded-full bg-white/92 flex items-center justify-center shadow-lg">
          <Play className="w-8 h-8 text-[#2D3436] ml-1" fill="currentColor" />
        </div>
      </div>
    </button>
  );
}

function VideoFullscreenModal({ videoUrl, onClose }: { videoUrl: string; onClose: () => void }) {
  const videoId = getYouTubeId(videoUrl);
  if (!videoId) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/90 text-[#2D3436] flex items-center justify-center"
        aria-label="Uždaryti video"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="h-full w-full flex items-center justify-center p-2">
        <div className="w-full max-w-5xl rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title="Pratimo video per visą ekraną"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}

function ExerciseDetailModal({
  item,
  onClose,
  onOpenVideo,
  onToggleAndContinue,
  onGoPrevious,
  canGoPrevious,
}: {
  item: { dayNumber: number; exercise: DayExercise; totalInDay: number; currentIndex: number };
  onClose: () => void;
  onOpenVideo: (url: string) => void;
  onToggleAndContinue: (dayNumber: number, orderIndex: number, completedNow: boolean) => Promise<void>;
  onGoPrevious: () => void;
  canGoPrevious: boolean;
}) {
  const { exercise, dayNumber, totalInDay } = item;

  return (
    <div className="fixed inset-0 z-[60] bg-[#FAFAF8] overflow-y-auto">
      <div className="sticky top-0 z-10 bg-[#FAFAF8]/95 backdrop-blur border-b border-[#ECE7DE] px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-[#636E72]">{exercise.order_index} / {totalInDay} pratimų</p>
        <button type="button" onClick={onClose} className="h-9 w-9 rounded-full bg-white border border-[#E6E2DA] flex items-center justify-center">
          <X className="w-4 h-4 text-[#2D3436]" />
        </button>
      </div>

      <div className="px-4 pt-4 pb-28 space-y-4">
        <ExerciseVideoPreview
          videoUrl={exercise.video_link}
          onOpen={() => exercise.video_link && onOpenVideo(exercise.video_link)}
        />

        <div className="flex items-start justify-between gap-3">
          <h3 className="text-2xl leading-tight font-bold text-[#1F2527]">{exercise.exercise_name}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${exercise.completed ? 'bg-[#EAF8F0] text-[#2F6B4F] border-[#B9DDC8]' : 'bg-[#FFF6DB] text-[#9A6A00] border-[#F0D58A]'}`}>
            {exercise.completed ? 'Atlikta' : 'Atrakinta'}
          </span>
        </div>

        <div className="rounded-xl border border-[#D9E8DF] bg-[#F3FBF6] px-3 py-2">
          <p className="text-sm font-semibold text-[#2F6B4F]">{exercise.sets} x {exercise.reps_or_time}</p>
        </div>

        <div className="space-y-2">
          {exercise.instructions.map((step, idx) => (
            <div key={`${exercise.id}-${idx}`} className="rounded-xl border border-[#ECE7DE] bg-white px-3 py-3 flex gap-3">
              <span className="h-6 w-6 shrink-0 rounded-full bg-[#EEF1F2] text-[#465055] text-xs font-semibold flex items-center justify-center">
                {idx + 1}
              </span>
              <p className="text-sm leading-relaxed text-[#2D3436]">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#ECE7DE] bg-[#FAFAF8] px-4 py-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onGoPrevious}
            disabled={!canGoPrevious}
            className="h-14 rounded-2xl text-base font-semibold bg-white border border-[#D7DCD9] text-[#2D3436] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Ankstesnis
          </button>
          <button
            type="button"
            onClick={() => onToggleAndContinue(dayNumber, exercise.order_index, exercise.completed)}
            className={`h-14 rounded-2xl text-base font-semibold transition-transform active:scale-[0.99] ${
              exercise.completed
                ? 'bg-white border border-[#C9D8CF] text-[#2F6B4F]'
                : 'bg-[#5B8A72] text-white'
            }`}
          >
            {exercise.completed ? 'Pažymėti kaip neatliktą' : 'Atlikta'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DayExercisesModal({
  day,
  painToday,
  daySubmitting,
  onClose,
  onOpenExercise,
  onSetPainToday,
  onSubmitPain,
}: {
  day: ProgramDayState;
  painToday: number | null;
  daySubmitting: boolean;
  onClose: () => void;
  onOpenExercise: (exercise: DayExercise, index: number, total: number) => void;
  onSetPainToday: (n: number) => void;
  onSubmitPain: (dayNumber: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-[55] bg-[#FAFAF8] overflow-y-auto">
      <div className="sticky top-0 z-10 bg-[#FAFAF8]/95 backdrop-blur border-b border-[#ECE7DE] px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-[#636E72]">Dienos pratimai</p>
          <p className="text-lg font-semibold text-[#2D3436]">Diena {day.day_number}</p>
        </div>
        <button type="button" onClick={onClose} className="h-9 w-9 rounded-full bg-white border border-[#E6E2DA] flex items-center justify-center">
          <X className="w-4 h-4 text-[#2D3436]" />
        </button>
      </div>

      <div className="px-4 py-4 pb-10 space-y-3">
        {day.exercises.map((exercise, idx) => (
          <button
            key={exercise.id}
            type="button"
            onClick={() => onOpenExercise(exercise, idx, day.exercises.length)}
            className={`w-full rounded-xl p-3 border text-left transition-colors ${
              exercise.completed
                ? 'bg-[#EAF8F0] border-[#5B8A72]'
                : 'bg-white border-[#E8E5E0]'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-[#2D3436] truncate">{exercise.order_index}. {exercise.exercise_name}</p>
                <p className="text-sm text-[#5B8A72] mt-1">{exercise.sets} x {exercise.reps_or_time}</p>
              </div>
              <span className="shrink-0 px-3 py-1 rounded-lg bg-white border border-[#D8DDE1] text-sm font-medium text-[#2D3436]">
                Atidaryti
              </span>
            </div>
          </button>
        ))}

        {day.all_exercises_completed && !day.completed && (
          <div className="bg-[#FAFAF8] border border-[#E8E5E0] rounded-xl p-4">
            <p className="text-sm font-medium text-[#2D3436] mb-2">Skausmas šiandien</p>
            <div className="grid grid-cols-6 gap-2 mb-3">
              {Array.from({ length: 11 }, (_, n) => (
                <button
                  key={n}
                  onClick={() => onSetPainToday(n)}
                  className={`h-9 rounded-lg text-sm font-semibold ${
                    painToday === n ? 'bg-[#5B8A72] text-white' : 'bg-white border border-[#E8E5E0] text-[#2D3436]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => onSubmitPain(day.day_number)}
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
    </div>
  );
}

function ProgramCompletionFeedbackModal({
  open,
  helpingScore,
  overallScore,
  suggestedChanges,
  favoritePart,
  submitting,
  onClose,
  onChangeHelping,
  onChangeOverall,
  onChangeChanges,
  onChangeFavorite,
  onSubmit,
}: {
  open: boolean;
  helpingScore: string;
  overallScore: string;
  suggestedChanges: string;
  favoritePart: string;
  submitting: boolean;
  onClose: () => void;
  onChangeHelping: (v: string) => void;
  onChangeOverall: (v: string) => void;
  onChangeChanges: (v: string) => void;
  onChangeFavorite: (v: string) => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl border border-[#E8E5E0] bg-white shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#E8E5E0] px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-[#5B8A72] font-semibold">Programa uzbaigta</p>
            <h3 className="text-lg font-bold text-[#2D3436]">Trumpa jusu patirtis (1 min)</h3>
          </div>
          <button type="button" onClick={onClose} className="h-9 w-9 rounded-full border border-[#E8E5E0] flex items-center justify-center">
            <X className="w-4 h-4 text-[#2D3436]" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2D3436] mb-2">Ar programa padejo? (0-10)</label>
            <input
              type="number"
              min={0}
              max={10}
              value={helpingScore}
              onChange={(e) => onChangeHelping(e.target.value)}
              className="w-full rounded-xl border border-[#E8E5E0] px-3 py-2.5 text-[#2D3436]"
              placeholder="pvz. 8"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2D3436] mb-2">Kaip vertinate visa programa? (0-10)</label>
            <input
              type="number"
              min={0}
              max={10}
              value={overallScore}
              onChange={(e) => onChangeOverall(e.target.value)}
              className="w-full rounded-xl border border-[#E8E5E0] px-3 py-2.5 text-[#2D3436]"
              placeholder="pvz. 9"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2D3436] mb-2">Ka noretumete pakeisti ar pagerinti?</label>
            <textarea
              rows={3}
              value={suggestedChanges}
              onChange={(e) => onChangeChanges(e.target.value)}
              className="w-full rounded-xl border border-[#E8E5E0] px-3 py-2.5 text-[#2D3436] resize-y"
              placeholder="Kas butu naudingiau kita karta?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2D3436] mb-2">Kas labiausiai padejo?</label>
            <textarea
              rows={2}
              value={favoritePart}
              onChange={(e) => onChangeFavorite(e.target.value)}
              className="w-full rounded-xl border border-[#E8E5E0] px-3 py-2.5 text-[#2D3436] resize-y"
              placeholder="Pratimai, video, struktura ir pan."
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#E8E5E0] p-4">
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="w-full h-12 rounded-xl bg-[#5B8A72] text-white font-semibold disabled:opacity-60"
          >
            {submitting ? 'Siunciama...' : 'Issaugoti atsakymus'}
          </button>
        </div>
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
  const [celebration, setCelebration] = useState<{ dayNumber: number; message: string } | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<{ dayNumber: number; exercise: DayExercise; totalInDay: number; currentIndex: number } | null>(null);
  const [fullscreenVideoUrl, setFullscreenVideoUrl] = useState<string | null>(null);
  const [showCompletionFeedback, setShowCompletionFeedback] = useState(false);
  const [completionSubmitting, setCompletionSubmitting] = useState(false);
  const [helpingScore, setHelpingScore] = useState('');
  const [overallScore, setOverallScore] = useState('');
  const [suggestedChanges, setSuggestedChanges] = useState('');
  const [favoritePart, setFavoritePart] = useState('');

  useEffect(() => {
    if (!patient) return;
    if (patient.assigned_program === 'Be skausmo-10') return;
    setCompleted(getCompletedExercises(patient.id));
  }, [patient]);

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

  const toggleDayExercise = async (dayNumber: number, orderIndex: number, completedNow: boolean): Promise<BeSkausmoState | null> => {
    if (!patient || !beSkausmoState) return null;
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
      const nextState = response.data as BeSkausmoState;
      setBeSkausmoState(nextState);
      return nextState;
    } catch (err: unknown) {
      const detail =
        (err as { data?: { detail?: string } })?.data?.detail ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Nepavyko išsaugoti pratimo būsenos.';
      setError(detail);
      return null;
    }
  };

  const toggleDayExerciseAndContinue = async (dayNumber: number, orderIndex: number, completedNow: boolean) => {
    const nextState = await toggleDayExercise(dayNumber, orderIndex, completedNow);
    if (!nextState) return;

    // If user marks as completed, jump to the next exercise in the same day.
    if (!completedNow) {
      const day = nextState.days.find((d) => d.day_number === dayNumber);
      if (!day) {
        setSelectedExercise(null);
        return;
      }

      const currentIndex = day.exercises.findIndex((ex) => ex.order_index === orderIndex);
      const nextExercise = currentIndex >= 0 ? day.exercises[currentIndex + 1] : undefined;

      if (nextExercise) {
        setSelectedExercise({
          dayNumber,
          exercise: nextExercise,
          totalInDay: day.exercises.length,
          currentIndex: currentIndex + 1,
        });
      } else {
        setSelectedExercise(null);
      }
      return;
    }

    // If toggled back to incomplete, keep the same card open with fresh data.
    const day = nextState.days.find((d) => d.day_number === dayNumber);
    const sameExercise = day?.exercises.find((ex) => ex.order_index === orderIndex);
    if (day && sameExercise) {
      setSelectedExercise({
        dayNumber,
        exercise: sameExercise,
        totalInDay: day.exercises.length,
        currentIndex: day.exercises.findIndex((ex) => ex.order_index === orderIndex),
      });
    }
  };

  const goToPreviousExercise = () => {
    if (!selectedExercise || !beSkausmoState) return;
    const day = beSkausmoState.days.find((d) => d.day_number === selectedExercise.dayNumber);
    if (!day) return;
    const prevExercise = day.exercises[selectedExercise.currentIndex - 1];
    if (!prevExercise) return;
    setSelectedExercise({
      dayNumber: selectedExercise.dayNumber,
      exercise: prevExercise,
      totalInDay: day.exercises.length,
      currentIndex: selectedExercise.currentIndex - 1,
    });
  };

  const submitProgramCompletionFeedback = async () => {
    if (!patient) return;
    const helping = Number(helpingScore);
    const overall = Number(overallScore);
    if (Number.isNaN(helping) || helping < 0 || helping > 10 || Number.isNaN(overall) || overall < 0 || overall > 10) {
      setError('Ivertinimai turi buti nuo 0 iki 10.');
      return;
    }

    setCompletionSubmitting(true);
    setError('');
    try {
      const message = [
        'Be skausmo-10 programos pabaigos klausimynas',
        `Ar programa padejo (0-10): ${helping}`,
        `Bendras programos vertinimas (0-10): ${overall}`,
        `Ka keisti/pagerinti: ${suggestedChanges.trim() || '-'}`,
        `Kas labiausiai padejo: ${favoritePart.trim() || '-'}`,
      ].join('\n');

      await client.apiCall.invoke({
        url: '/api/v1/feedback/submit',
        method: 'POST',
        data: {
          patient_id: patient.id,
          message,
        },
      });

      localStorage.setItem(`be_skausmo_10_feedback_submitted_${patient.id}`, '1');
      setShowCompletionFeedback(false);
    } catch (err: unknown) {
      const detail =
        (err as { data?: { detail?: string } })?.data?.detail ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Nepavyko issaugoti klausimyno.';
      setError(detail);
    } finally {
      setCompletionSubmitting(false);
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
      setCelebration({
        dayNumber,
        message: getDayMotivation(dayNumber),
      });
      setTimeout(() => setCelebration(null), 2400);
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

  const totalExercises = exerciseGroups.reduce((sum, g) => sum + g.exercises.length, 0);
  const totalCompleted = Object.values(completed).filter(Boolean).length;
  const sortedBeSkausmoDays = useMemo(() => {
    if (!beSkausmoState) return [];
    const days = [...beSkausmoState.days];
    days.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.day_number - b.day_number;
    });
    return days;
  }, [beSkausmoState]);
  const selectedDay = useMemo(
    () => beSkausmoState?.days.find((d) => d.day_number === selectedDayNumber) ?? null,
    [beSkausmoState, selectedDayNumber]
  );

  useEffect(() => {
    if (!patient || !beSkausmoState?.program_completed) return;
    const submittedKey = `be_skausmo_10_feedback_submitted_${patient.id}`;
    if (localStorage.getItem(submittedKey) !== '1') {
      setShowCompletionFeedback(true);
    }
  }, [beSkausmoState?.program_completed, patient?.id]);

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
          Atlikite pratimus iš eilės. Vaizdo įrašai rodomi automatiškai prie kiekvieno pratimo.
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
                {sortedBeSkausmoDays.map((day) => (
                  <div
                    key={day.day_number}
                    className={`rounded-2xl border p-4 shadow-sm transition-all ${
                      day.completed
                        ? 'bg-gradient-to-br from-[#DDF5E6] via-[#EAFBF0] to-[#D4F3E0] border-[#5B8A72] shadow-[0_0_0_1px_rgba(91,138,114,0.25),0_12px_24px_-12px_rgba(91,138,114,0.75)]'
                        : day.locked
                          ? 'bg-gradient-to-br from-[#F2F3F5] via-[#F7F8FA] to-[#EEF0F3] border-[#C8CDD4]'
                          : 'bg-gradient-to-br from-[#FFF9DB] via-[#FFFDF0] to-[#FFF4C2] border-[#E8D27C] hover:shadow-md'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => !day.locked && setSelectedDayNumber(day.day_number)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-[#2D3436]">Diena {day.day_number}</h3>
                        {day.completed && (
                          <p className="text-xs text-[#2D3436]/70 mt-1">{getDayMotivation(day.day_number)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {day.locked ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700 border border-gray-300">Diena užrakinta</span>
                      ) : day.completed ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-[#5B8A72]/15 text-[#2F6B4F] border border-[#9CC9B2]">Atlikta</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">Atrakinta</span>
                      )}
                      </div>
                    </button>
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
      {celebration && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
            <div className="relative bg-white border border-[#DCE8E1] rounded-2xl shadow-xl px-6 py-5 max-w-sm w-full text-center">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl">🎆 🎉 ✨</div>
              <p className="text-sm uppercase tracking-wide text-[#5B8A72] font-semibold">Diena {celebration.dayNumber} atlikta</p>
              <p className="text-base text-[#2D3436] mt-1 font-medium">{celebration.message}</p>
            </div>
          </div>
        </>
      )}
      {selectedExercise && (
        <ExerciseDetailModal
          item={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onOpenVideo={(url) => setFullscreenVideoUrl(url)}
          onToggleAndContinue={toggleDayExerciseAndContinue}
          onGoPrevious={goToPreviousExercise}
          canGoPrevious={selectedExercise.currentIndex > 0}
        />
      )}
      {selectedDay && (
        <DayExercisesModal
          day={selectedDay}
          painToday={painToday}
          daySubmitting={daySubmitting}
          onClose={() => setSelectedDayNumber(null)}
          onOpenExercise={(exercise, index, total) =>
            setSelectedExercise({
              dayNumber: selectedDay.day_number,
              exercise,
              totalInDay: total,
              currentIndex: index,
            })
          }
          onSetPainToday={setPainToday}
          onSubmitPain={submitDayPain}
        />
      )}
      {fullscreenVideoUrl && (
        <VideoFullscreenModal
          videoUrl={fullscreenVideoUrl}
          onClose={() => setFullscreenVideoUrl(null)}
        />
      )}
      <ProgramCompletionFeedbackModal
        open={showCompletionFeedback}
        helpingScore={helpingScore}
        overallScore={overallScore}
        suggestedChanges={suggestedChanges}
        favoritePart={favoritePart}
        submitting={completionSubmitting}
        onClose={() => setShowCompletionFeedback(false)}
        onChangeHelping={setHelpingScore}
        onChangeOverall={setOverallScore}
        onChangeChanges={setSuggestedChanges}
        onChangeFavorite={setFavoritePart}
        onSubmit={submitProgramCompletionFeedback}
      />
    </div>
  );
}