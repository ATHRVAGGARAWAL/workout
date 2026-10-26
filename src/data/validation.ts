import { z } from 'zod';
import type { DataState } from './types';
import { validateSet } from './workout';
const finite = z.number().finite();
const id = z.string().min(1).max(150);
const short = z.string().max(150);
const muscle = z.enum(['chest','back','shoulders','biceps','triceps','forearms','abs','glutes','quads','hamstrings','calves']);
const kind = z.enum(['weighted','bodyweight','timed','cardio']);
const day = z.number().int().min(0).max(6);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(`${v}T12:00:00Z`);return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;},'Invalid calendar date');
const set = z.object({id,weight:z.string().max(15),reps:z.string().max(15),seconds:z.string().max(15),distance:z.string().max(15),rpe:z.string().max(8),type:z.enum(['normal','warmup','drop','failure']),done:z.boolean()});
const sessionExercise = z.object({id,exerciseId:id,name:short,muscle,secondaryMuscles:z.array(muscle).max(11),equipment:short,kind,sets:z.array(set).max(50),restSeconds:z.number().int().min(0).max(1800),notes:z.string().max(5000),supersetId:id.nullable()});
const session = z.object({id,title:short,startedAt:finite.nonnegative(),endedAt:finite.nonnegative().nullable(),pausedAt:finite.nonnegative().nullable(),pausedMs:finite.nonnegative(),notes:z.string().max(10000),exercises:z.array(sessionExercise).max(100),restEndsAt:finite.nonnegative().nullable(),feeling:z.number().int().min(1).max(5).nullable()}).superRefine((s,ctx)=>{
 if(s.endedAt!==null&&s.endedAt<s.startedAt)ctx.addIssue({code:'custom',message:'Workout ends before it starts'});
 const ids=s.exercises.map(e=>e.id);if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',message:'Duplicate workout exercises'});
 for(const e of s.exercises){if(new Set(e.sets.map(v=>v.id)).size!==e.sets.length)ctx.addIssue({code:'custom',message:'Duplicate set IDs'});for(const row of e.sets)if(row.done&&s.endedAt!==null){const error=validateSet(row,e.kind);if(error)ctx.addIssue({code:'custom',message:error});}}
});
export const dataSchema = z.object({
 version:z.literal(1),
 profile:z.object({name:z.string().max(60),goal:z.enum(['strength','muscle','fitness','fat-loss']),experience:z.enum(['beginner','intermediate','advanced']),daysPerWeek:z.number().int().min(1).max(7),equipment:z.array(short).max(30),preferredDays:z.array(day).max(7),heightCm:finite.min(50).max(300).nullable(),targetWeightKg:finite.min(20).max(500).nullable(),completedOnboarding:z.boolean()}),
 settings:z.object({restSeconds:z.number().int().min(0).max(1800),autoRest:z.boolean(),haptics:z.boolean(),notifications:z.boolean(),reminders:z.boolean().optional(),reminderHour:z.number().int().min(0).max(23).optional(),reminderMinute:z.number().int().min(0).max(59).optional()}),
 routines:z.array(z.object({id,name:short,description:z.string().max(2000),weekdays:z.array(day).max(7),exercises:z.array(z.object({exerciseId:id,sets:z.number().int().min(1).max(30),reps:z.number().int().min(1).max(1000),restSeconds:z.number().int().min(0).max(1800)})).max(100)})).max(300),
 customExercises:z.array(z.object({id,name:short,muscle,secondaryMuscles:z.array(muscle).max(11),equipment:short,kind,instructions:z.string().max(5000),custom:z.boolean().optional()})).max(1000),
 sessions:z.array(session).max(10000),active:session.nullable(),
 measurements:z.array(z.object({id,date,weightKg:finite.min(20).max(500),waistCm:finite.min(20).max(300).nullable(),notes:z.string().max(2000),bodyFatPercent:finite.min(1).max(75).nullable().optional(),leanMassKg:finite.min(1).max(300).nullable().optional(),source:z.string().max(200).optional(),sourceId:z.string().max(300).optional(),recordedAt:finite.nonnegative().optional()})).max(10000),favoriteExerciseIds:z.array(id).max(2000),
}).superRefine((data,ctx)=>{
 for(const rows of [data.routines,data.customExercises,data.sessions,data.measurements])if(new Set(rows.map(row=>row.id)).size!==rows.length)ctx.addIssue({code:'custom',message:'Backup contains duplicate IDs'});
 if(data.active?.endedAt!==null&&data.active)ctx.addIssue({code:'custom',message:'Active workout is already finished'});
 if(data.sessions.some(s=>s.endedAt===null))ctx.addIssue({code:'custom',message:'History contains unfinished workouts'});
 if(data.active&&data.sessions.some(s=>s.id===data.active!.id))ctx.addIssue({code:'custom',message:'Active workout is duplicated in history'});
});
export function parseData(value:unknown):DataState { const parsed=dataSchema.safeParse(value);if(!parsed.success)throw new Error(`Workout data is invalid: ${parsed.error.issues[0]?.message ?? 'unsupported format'}`);return parsed.data; }
export function parseBackup(text:string):DataState {
 if(text.length>20_000_000)throw new Error('Backup is larger than 20 MB.');
 let payload:unknown;try{payload=JSON.parse(text);}catch{throw new Error('Choose a valid JSON workout backup.');}
 const wrapper=z.object({format:z.literal('workout-backup'),version:z.literal(1),data:z.unknown()}).safeParse(payload);
 if(!wrapper.success)throw new Error('This file is not a compatible workout backup.');return parseData(wrapper.data.data);
}
export function backupJSON(data:DataState){return JSON.stringify({format:'workout-backup',version:1,exportedAt:new Date().toISOString(),data:parseData(data)},null,2);}
