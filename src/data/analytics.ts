import { validateSet } from './workout';
import type { ExerciseKind, MuscleGroup, SessionExercise, WorkoutSession, WorkoutSet } from './types';

export const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'glutes', 'quads', 'hamstrings', 'calves'];
export function dateKey(value = Date.now()) { const d = new Date(value); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function shiftDay(key: string, days: number) { const d = new Date(`${key}T12:00:00`); d.setDate(d.getDate() + days); return dateKey(d.getTime()); }
export function weekKey(value = Date.now()) { const d = new Date(value); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dateKey(d.getTime()); }
const n = (value: string) => { const parsed = Number(value); return value.trim() && Number.isFinite(parsed) && parsed >= 0 ? parsed : 0; };
export function countable(set: WorkoutSet, kind: ExerciseKind) {
  if (!set.done || set.type === 'warmup' || validateSet(set, kind)) return false;
  if (kind === 'timed') return n(set.seconds) > 0;
  if (kind === 'cardio') return n(set.seconds) > 0 && n(set.distance) > 0;
  return Number.isInteger(n(set.reps)) && n(set.reps) > 0;
}
export function completedSessions(sessions: WorkoutSession[]) { return sessions.filter(s => s.endedAt !== null).sort((a, b) => a.startedAt - b.startedAt); }
export function completedEfforts(session: WorkoutSession) { return session.exercises.flatMap(exercise => exercise.sets.filter(set => countable(set, exercise.kind)).map(set => ({ exercise, set }))); }
export function volumeOf(session: WorkoutSession) { return completedEfforts(session).reduce((sum, { exercise, set }) => sum + (exercise.kind === 'weighted' ? n(set.weight) * n(set.reps) : 0), 0); }
export function minutesOf(session: WorkoutSession) { return Math.max(0, ((session.endedAt ?? session.startedAt) - session.startedAt - session.pausedMs) / 60000); }
export type MuscleWork = { muscle: MuscleGroup; direct: number; assisting: number; sessions: number };
export function muscleWorkload(sessions: WorkoutSession[]): MuscleWork[] {
  const result = MUSCLE_GROUPS.map(muscle => ({ muscle, direct: 0, assisting: 0, sessions: 0 }));
  for (const session of completedSessions(sessions)) {
    const involved = new Set<MuscleGroup>();
    for (const { exercise } of completedEfforts(session)) {
      const direct = result.find(item => item.muscle === exercise.muscle);
      if (direct) { direct.direct++; involved.add(direct.muscle); }
      for (const muscle of new Set(exercise.secondaryMuscles)) {
        if (muscle === exercise.muscle) continue;
        const row = result.find(item => item.muscle === muscle);
        if (row) { row.assisting++; involved.add(muscle); }
      }
    }
    for (const row of result) if (involved.has(row.muscle)) row.sessions++;
  }
  return result;
}
export type ActivityWeek = { key: string; label: string; sessions: number; days: number; volume: number; minutes: number; sets: number };
export function weeklyActivity(sessions: WorkoutSession[], weeks = 12, now = Date.now()): ActivityWeek[] {
  const current = weekKey(now);
  const buckets: ActivityWeek[] = Array.from({ length: weeks }, (_, i) => { const key = shiftDay(current, (i - weeks + 1) * 7); const d = new Date(`${key}T12:00:00`); return { key, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), sessions: 0, days: 0, volume: 0, minutes: 0, sets: 0 }; });
  const days = new Map<string, Set<string>>();
  for (const session of completedSessions(sessions)) {
    if (session.startedAt > now) continue;
    const key = weekKey(session.startedAt), bucket = buckets.find(item => item.key === key);
    if (!bucket) continue;
    bucket.sessions++; bucket.volume += volumeOf(session); bucket.minutes += minutesOf(session); bucket.sets += completedEfforts(session).length;
    const visited = days.get(key) ?? new Set<string>(); visited.add(dateKey(session.startedAt)); days.set(key, visited); bucket.days = visited.size;
  }
  return buckets;
}
export type ActivityDay = { key: string; count: number; minutes: number; future: boolean; sessions: WorkoutSession[] };
export function calendarDays(sessions: WorkoutSession[], weeks = 12, now = Date.now()): ActivityDay[] {
  const first = shiftDay(weekKey(now), -(weeks - 1) * 7), today = dateKey(now);
  const byDay = new Map<string, WorkoutSession[]>();
  for (const session of completedSessions(sessions)) { const key = dateKey(session.startedAt); byDay.set(key, [...(byDay.get(key) ?? []), session]); }
  return Array.from({ length: weeks * 7 }, (_, i) => { const key = shiftDay(first, i), entries = byDay.get(key) ?? []; return { key, count: entries.length, minutes: entries.reduce((sum, entry) => sum + minutesOf(entry), 0), future: key > today, sessions: entries }; });
}
export type ExercisePoint = { sessionId: string; at: number; date: string; name: string; kind: ExerciseKind; weight: number; reps: number; e1rm: number; volume: number; seconds: number; distance: number; sets: number; entries: SessionExercise[] };
export function exerciseHistory(sessions: WorkoutSession[], exerciseId: string): ExercisePoint[] {
  return completedSessions(sessions).flatMap(session => {
    const entries = session.exercises.filter(exercise => exercise.exerciseId === exerciseId);
    const efforts = entries.flatMap(exercise => exercise.sets.filter(set => countable(set, exercise.kind)).map(set => ({ set, kind: exercise.kind })));
    if (!efforts.length) return [];
    const kind = entries[0].kind;
    return [{ sessionId: session.id, at: session.startedAt, date: dateKey(session.startedAt), name: entries[0].name, kind, entries,
      weight: Math.max(0, ...efforts.filter(e => e.kind === 'weighted').map(e => n(e.set.weight))),
      reps: Math.max(0, ...efforts.filter(e => e.kind === 'weighted' || e.kind === 'bodyweight').map(e => n(e.set.reps))),
      e1rm: Math.max(0, ...efforts.filter(e => e.kind === 'weighted' && n(e.set.weight) > 0 && n(e.set.reps) <= 12).map(e => n(e.set.reps) === 1 ? n(e.set.weight) : n(e.set.weight) * (1 + n(e.set.reps) / 30))),
      volume: efforts.reduce((sum, e) => sum + (e.kind === 'weighted' ? n(e.set.weight) * n(e.set.reps) : 0), 0),
      seconds: Math.max(0, ...efforts.filter(e => e.kind === 'timed' || e.kind === 'cardio').map(e => n(e.set.seconds))),
      distance: Math.max(0, ...efforts.filter(e => e.kind === 'cardio').map(e => n(e.set.distance))), sets: efforts.length }];
  });
}
export type ExerciseRecord = { exerciseId: string; name: string; kind: ExerciseKind; muscle: MuscleGroup; weight: number; reps: number; e1rm: number; volume: number; seconds: number; distance: number; lastAt: number; sessionCount: number };
export function exerciseRecords(sessions: WorkoutSession[], exerciseId: string): ExerciseRecord | null {
  const points = exerciseHistory(sessions, exerciseId);
  if (!points.length) return null;
  const latest = points[points.length - 1];
  return { exerciseId, name: latest.name, kind: latest.kind, muscle: latest.entries[0].muscle, weight: Math.max(...points.map(p => p.weight)), reps: Math.max(...points.map(p => p.reps)), e1rm: Math.max(...points.map(p => p.e1rm)), volume: Math.max(...points.map(p => p.volume)), seconds: Math.max(...points.map(p => p.seconds)), distance: Math.max(...points.map(p => p.distance)), lastAt: latest.at, sessionCount: points.length };
}
export function personalRecords(sessions: WorkoutSession[]): ExerciseRecord[] {
  const ids = new Set(completedSessions(sessions).flatMap(session => session.exercises.map(exercise => exercise.exerciseId)));
  return [...ids].map(id => exerciseRecords(sessions, id)).filter((record): record is ExerciseRecord => record !== null).sort((a, b) => b.lastAt - a.lastAt);
}
export function consistencyStats(sessions: WorkoutSession[], weeklyGoal: number, now = Date.now()) {
  const ended = completedSessions(sessions).filter(session => session.startedAt <= now);
  const weeks = weeklyActivity(ended, 104, now), current = weeks[weeks.length - 1];
  let goalStreak = 0, index = current.days >= weeklyGoal ? weeks.length - 1 : weeks.length - 2;
  while (index >= 0 && weeks[index].days >= weeklyGoal) { goalStreak++; index--; }
  const dates = new Set(ended.map(session => dateKey(session.startedAt)));
  let dayStreak = 0, key = dates.has(dateKey(now)) ? dateKey(now) : shiftDay(dateKey(now), -1);
  while (dates.has(key)) { dayStreak++; key = shiftDay(key, -1); }
  return { totalSessions: ended.length, totalDays: dates.size, totalMinutes: ended.reduce((sum, session) => sum + minutesOf(session), 0), totalVolume: ended.reduce((sum, session) => sum + volumeOf(session), 0), thisWeek: current, goalStreak, dayStreak };
}
export function formatNumber(value: number, digits = 1) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value); }
