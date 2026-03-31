import { useState, useEffect, useCallback } from 'react';
import { client } from '../lib/api';

/**
 * Weekly progress gate: patient must complete Savaitės progresas on schedule.
 *
 * Implemented behavior (source of truth):
 * - Fetch latest weekly_progress row for this patient (sort by entry_date desc).
 * - If there are no entries: locked (must submit before continuing elsewhere).
 * - If there is at least one entry: locked when (now − latest entry_date) >= 7 days.
 * - On fetch error: fail-open (unlocked) so the app does not hard-crash.
 *
 * There is no programStartDate in code; do not assume it from older comments elsewhere.
 */
export function useWeeklyLock(patientId: number | null | undefined) {
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastProgressDate, setLastProgressDate] = useState<string | null>(null);

  const checkLock = useCallback(async () => {
    if (!patientId) {
      setIsLocked(false);
      setLoading(false);
      return;
    }

    try {
      const res = await client.entities.weekly_progress.query({
        query: { patient_id: patientId },
        sort: '-entry_date',
        limit: 1,
      });

      const data = res.data;
      const items = (data as any).items || [];

      if (items.length === 0) {
        // No entries at all — treat as needing evaluation
        // (user has never submitted, so they should be locked)
        setIsLocked(true);
        setLastProgressDate(null);
        setLoading(false);
        return;
      }

      const latestEntry = items[0];
      const entryDateStr: string = latestEntry.entry_date || '';
      setLastProgressDate(entryDateStr);

      // Parse the entry date. Support both "YYYY-MM-DD" and Lithuanian "YYYY.MM.DD" or "YYYY-MM-DD" formats
      const parsedDate = parseEntryDate(entryDateStr);

      if (!parsedDate) {
        // Can't parse date — treat as needing evaluation (safe fallback)
        setIsLocked(true);
        setLoading(false);
        return;
      }

      const now = new Date();
      const diffMs = now.getTime() - parsedDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      setIsLocked(diffDays >= 7);
    } catch (err) {
      console.error('Error checking weekly lock:', err);
      // On error, don't lock the user (safe fallback — don't crash the app)
      setIsLocked(false);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    checkLock();
  }, [checkLock]);

  const refresh = useCallback(() => {
    setLoading(true);
    checkLock();
  }, [checkLock]);

  return { isLocked, loading, lastProgressDate, refresh };
}

/**
 * Parse entry_date string into a Date object.
 * Supports formats:
 * - "YYYY-MM-DD"
 * - "YYYY.MM.DD"  
 * - "YYYY-M-D" (single digit month/day)
 * - Lithuanian locale format "YYYY-MM-DD" from toLocaleDateString('lt-LT')
 */
function parseEntryDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try standard ISO format first
  const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    if (!isNaN(d.getTime())) return d;
  }

  // Try dot-separated format
  const dotMatch = dateStr.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (dotMatch) {
    const d = new Date(Number(dotMatch[1]), Number(dotMatch[2]) - 1, Number(dotMatch[3]));
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback: try native Date parsing
  const fallback = new Date(dateStr);
  if (!isNaN(fallback.getTime())) return fallback;

  return null;
}