import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Loader2, Lock } from 'lucide-react';
import { usePatient } from '../contexts/PatientContext';
import { useWeeklyLockContext } from '../contexts/WeeklyLockContext';
import { client } from '../lib/api';

interface WeeklyEntry {
  id: number;
  patient_id: number;
  week: number;
  pain_avg: number;
  pain_spread: string;
  pain_relief: string;
  pain_worsen: string;
  movement: number;
  energy: number;
  exercise_frequency: number;
  how_feeling: string;
  hard_exercises: string;
  liked_exercises: string;
  progress_exercises: string;
  other_notes: string;
  entry_date: string;
}

function ScaleSelector({ label, value, onChange, emoji, max = 10 }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  emoji: string;
  max?: number;
}) {
  return (
    <div className="mb-5">
      <label className="text-base font-semibold text-[#2D3436] mb-2 block">
        {emoji} {label}: <span className="text-[#5B8A72]">{value}</span>
      </label>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-10 h-10 rounded-xl text-base font-semibold transition-colors ${
              value === n
                ? 'bg-[#5B8A72] text-white'
                : 'bg-white text-[#2D3436] border border-[#E8E5E0]'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function PlaceholderTextarea({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = !isFocused && value === '' && placeholder ? placeholder : value;
  const isShowingPlaceholder = !isFocused && value === '' && placeholder !== '';

  return (
    <div className="mb-4">
      <label className="text-base font-semibold text-[#2D3436] mb-2 block">
        {label}
      </label>
      <textarea
        value={displayValue}
        onFocus={() => {
          setIsFocused(true);
          if (value === '' && placeholder) {
            onChange('');
          }
        }}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className={`w-full px-4 py-3 rounded-xl border border-[#E8E5E0] text-base bg-[#FAFAF8] focus:outline-none focus:border-[#5B8A72] resize-none ${
          isShowingPlaceholder ? 'text-[#636E72]/50 italic' : 'text-[#2D3436]'
        }`}
      />
    </div>
  );
}

function EntryCard({ entry, onDelete }: { entry: WeeklyEntry; onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  const detailFields = [
    { label: 'Skausmo plitimas', value: entry.pain_spread },
    { label: 'Kas palengvina skausmą', value: entry.pain_relief },
    { label: 'Kas pastiprina skausmą', value: entry.pain_worsen },
    { label: 'Kaip jaučiasi', value: entry.how_feeling },
    { label: 'Sunkūs pratimai', value: entry.hard_exercises },
    { label: 'Patikę pratimai', value: entry.liked_exercises },
    { label: 'Didžiausias progresas', value: entry.progress_exercises },
    { label: 'Kitos pastabos', value: entry.other_notes },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E8E5E0] shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left active:bg-gray-50"
      >
        <div>
          <h4 className="text-base font-semibold text-[#2D3436]">{entry.week} savaitė</h4>
          <p className="text-sm text-[#636E72]">{entry.entry_date}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#5B8A72]">Skausmas: {entry.pain_avg}/10</span>
          {open ? <ChevronUp className="w-5 h-5 text-[#636E72]" /> : <ChevronDown className="w-5 h-5 text-[#636E72]" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-[#FAFAF8] rounded-xl p-3">
              <p className="text-sm text-[#636E72]">Vid. skausmas</p>
              <p className="text-lg font-bold text-[#2D3436]">{entry.pain_avg}/10</p>
            </div>
            <div className="bg-[#FAFAF8] rounded-xl p-3">
              <p className="text-sm text-[#636E72]">Judėjimas</p>
              <p className="text-lg font-bold text-[#2D3436]">{entry.movement}/10</p>
            </div>
            <div className="bg-[#FAFAF8] rounded-xl p-3">
              <p className="text-sm text-[#636E72]">Energija</p>
              <p className="text-lg font-bold text-[#2D3436]">{entry.energy}/10</p>
            </div>
            <div className="bg-[#FAFAF8] rounded-xl p-3">
              <p className="text-sm text-[#636E72]">Programos dažnumas</p>
              <p className="text-lg font-bold text-[#2D3436]">{entry.exercise_frequency}/10</p>
            </div>
          </div>
          {detailFields.map((field, i) =>
            field.value ? (
              <div key={i} className="bg-[#FAFAF8] rounded-xl p-3 mb-3">
                <p className="text-sm text-[#636E72] mb-1">{field.label}</p>
                <p className="text-base text-[#2D3436]">{field.value}</p>
              </div>
            ) : null
          )}
          <button
            onClick={onDelete}
            className="flex items-center gap-2 text-sm text-red-400 active:opacity-70"
          >
            <Trash2 className="w-4 h-4" />
            Ištrinti įrašą
          </button>
        </div>
      )}
    </div>
  );
}

export default function SavaitesProgresas() {
  const navigate = useNavigate();
  const { patient } = usePatient();
  const { isLocked, refresh: refreshLock } = useWeeklyLockContext();
  const patientId = patient?.id ?? 0;

  const [entries, setEntries] = useState<WeeklyEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [week, setWeek] = useState(1);
  const [painAvg, setPainAvg] = useState(5);
  const [painSpread, setPainSpread] = useState('');
  const [painRelief, setPainRelief] = useState('');
  const [painWorsen, setPainWorsen] = useState('');
  const [movement, setMovement] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [exerciseFrequency, setExerciseFrequency] = useState(5);
  const [howFeeling, setHowFeeling] = useState('');
  const [hardExercises, setHardExercises] = useState('');
  const [likedExercises, setLikedExercises] = useState('');
  const [progressExercises, setProgressExercises] = useState('');
  const [otherNotes, setOtherNotes] = useState('');

  const fetchEntries = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError('');
    try {
      const res = await client.entities.weekly_progress.query({
        query: { patient_id: patientId },
        sort: '-week',
        limit: 100,
      });
      const data = res.data;
      const items = (data as any).items || [];
      setEntries(items);
      const maxWeek = items.reduce((max: number, e: WeeklyEntry) => Math.max(max, e.week), 0);
      setWeek(maxWeek + 1);
    } catch (err: unknown) {
      console.error('Error fetching weekly progress:', err);
      setError('Nepavyko užkrauti duomenų. Bandykite dar kartą.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Auto-open form when locked
  useEffect(() => {
    if (isLocked && !loading) {
      setShowForm(true);
    }
  }, [isLocked, loading]);

  const resetForm = () => {
    setPainAvg(5);
    setPainSpread('');
    setPainRelief('');
    setPainWorsen('');
    setMovement(5);
    setEnergy(5);
    setExerciseFrequency(5);
    setHowFeeling('');
    setHardExercises('');
    setLikedExercises('');
    setProgressExercises('');
    setOtherNotes('');
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const isoDate = `${yyyy}-${mm}-${dd}`;

      const payload = {
        patient_id: patientId,
        week,
        pain_avg: painAvg,
        pain_spread: painSpread || '',
        pain_relief: painRelief || '',
        pain_worsen: painWorsen || '',
        movement,
        energy,
        exercise_frequency: exerciseFrequency,
        how_feeling: howFeeling || '',
        hard_exercises: hardExercises || '',
        liked_exercises: likedExercises || '',
        progress_exercises: progressExercises || '',
        other_notes: otherNotes || '',
        entry_date: isoDate,
      };
      await client.entities.weekly_progress.create({ data: payload });
      setShowForm(false);
      resetForm();
      await fetchEntries();
      // Refresh the lock state — this should unlock the user
      refreshLock();
      // If was locked, navigate to home after successful submission
      if (isLocked) {
        // Small delay to let lock state update
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 300);
      }
    } catch (err: unknown) {
      console.error('Error saving weekly progress:', err);
      setError('Nepavyko išsaugoti. Bandykite dar kartą.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await client.entities.weekly_progress.delete({ id: String(id) });
      await fetchEntries();
      // Refresh lock state after deletion (might re-lock)
      refreshLock();
    } catch (err: unknown) {
      console.error('Error deleting entry:', err);
      setError('Nepavyko ištrinti įrašo.');
    }
  };

  const handleSecretBypass = () => {
    if (!patient?.id) return;
    sessionStorage.setItem(`weekly_lock_bypass_${patient.id}`, '1');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#FAFAF8] border-b border-[#E8E5E0] px-5 py-4">
        {isLocked ? (
          <div className="flex items-center gap-2 text-[#636E72] font-medium text-lg">
            <Lock className="w-5 h-5 text-[#E8A87C]" />
            Savaitės įvertinimas
          </div>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#5B8A72] font-medium text-lg active:opacity-70"
          >
            <ArrowLeft className="w-6 h-6" />
            Grįžti
          </button>
        )}
      </div>

      <div className="px-5 py-6 pb-10">
        {/* Lock message banner */}
        {isLocked && (
          <div className="bg-[#FFF3E0] border border-[#FFB74D] rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#FFB74D]/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lock className="w-5 h-5 text-[#E65100]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-[#E65100]">
                    Būtina užpildyti savaitės įvertinimą
                  </h3>
                  <button
                    type="button"
                    onClick={handleSecretBypass}
                    className="w-5 h-5 rounded-full bg-[#E65100]/15 text-[#E65100] text-xs leading-none flex items-center justify-center active:scale-95"
                    aria-label="Slaptas apejimas"
                    title="Slaptas apejimas"
                  >
                    ❗
                  </button>
                </div>
                <p className="text-sm text-[#BF360C] leading-relaxed">
                  Prieš tęsiant programą, būtina užpildyti savaitės įvertinimą. Tai padeda pritaikyti programą pagal jūsų būklę.
                </p>
              </div>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold text-[#2D3436] mb-1">Savaitės progresas</h1>
        <p className="text-base text-[#636E72] mb-6">
          Kartą per savaitę įvertinkite, kaip jaučiatės.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#5B8A72] animate-spin" />
            <span className="ml-3 text-[#636E72]">Kraunama...</span>
          </div>
        ) : !showForm ? (
          <>
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-[#5B8A72] text-white text-lg font-semibold py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-sm flex items-center justify-center gap-2 mb-6"
            >
              <Plus className="w-6 h-6" />
              Naujas įvertinimas
            </button>

            {entries.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-[#E8E5E0] text-center">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-lg font-semibold text-[#2D3436]">Dar nėra įrašų</p>
                <p className="text-base text-[#636E72] mt-1">
                  Paspauskite „Naujas įvertinimas", kad pradėtumėte.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} onDelete={() => handleDelete(entry.id)} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl p-5 border border-[#E8E5E0] shadow-sm">
            <h2 className="text-lg font-semibold text-[#2D3436] mb-5">Naujas savaitės įvertinimas</h2>

            {/* Week number */}
            <div className="mb-5">
              <label className="text-base font-semibold text-[#2D3436] mb-2 block">
                📅 Savaitė
              </label>
              <input
                type="number"
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
                min={1}
                className="w-full h-12 px-4 rounded-xl border border-[#E8E5E0] text-lg text-[#2D3436] bg-[#FAFAF8] focus:outline-none focus:border-[#5B8A72]"
              />
            </div>

            {/* Pain average */}
            <ScaleSelector label="Vidutinis skausmas dienos metu" value={painAvg} onChange={setPainAvg} emoji="😣" />

            {/* Pain spread */}
            <PlaceholderTextarea
              label="🔴 Ar skausmas kur nors plinta?"
              value={painSpread}
              onChange={setPainSpread}
              placeholder="pvz.: į d. koją iki blauzdos"
            />

            {/* Pain relief */}
            <PlaceholderTextarea
              label="🟢 Kas palengvina skausmą?"
              value={painRelief}
              onChange={setPainRelief}
              placeholder="Pvz.: Gulėjimas / vaikščiojimas"
            />

            {/* Pain worsen */}
            <PlaceholderTextarea
              label="🔴 Kas pastiprina skausmą?"
              value={painWorsen}
              onChange={setPainWorsen}
              placeholder="Pvz.: Sėdėjimas"
            />

            {/* Movement */}
            <ScaleSelector label="Judėjimo lengvumas" value={movement} onChange={setMovement} emoji="🏃" />

            {/* Energy */}
            <ScaleSelector label="Energija" value={energy} onChange={setEnergy} emoji="⚡" />

            {/* Exercise frequency */}
            <ScaleSelector label="Kaip dažnai šią savaitę dariau programą?" value={exerciseFrequency} onChange={setExerciseFrequency} emoji="🏋️" />

            {/* Notes section header */}
            <div className="mt-6 mb-4 border-t border-[#E8E5E0] pt-5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-[#2D3436]">📝 Pastabos</h3>
                <span className="text-sm text-[#636E72] italic">
                  p.s. Labai svarbu kuo išsamiau aprašyti, kad tinkamai galėtume koreguoti
                </span>
              </div>
            </div>

            {/* How feeling */}
            <PlaceholderTextarea
              label="Kaip jaučiatės šią savaitę?"
              value={howFeeling}
              onChange={setHowFeeling}
              placeholder=""
            />

            {/* Hard exercises */}
            <PlaceholderTextarea
              label="Kurie pratimai buvo sunkūs ar sukeliantys skausmus?"
              value={hardExercises}
              onChange={setHardExercises}
              placeholder=""
            />

            {/* Liked exercises */}
            <PlaceholderTextarea
              label="Kurie pratimai patiko?"
              value={likedExercises}
              onChange={setLikedExercises}
              placeholder=""
            />

            {/* Progress exercises */}
            <PlaceholderTextarea
              label="Kuriuos pratimus darydami jaučiate didžiausią progresą?"
              value={progressExercises}
              onChange={setProgressExercises}
              placeholder=""
            />

            {/* Other notes */}
            <PlaceholderTextarea
              label="Kitos pastabos"
              value={otherNotes}
              onChange={setOtherNotes}
              placeholder=""
            />

            {/* Buttons */}
            <div className="flex gap-3 mt-4">
              {!isLocked && (
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 py-4 rounded-2xl text-base font-semibold text-[#636E72] bg-[#FAFAF8] border border-[#E8E5E0] active:scale-[0.98] transition-transform"
                >
                  Atšaukti
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={saving}
                className={`${isLocked ? 'w-full' : 'flex-1'} py-4 rounded-2xl text-base font-semibold text-white bg-[#5B8A72] active:scale-[0.98] transition-transform shadow-sm disabled:opacity-60`}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saugoma...
                  </span>
                ) : (
                  'Išsaugoti'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}