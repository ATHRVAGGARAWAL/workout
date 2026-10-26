export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms' | 'abs' | 'glutes' | 'quads' | 'hamstrings' | 'calves';
export type ExerciseKind = 'weighted' | 'bodyweight' | 'timed' | 'cardio';
export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';
export interface Exercise {
  id: string; name: string; muscle: MuscleGroup; secondaryMuscles: MuscleGroup[];
  equipment: string; kind: ExerciseKind; instructions: string; custom?: boolean;
}
export interface WorkoutSet {
  id: string; weight: string; reps: string; seconds: string; distance: string;
  type: SetType; done: boolean; rpe: string;
}
export interface SessionExercise {
  id: string; exerciseId: string; name: string; muscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[]; equipment: string; kind: ExerciseKind;
  sets: WorkoutSet[]; restSeconds: number; notes: string; supersetId: string | null;
}
export interface WorkoutSession {
  id: string; title: string; startedAt: number; endedAt: number | null;
  pausedAt: number | null; pausedMs: number; notes: string;
  exercises: SessionExercise[]; restEndsAt: number | null; feeling: number | null;
}
export interface RoutineExercise { exerciseId: string; sets: number; reps: number; restSeconds: number; }
export interface Routine { id: string; name: string; description: string; exercises: RoutineExercise[]; weekdays: number[]; }
export interface Profile {
  name: string; goal: 'strength' | 'muscle' | 'fitness' | 'fat-loss';
  experience: 'beginner' | 'intermediate' | 'advanced'; daysPerWeek: number;
  equipment: string[]; preferredDays: number[]; heightCm: number | null;
  targetWeightKg: number | null; completedOnboarding: boolean;
}
export interface Measurement { id: string; date: string; weightKg: number; waistCm: number | null; notes: string; bodyFatPercent?: number | null; leanMassKg?: number | null; source?: string; sourceId?: string; recordedAt?: number; }
export interface Settings { restSeconds: number; autoRest: boolean; haptics: boolean; notifications: boolean; reminders?: boolean; reminderHour?: number; reminderMinute?: number; }
export interface DataState {
  version: 1; profile: Profile; settings: Settings; routines: Routine[];
  customExercises: Exercise[]; sessions: WorkoutSession[]; active: WorkoutSession | null;
  measurements: Measurement[]; favoriteExerciseIds: string[];
}
