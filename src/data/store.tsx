import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Storage from '../platform/storage';
import type { DataState, Routine, WorkoutSession } from './types';
import { createSessionExercise, lastExercise, uid, validateSet, workingSets } from './workout';
import { parseData } from './validation';
import { EXERCISES } from './catalog';
const key='workout.data.v1';
export function emptyData():DataState {return {version:1,profile:{name:'',goal:'fitness',experience:'beginner',daysPerWeek:3,equipment:['Bodyweight','Dumbbell','Barbell'],preferredDays:[1,3,5],heightCm:null,targetWeightKg:null,completedOnboarding:false},settings:{restSeconds:90,autoRest:true,haptics:true,notifications:false},routines:[],customExercises:[],sessions:[],active:null,measurements:[],favoriteExerciseIds:[]};}
type TrainingContextValue={state:DataState;ready:boolean;loadFailed:boolean;error:string|null;saving:boolean;update:(recipe:(draft:DataState)=>void)=>void;flush:()=>Promise<void>;retry:()=>Promise<void>;replace:(data:DataState)=>Promise<void>;startWorkout:(routine?:Routine)=>Promise<string>;finishWorkout:()=>Promise<WorkoutSession>;discardWorkout:()=>Promise<void>};
const Context=createContext<TrainingContextValue|null>(null);
export function TrainingProvider({children}:{children:ReactNode}){
 const [state,setState]=useState<DataState>(emptyData);const current=useRef(state);
 const [ready,setReady]=useState(false);const [loadFailed,setLoadFailed]=useState(false);const blocked=useRef(true);
 const [error,setError]=useState<string|null>(null);const [saving,setSaving]=useState(false);
 const queue=useRef(Promise.resolve());const revision=useRef(0);const writeError=useRef<string|null>(null);
 const hydrate=useCallback(async()=>{try{const raw=await Storage.getItem(key);const data=raw?parseData(JSON.parse(raw)):emptyData();current.current=data;setState(data);blocked.current=false;setLoadFailed(false);setError(null);}catch{blocked.current=true;setLoadFailed(true);setError('Your saved data could not be opened. It has not been overwritten. Retry or restore a backup.');}finally{setReady(true);}},[]);
 useEffect(()=>{let cancelled=false;void Promise.resolve().then(()=>{if(!cancelled)void hydrate();});return()=>{cancelled=true;};},[hydrate]);
 function persist(next:DataState){const rev=++revision.current;setSaving(true);const json=JSON.stringify(next);queue.current=queue.current.then(async()=>{try{await Storage.setItem(key,json);writeError.current=null;if(rev===revision.current)setError(null);}catch{writeError.current='Changes could not be saved on this device. Keep the app open and retry.';setError(writeError.current);}finally{if(rev===revision.current)setSaving(false);}});}
 function update(recipe:(draft:DataState)=>void){if(blocked.current)throw new Error('Saved data is not ready.');const next=JSON.parse(JSON.stringify(current.current)) as DataState;recipe(next);current.current=next;setState(next);persist(next);}
 async function flush(){await queue.current;if(writeError.current)throw new Error(writeError.current);}
 async function retry(){if(blocked.current)await hydrate();else{persist(current.current);await flush();}}
 async function replace(data:DataState){const next=parseData(data);await queue.current;await Storage.setItem(key,JSON.stringify(next));current.current=next;setState(next);blocked.current=false;setLoadFailed(false);setReady(true);writeError.current=null;setError(null);}
 async function startWorkout(routine?:Routine){if(current.current.active)return current.current.active.id;const id=uid();const all=[...EXERCISES,...current.current.customExercises];const exercises=(routine?.exercises??[]).map(plan=>{const exercise=all.find(e=>e.id===plan.exerciseId);if(!exercise)throw new Error('A routine exercise is unavailable. Edit the routine to replace it.');return createSessionExercise(exercise,lastExercise(current.current.sessions,exercise.id),plan);});update(draft=>{draft.active={id,title:routine?.name??'My workout',startedAt:Date.now(),endedAt:null,pausedAt:null,pausedMs:0,notes:'',exercises,restEndsAt:null,feeling:null};});await flush();return id;}
 async function finishWorkout(){const active=current.current.active;if(!active)throw new Error('No workout is in progress.');if(!active.title.trim())throw new Error('Give your workout a name.');for(const exercise of active.exercises)for(const set of exercise.sets)if(set.done){const issue=validateSet(set,exercise.kind);if(issue)throw new Error(`${exercise.name}: ${issue}`);}if(!workingSets(active).length)throw new Error('Complete at least one working set before finishing.');const now=Date.now();const finished:WorkoutSession={...active,title:active.title.trim(),endedAt:now,pausedAt:null,pausedMs:active.pausedMs+(active.pausedAt?now-active.pausedAt:0),restEndsAt:null,exercises:active.exercises.map(e=>({...e,sets:e.sets.filter(s=>s.done)})).filter(e=>e.sets.length)};update(draft=>{draft.sessions.unshift(finished);draft.active=null;});await flush();return finished;}
 async function discardWorkout(){update(draft=>{draft.active=null;});await flush();}
 return <Context.Provider value={{state,ready,loadFailed,error,saving,update,flush,retry,replace,startWorkout,finishWorkout,discardWorkout}}>{children}</Context.Provider>;
}
export function useTraining(){const context=useContext(Context);if(!context)throw new Error('useTraining requires TrainingProvider');return context;}
