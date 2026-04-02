import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDown, ArrowRight, ArrowUp, AlertTriangle, CheckCircle2, Clock3, Users } from 'lucide-react';
import { client } from '../lib/api';

type Severity = 'Low' | 'Medium' | 'High';
type Trend = 'improving' | 'stable' | 'worsening';
type Status = 'green' | 'yellow' | 'red';

interface Patient {
  id: number;
  name: string;
  assigned_program: string;
  week: number;
  access_allowed: boolean;
}

interface WeeklyProgress {
  id: number;
  patient_id: number;
  pain_avg: number;
  entry_date: string;
}

interface PatientDashboardRow {
  id: number;
  name: string;
  week: number;
  severity: Severity;
  lastProgressDate: string | null;
  submittedThisWeek: boolean; // whether there is a weekly_progress entry for patient.week
  daysSinceLast: number | null;
  trend: Trend;
  status: Status;
}

// Manual severity map for internal monitoring.
// Kept local and simple for now; can later be moved to backend storage.
const SEVERITY_BY_NAME: Record<string, Severity> = {
  'Rimutė Balčaitytė Lendzevičienė': 'High',
  'Sigita Šilerytė Šiusienė': 'High',
  'Alina Golubovskytė': 'Medium',
  'Rita Lisauskienė': 'Medium',
  'Laura Rafanavičiūtė': 'High',
  'Patricija Augustina Jatautytė': 'Medium',
};

const STATUS_STYLE: Record<Status, string> = {
  green: 'bg-green-100 text-green-800 border-green-200',
  yellow: 'bg-amber-100 text-amber-800 border-amber-200',
  red: 'bg-red-100 text-red-800 border-red-200',
};

const SEVERITY_STYLE: Record<Severity, string> = {
  Low: 'bg-sky-100 text-sky-800 border-sky-200',
  Medium: 'bg-orange-100 text-orange-800 border-orange-200',
  High: 'bg-red-100 text-red-800 border-red-200',
};

