import { uid } from './id';
import type { Exercise, RoutineExercise, SessionExercise, WorkoutSession, WorkoutSet } from './types';
export { uid } from './id';

export function localDate(timestamp: number = Date.now()) { const d = new Date(timestamp); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function formatDate(timestamp: number | string) { const date = typeof timestamp === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(timestamp) ? new Date(`${timestamp}T12:00:00`) : new Date(timestamp); return date.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}); }
export function durationSeconds(session: WorkoutSession, now = Date.now()) { return Math.max(0, Math.floor(((session.endedAt ?? session.pausedAt ?? now) - session.startedAt - session.pausedMs) / 1000)); }
export function formatDuration(seconds: number) { const safe = Math.max(0,Math.floor(seconds)); const hours = Math.floor(safe/3600); const minutes = Math.floor(safe%3600/60); return hours ? `${hours}:${String(minutes).padStart(2,'0')}:${String(safe%60).padStart(2,'0')}` : `${minutes}:${String(safe%60).padStart(2,'0')}`; }
export function validateSet(set: WorkoutSet, kind: Exercise['kind']): string | null {
  const positive = (v:string,max:number,integer=false) => v.trim() !== '' && Number.isFinite(Number(v)) && Number(v)>0 && Number(v)<=max && (!integer || Number.isInteger(Number(v)));
  if (kind === 'weighted' && (set.weight.trim()==='' || !Number.isFinite(Number(set.weight)) || Number(set.weight)<0 || Number(set.weight)>2000)) return 'Enter a weight between 0 and 2,000 kg.';
  if ((kind === 'weighted' || kind === 'bodyweight') && !positive(set.reps,1000,true)) return 'Enter 1–1,000 whole repetitions.';
  if ((kind === 'timed' || kind === 'cardio') && !positive(set.seconds,86400,true)) return 'Enter a duration from 1 to 86,400 seconds.';
  if (kind === 'cardio' && !positive(set.distance,1000)) return 'Enter a distance greater than 0 and up to 1,000 km.';
  if (set.rpe.trim() && (!Number.isFinite(Number(set.rpe)) || Number(set.rpe)<1 || Number(set.rpe)>10 || Number(set.rpe)*2%1!==0)) return 'RPE must be 1–10 in steps of 0.5, or blank.';
  return null;
}
export function workingSets(session: WorkoutSession) { return session.exercises.flatMap(exercise => exercise.sets.filter(set => set.done && set.type !== 'warmup' && !validateSet(set, exercise.kind)).map(set=>({exercise,set}))); }
export function sessionVolume(session: WorkoutSession) { return workingSets(session).reduce((sum,{exercise,set}) => sum+(exercise.kind==='weighted'?Number(set.weight)*Number(set.reps):0),0); }
export function estimated1RM(weight:number,reps:number) { if(!Number.isFinite(weight)||!Number.isInteger(reps)||weight<=0||reps<1||reps>12)return 0; return reps===1?weight:weight*(1+reps/30); }
export function lastExercise(sessions:WorkoutSession[],exerciseId:string) { return [...sessions].filter(s=>s.endedAt!==null).sort((a,b)=>b.startedAt-a.startedAt).flatMap(s=>s.exercises).find(e=>e.exerciseId===exerciseId&&e.sets.some(set=>set.done&&set.type!=='warmup')); }
export function newSet():WorkoutSet { return {id:uid(),weight:'',reps:'',seconds:'',distance:'',type:'normal',done:false,rpe:''}; }
export function createSessionExercise(exercise:Exercise, previous?:SessionExercise, planned?:RoutineExercise):SessionExercise {
  const prior = previous?.sets.filter(set=>set.done&&set.type!=='warmup') ?? [];
  const count = planned?.sets ?? (prior.length || 3);
  return {id:uid(),exerciseId:exercise.id,name:exercise.name,muscle:exercise.muscle,secondaryMuscles:[...exercise.secondaryMuscles],equipment:exercise.equipment,kind:exercise.kind,restSeconds:planned?.restSeconds??previous?.restSeconds??90,notes:'',supersetId:null,sets:Array.from({length:count},(_,i)=>({ ...newSet(),weight:prior[i]?.weight??'',reps:prior[i]?.reps??String(planned?.reps??''),seconds:prior[i]?.seconds??(exercise.kind==='timed'&&planned?String(planned.reps):''),distance:prior[i]?.distance??'' }))};
}
