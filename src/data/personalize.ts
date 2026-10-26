import { EXERCISES } from './catalog';
import type { Profile, Routine, RoutineExercise } from './types';

export const GOAL_LABELS: Record<Profile['goal'], string> = { strength: 'Get stronger', muscle: 'Build muscle', fitness: 'Build consistency', 'fat-loss': 'Support fat loss' };
export const EXPERIENCE_LABELS: Record<Profile['experience'], string> = { beginner: 'Getting started', intermediate: 'Training regularly', advanced: 'Experienced lifter' };
export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function defaultDays(count: number) { return [1, 3, 5, 2, 4, 6, 0].slice(0, Math.max(1, Math.min(7, count))).sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)); }

/** Editable starting plans use only the selected equipment and floor-based bodyweight fallbacks. */
export function suggestedRoutines(profile: Profile): Routine[] {
  const allowed = new Set(['Bodyweight', ...profile.equipment]);
  const available = (id: string) => EXERCISES.some(exercise => exercise.id === id && allowed.has(exercise.equipment));
  const choose = (...ids: string[]) => ids.find(available);
  const picks = {
    push: choose('bench-press', 'dumbbell-bench', 'chest-press', 'push-up'),
    pushAlt: choose('incline-dumbbell', 'incline-bench', 'push-up'),
    pull: choose('dumbbell-row', 'barbell-row', 'seated-row', 'band-row'),
    pullAlt: choose('lat-pulldown', 'chest-supported-row', 'barbell-row', 'band-row'),
    shoulder: choose('dumbbell-shoulder-press', 'overhead-press', 'pike-push-up'),
    shoulderSide: choose('lateral-raise', 'cable-lateral-raise'),
    curl: choose('dumbbell-curl', 'barbell-curl', 'cable-curl', 'preacher-curl'),
    triceps: choose('triceps-pushdown', 'overhead-triceps', 'close-grip-bench'),
    squat: choose('back-squat', 'goblet-squat', 'leg-press', 'bodyweight-squat'),
    hinge: choose('romanian-deadlift', 'dumbbell-rdl', 'leg-curl', 'glute-bridge'),
    lunge: choose('reverse-lunge', 'walking-lunge'),
    glutes: choose('hip-thrust', 'cable-kickback', 'glute-bridge'),
    calf: choose('dumbbell-calf-raise', 'standing-calf-raise', 'bodyweight-calf-raise'),
    core: 'dead-bug', coreHold: 'plank', coreSide: 'side-plank',
    engine: allowed.has('Cardio') ? (profile.experience === 'beginner' || profile.goal === 'fat-loss' ? 'walk' : 'run') : 'mountain-climber',
  };
  const sets = profile.experience === 'beginner' ? 2 : profile.experience === 'advanced' ? 4 : 3;
  const reps = profile.goal === 'strength' ? (profile.experience === 'beginner' ? 8 : 5) : profile.goal === 'muscle' ? 10 : 12;
  const rest = profile.goal === 'strength' ? 150 : profile.goal === 'muscle' ? 90 : 60;
  const base: Record<string, { name: string; ids: (string | undefined)[] }> = {
    fullA: { name: 'Full body A', ids: [picks.squat, picks.push, picks.pull, picks.hinge, picks.core] },
    fullB: { name: 'Full body B', ids: [picks.lunge, picks.shoulder, picks.pullAlt, picks.glutes, picks.coreHold] },
    upper: { name: 'Upper body', ids: [picks.push, picks.pull, picks.shoulder, picks.curl, picks.triceps] },
    lower: { name: 'Lower body', ids: [picks.squat, picks.hinge, picks.lunge, picks.calf, picks.core] },
    push: { name: 'Push', ids: [picks.push, picks.pushAlt, picks.shoulder, picks.shoulderSide, picks.triceps] },
    pull: { name: 'Pull & core', ids: [picks.pull, picks.pullAlt, picks.curl, picks.coreHold, picks.coreSide] },
    legs: { name: 'Legs', ids: [picks.squat, picks.hinge, picks.lunge, picks.glutes, picks.calf] },
    easy: { name: 'Easy movement & core', ids: [picks.engine, picks.core, picks.coreSide] },
  };
  // Floor-only plans cannot pretend a pull-up bar or suspension station is available.
  if (!picks.pull) {
    base.upper = { name: 'Upper body & core', ids: [picks.push, picks.shoulder, picks.core, picks.coreHold] };
    base.pull = { name: 'Core & movement', ids: [picks.core, picks.coreSide, picks.engine, picks.glutes] };
  }
  const days = Math.max(1, Math.min(7, profile.daysPerWeek));
  const sequences: Record<number, string[]> = { 1: ['fullA'], 2: ['fullA', 'fullB'], 3: ['fullA', 'fullB', 'fullA'], 4: ['upper', 'lower', 'upper', 'lower'], 5: ['push', 'pull', 'legs', 'upper', 'lower'], 6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'], 7: ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'easy'] };
  const sequence = sequences[days];
  const preferred = [...new Set(profile.preferredDays)].filter(day => day >= 0 && day <= 6);
  const schedule = [...preferred, ...defaultDays(7).filter(day => !preferred.includes(day))].slice(0, days).sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const result: Routine[] = [];
  sequence.forEach((key, index) => {
    const existing = result.find(routine => routine.id === `plan-${key}`);
    if (existing) { existing.weekdays.push(schedule[index]); return; }
    const template = base[key];
    const ids = [...new Set(template.ids.filter((id): id is string => !!id))];
    if ((profile.goal === 'fitness' || profile.goal === 'fat-loss') && key !== 'easy' && ids.length < 6 && !ids.includes(picks.engine)) ids.push(picks.engine);
    const exercises: RoutineExercise[] = ids.map(id => {
      const exercise = EXERCISES.find(item => item.id === id)!;
      return { exerciseId: id, sets: exercise.kind === 'cardio' ? 1 : exercise.kind === 'timed' ? 2 : sets, reps: exercise.kind === 'timed' ? 30 : exercise.kind === 'cardio' ? 1 : reps, restSeconds: exercise.kind === 'cardio' ? 0 : exercise.kind === 'timed' ? 45 : rest };
    });
    result.push({ id: `plan-${key}`, name: template.name, description: `${GOAL_LABELS[profile.goal]} · ${EXPERIENCE_LABELS[profile.experience]}. An editable starting point; choose a comfortable load and adjust as you learn.${!picks.pull ? ' Add resistance bands or suitable pulling equipment to include rows.' : ''}`, exercises, weekdays: [schedule[index]] });
  });
  return result;
}