function parseDate(value: string): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function daysSince(date: Date): number {
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getTrend(entries: WeeklyProgress[]): Trend {
  if (entries.length < 2) return 'stable';
  const latest = entries[0].pain_avg;
  const previous = entries[1].pain_avg;
  if (latest <= previous - 1) return 'improving';
  if (latest >= previous + 1) return 'worsening';
  return 'stable';
}

function getStatus(
  submittedThisWeek: boolean,
  daysSinceWeekEntry: number | null,
  daysSinceLast: number | null,
  trend: Trend
): Status {
  // Simple deterministic rules:
  // - Red: no submission for assigned week OR worsening trend OR last submission is very old
  // - Yellow: assigned-week submitted but symptoms unchanged (stable) OR near-overdue
  // - Green: assigned-week submitted and symptoms improving
  if (!submittedThisWeek) {
    if (daysSinceLast === null || daysSinceLast > 7) return 'red';
    return 'yellow';
  }

  if (trend === 'worsening') return 'red';
  if (trend === 'stable') return 'yellow';

  // improving: require on-time-ish freshness for the assigned-week entry
  if (daysSinceWeekEntry !== null && daysSinceWeekEntry <= 7) return 'green';
  return 'yellow';
}

export default function Stebesena() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<PatientDashboardRow[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const [patientsRes, progressRes] = await Promise.all([
          client.entities.patients.query({
            query: {},
            sort: 'name',
            limit: 2000,
          }),
          client.entities.weekly_progress.query({
            query: {},
            sort: '-entry_date',
            limit: 5000,
          }),
        ]);

        const patients = ((patientsRes.data as any).items || []) as Patient[];
        const progress = ((progressRes.data as any).items || []) as WeeklyProgress[];

        const progressByPatient = new Map<number, WeeklyProgress[]>();
        for (const item of progress) {
          if (!progressByPatient.has(item.patient_id)) progressByPatient.set(item.patient_id, []);
          progressByPatient.get(item.patient_id)!.push(item);
        }

        const mapped = patients
          .filter((p) => p.access_allowed)
          .map((p): PatientDashboardRow => {
            const entries = (progressByPatient.get(p.id) || [])
              .slice()
              .sort((a, b) => {
                const da = parseDate(a.entry_date)?.getTime() || 0;
                const db = parseDate(b.entry_date)?.getTime() || 0;
                return db - da;
              });

            const latest = entries[0];
            const latestDate = latest ? parseDate(latest.entry_date) : null;
            const daysSinceLast = latestDate ? daysSince(latestDate) : null;

            // Determine whether they filled the weekly progress for the assigned week.
            const assignedWeekEntry = entries.find((e) => e.week === p.week) || null;
            const assignedWeekDate = assignedWeekEntry ? parseDate(assignedWeekEntry.entry_date) : null;
            const daysSinceWeekEntry = assignedWeekDate ? daysSince(assignedWeekDate) : null;
            const submittedThisWeek = !!assignedWeekEntry;

            const trend = getTrend(entries);
            const status = getStatus(submittedThisWeek, daysSinceWeekEntry, daysSinceLast, trend);

            return {
              id: p.id,
              name: p.name,
              week: p.week,
              severity: SEVERITY_BY_NAME[p.name] || 'Medium',
              lastProgressDate: latest?.entry_date || null,
              submittedThisWeek,
              daysSinceLast,
              trend,
              status,
            };
          })
          .sort((a, b) => {
            const order: Record<Status, number> = { red: 0, yellow: 1, green: 2 };
            return order[a.status] - order[b.status];
          });

        setRows(mapped);
      } catch (e) {
        console.error(e);
        setError('Nepavyko užkrauti stebėsenos duomenų.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const summary = useMemo(() => {
    const total = rows.length;
    const overdue = rows.filter((r) => !r.submittedThisWeek && (r.daysSinceLast === null || r.daysSinceLast > 7)).length;
    const worsening = rows.filter((r) => r.trend === 'worsening').length;
    const onTrack = rows.filter((r) => r.status === 'green').length;
    return { total, overdue, worsening, onTrack };
  }, [rows]);

  return (
    <div className="min-h-screen bg-[#FAFAF8]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="sticky top-0 z-20 bg-[#FAFAF8] border-b border-[#E8E5E0] px-5 py-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#5B8A72] font-medium text-lg active:opacity-70"
        >
          <ArrowLeft className="w-6 h-6" />
          Grįžti
        </button>
      </div>

      <div className="px-5 py-6 pb-10 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3436]">Pacientų stebėsena</h1>
          <p className="text-sm text-[#636E72] mt-1">Vizuali savaitinės būklės suvestinė.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-[#E8E5E0] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#636E72]">Aktyvūs pacientai</span>
              <Users className="w-4 h-4 text-[#5B8A72]" />
            </div>
            <p className="text-2xl font-bold text-[#2D3436] mt-1">{summary.total}</p>
          </div>
          <div className="bg-white border border-[#E8E5E0] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#636E72]">Pavėluota įžvalga</span>
              <Clock3 className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-[#2D3436] mt-1">{summary.overdue}</p>
          </div>
          <div className="bg-white border border-[#E8E5E0] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#636E72]">Blogėjanti tendencija</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-[#2D3436] mt-1">{summary.worsening}</p>
          </div>
          <div className="bg-white border border-[#E8E5E0] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#636E72]">On track</span>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-[#2D3436] mt-1">{summary.onTrack}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="text-[#636E72] text-sm">Kraunama...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {rows.map((row) => (
                <div key={row.id} className="bg-white border border-[#E8E5E0] rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#2D3436]">{row.name}</p>
                      <p className="text-sm text-[#636E72]">Savaitė {row.week}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_STYLE[row.status]}`}>
                      {row.status === 'green' ? 'On track' : row.status === 'yellow' ? 'Review soon' : 'Action needed'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${SEVERITY_STYLE[row.severity]}`}>
                      Severity: {row.severity}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full border border-[#E8E5E0] text-[#2D3436]">
                      {row.submittedThisWeek ? 'Užpildyta šiai savaitei' : 'Neužpildyta šiai savaitei'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full border border-[#E8E5E0] text-[#2D3436]">
                      {row.daysSinceLast === null ? 'Nėra įrašo' : `${row.daysSinceLast} d. nuo paskutinio`}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full border border-[#E8E5E0] text-[#2D3436] flex items-center gap-1">
                      {row.trend === 'improving' ? (
                        <ArrowDown className="w-3 h-3 text-green-600" />
                      ) : row.trend === 'worsening' ? (
                        <ArrowUp className="w-3 h-3 text-red-600" />
                      ) : (
                        <ArrowRight className="w-3 h-3 text-amber-600" />
                      )}
                      {row.trend === 'improving'
                        ? 'Gerėja'
                        : row.trend === 'worsening'
                        ? 'Blogėja'
                        : 'Stabili'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-[#E8E5E0] rounded-2xl overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAF8] text-[#636E72]">
                  <tr>
                    <th className="text-left p-3">Pacientas</th>
                    <th className="text-left p-3">Savaitė</th>
                    <th className="text-left p-3">Severity</th>
                    <th className="text-left p-3">Paskutinis progresas</th>
                    <th className="text-left p-3">Šią savaitę</th>
                    <th className="text-left p-3">Tendencija</th>
                    <th className="text-left p-3">Statusas</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`row-${row.id}`} className="border-t border-[#F0F0ED]">
                      <td className="p-3 text-[#2D3436] font-medium">{row.name}</td>
                      <td className="p-3 text-[#2D3436]">{row.week}</td>
                      <td className="p-3 text-[#2D3436]">{row.severity}</td>
                      <td className="p-3 text-[#2D3436]">{row.lastProgressDate || '—'}</td>
                      <td className="p-3 text-[#2D3436]">{row.submittedThisWeek ? 'Taip' : 'Ne'}</td>
                      <td className="p-3 text-[#2D3436]">
                        {row.trend === 'improving' ? 'Gerėja' : row.trend === 'worsening' ? 'Blogėja' : 'Stabili'}
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_STYLE[row.status]}`}>
                          {row.status === 'green' ? 'Green' : row.status === 'yellow' ? 'Yellow' : 'Red'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
