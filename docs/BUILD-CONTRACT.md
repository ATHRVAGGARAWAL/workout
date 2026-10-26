# Build coordination

All routes use Expo Router in src/app/. Default app is real data, no samples. ThemeProvider/useAppTheme supplies theme, loaded, select. UI primitives in src/components/ui.tsx. Palette fields: background/surface/raised/line/text/muted/accent/onAccent. Use Lucide native SVG icons; no emoji UI.

Data contract: src/data/types.ts. Root agent owns src/data/store.tsx and src/data/validation.ts. Import useTraining from data/store:
- state: DataState, ready:boolean, error:string|null, saving:boolean
- update(recipe: (draft:DataState)=>void): void -- mutates a cloned state and serializes persistence
- flush(): Promise<void> -- await persistence (throw on failure)
- retry(): Promise<void>
- replace(data:DataState): Promise<void> -- validated backup restore
- startWorkout(routine?:Routine): Promise<string> -- resumes if active exists, otherwise creates new; route /workout
- finishWorkout():Promise<WorkoutSession> -- validates and commits, strips incomplete sets
- discardWorkout():Promise<void>

Root owns domain helpers in src/data/workout.ts:
uid(), localDate(timestamp=Date.now()):YYYY-MM-DD, formatDate(timestamp|string):string, durationSeconds(session,now=Date.now()), formatDuration(seconds):string,
workingSets(session): {exercise:SessionExercise,set:WorkoutSet}[], sessionVolume(session):number,
estimated1RM(weight:number,reps:number):number, lastExercise(sessions,exerciseId):SessionExercise|undefined,
createSessionExercise(exercise:Exercise,previous?:SessionExercise,planned?:RoutineExercise):SessionExercise,
newSet():WorkoutSet, validateSet(set,kind):string|null.

Screens owned by agent train_screens: (tabs)/index.tsx, (tabs)/history.tsx, session/[id].tsx, routine/[id].tsx, library.tsx, components/ExercisePicker.tsx, data/catalog.ts.
Screens owned by agent insights: (tabs)/progress.tsx, exercise/[id].tsx, components/charts/*, data/analytics.ts. Can add measurements UI within progress.
Screens owned by agent personalize: onboarding.tsx, (tabs)/settings.tsx, platform/backup.ts and backup.web.ts, data/personalize.ts. Use validation parseBackup and backupJSON exposed by root. Profile setup on first launch at root; settings edit can route /onboarding?edit=1.
Root owns workout.tsx (advanced logging), layouts, data store/helpers/schema, testing and build config.

Data/catalog exports EXERCISES: Exercise[], EQUIPMENT:string[], MUSCLE_LABELS:Record<MuscleGroup,string>. data/personalize exports suggestedRoutines(profile:Profile):Routine[] based on equipment/days/goal/experience, safe fallback for no equipment; only seed upon explicit onboarding plan creation. Avoid hard prescribing based on age/injury etc.

Backup JSON is {format:'workout-backup',version:1,exportedAt:string,data:DataState}. parseBackup(text):DataState validates. backupJSON(data):string.

Session set weights are canonical kg as editable strings. Cardio distance is km string; timed seconds is seconds string. SessionExercise snapshots preserve exercise history even if library changes. Normal/drop/failure done sets count; warmup and undone excluded from volume/PR/muscle workloads. No fabricated recovery percentages. Measurements have local YYYY-MM-DD date.
