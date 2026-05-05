import { FormEvent, useMemo, useState } from 'react';
import { getAPIBaseURL } from '@/lib/config';

type FunnelStage = 'paid_only' | 'onboarded_no_activity' | 'active' | 'at_risk' | 'inactive';

interface AdminUser {
  patient_id: number;
  name: string;
  email: string;
  login_alias: string;
  assigned_program: string;
  week: number;
  access_allowed: boolean;
  pradzia_completed_at: string | null;
  completed_exercises_count: number;
  submitted_days_count: number;
  last_exercise_completed_at: string | null;
  last_day_submitted_at: string | null;
  last_activity: string | null;
  funnel_stage: FunnelStage;
  status: string;
}

interface AdminUsersResponse {
  environment: 'production' | 'local' | string;
  users: AdminUser[];
}

const STAGE_STYLE: Record<FunnelStage, string> = {
  paid_only: 'bg-violet-100 text-violet-800 border-violet-200',
  onboarded_no_activity: 'bg-slate-100 text-slate-700 border-slate-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  at_risk: 'bg-amber-100 text-amber-800 border-amber-200',
  inactive: 'bg-red-100 text-red-800 border-red-200',
};

function formatDate(value: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function Admin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [environment, setEnvironment] = useState<string>('local');

  const stageCounts = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc[user.funnel_stage] += 1;
        return acc;
      },
      { paid_only: 0, onboarded_no_activity: 0, active: 0, at_risk: 0, inactive: 0 } as Record<FunnelStage, number>
    );
  }, [users]);

  const loadUsers = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${getAPIBaseURL()}/api/admin/users`, {
        method: 'GET',
        headers: {
          'x-admin-password': password,
        },
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.detail || `Request failed with status ${res.status}`);
      }

      const payload = (await res.json()) as AdminUsersResponse;
      setEnvironment(payload.environment || 'local');
      setUsers(payload.users || []);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load users';
      setError(message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch (_e) {
      // Keep MVP simple; no toast dependency needed.
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3436]">Admin User Tracking</h1>
          <p className="text-sm text-[#636E72] mt-1">Read-only /pradzia registration activity view.</p>
          <p className="text-sm text-[#636E72] mt-1">
            Environment: <span className="font-semibold text-[#2D3436]">{environment}</span>
          </p>
        </div>

        <form onSubmit={loadUsers} className="bg-white border border-[#E8E5E0] rounded-xl p-4 flex flex-col md:flex-row gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="flex-1 border border-[#DCD8D2] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B8A72]"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#5B8A72] text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Load users'}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded-full border border-violet-200 bg-violet-100 text-violet-800">
            paid_only: {stageCounts.paid_only}
          </span>
          <span className="px-2 py-1 rounded-full border border-slate-200 bg-slate-100 text-slate-700">
            onboarded_no_activity: {stageCounts.onboarded_no_activity}
          </span>
          <span className="px-2 py-1 rounded-full border border-green-200 bg-green-100 text-green-800">
            active: {stageCounts.active}
          </span>
          <span className="px-2 py-1 rounded-full border border-amber-200 bg-amber-100 text-amber-800">
            at_risk: {stageCounts.at_risk}
          </span>
          <span className="px-2 py-1 rounded-full border border-red-200 bg-red-100 text-red-800">
            inactive: {stageCounts.inactive}
          </span>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>
        ) : null}

        <div className="bg-white border border-[#E8E5E0] rounded-xl overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAF8] text-[#636E72]">
              <tr>
                <th className="text-left p-3">patient_id</th>
                <th className="text-left p-3">name</th>
                <th className="text-left p-3">email</th>
                <th className="text-left p-3">login_alias</th>
                <th className="text-left p-3">assigned_program</th>
                <th className="text-left p-3">week</th>
                <th className="text-left p-3">access_allowed</th>
                <th className="text-left p-3">pradzia_completed_at</th>
                <th className="text-left p-3">completed_exercises_count</th>
                <th className="text-left p-3">submitted_days_count</th>
                <th className="text-left p-3">last_exercise_completed_at</th>
                <th className="text-left p-3">last_day_submitted_at</th>
                <th className="text-left p-3">last_activity</th>
                <th className="text-left p-3">funnel_stage</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.patient_id} className="border-t border-[#F0F0ED] align-top">
                  <td className="p-3 text-[#2D3436]">{user.patient_id}</td>
                  <td className="p-3 text-[#2D3436]">{user.name}</td>
                  <td className="p-3 text-[#2D3436]">
                    <div className="flex items-center gap-2">
                      <span>{user.email || '-'}</span>
                      {user.email ? (
                        <button
                          type="button"
                          onClick={() => copyText(user.email)}
                          className="text-xs px-2 py-1 border rounded-md text-[#2D3436]"
                        >
                          Copy
                        </button>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-3 text-[#2D3436]">
                    <div className="flex items-center gap-2">
                      <span>{user.login_alias || '-'}</span>
                      {user.login_alias ? (
                        <button
                          type="button"
                          onClick={() => copyText(user.login_alias)}
                          className="text-xs px-2 py-1 border rounded-md text-[#2D3436]"
                        >
                          Copy
                        </button>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-3 text-[#2D3436]">{user.assigned_program}</td>
                  <td className="p-3 text-[#2D3436]">{user.week}</td>
                  <td className="p-3 text-[#2D3436]">{user.access_allowed ? 'true' : 'false'}</td>
                  <td className="p-3 text-[#2D3436]">{formatDate(user.pradzia_completed_at)}</td>
                  <td className="p-3 text-[#2D3436]">{user.completed_exercises_count}</td>
                  <td className="p-3 text-[#2D3436]">{user.submitted_days_count}</td>
                  <td className="p-3 text-[#2D3436]">{formatDate(user.last_exercise_completed_at)}</td>
                  <td className="p-3 text-[#2D3436]">{formatDate(user.last_day_submitted_at)}</td>
                  <td className="p-3 text-[#2D3436]">{formatDate(user.last_activity)}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full border ${STAGE_STYLE[user.funnel_stage]}`}>
                      {user.funnel_stage}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-4 text-center text-[#636E72]">
                    No data loaded.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
