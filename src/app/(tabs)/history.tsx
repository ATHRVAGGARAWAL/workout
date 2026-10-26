import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Dumbbell, Search, X } from 'lucide-react-native';
import { useAppTheme } from '../../ThemeProvider';
import { useTraining } from '../../data/store';
import { durationSeconds, formatDate, formatDuration, localDate, sessionVolume, workingSets } from '../../data/workout';
import { Body, Card, Empty, Field, Heading, IconButton, Label, Screen, Title, u } from '../../components/ui';

export default function HistoryScreen() {
  const { theme: t } = useAppTheme(); const { state } = useTraining();
  const [search, setSearch] = useState(''); const [date, setDate] = useState<string | null>(null);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  const counts = useMemo(() => state.sessions.reduce<Record<string, number>>((result, session) => { const key = localDate(session.startedAt); result[key] = (result[key] ?? 0) + 1; return result; }, {}), [state.sessions]);
  const monthSessions = state.sessions.filter(session => localDate(session.startedAt).startsWith(monthKey));
  const filtered = [...monthSessions].filter(session => (!date || localDate(session.startedAt) === date) && `${session.title} ${session.notes} ${session.exercises.map(exercise => exercise.name).join(' ')}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.startedAt - a.startedAt);
  const first = (month.getDay() + 6) % 7; const length = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((first + length) / 7) * 7 }, (_, index) => index - first + 1);
  function move(delta: number) { setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1)); setDate(null); }
  return <Screen>
    <Heading eyebrow="YOUR TRAINING JOURNAL" title="Every session counts." subtitle={`${state.sessions.length} ${state.sessions.length === 1 ? 'workout' : 'workouts'} in your story.`} />
    <Card>
      <View style={[u.row, { justifyContent: 'space-between' }]}><IconButton label="Previous month" onPress={() => move(-1)}><ChevronLeft size={20} color={t.text} /></IconButton><Pressable accessibilityRole="button" accessibilityLabel="Return to current month" onPress={() => { setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); setDate(null); }}><Title>{new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(month)}</Title></Pressable><IconButton label="Next month" onPress={() => move(1)}><ChevronRight size={20} color={t.text} /></IconButton></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 5 }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => <View key={`label-${index}`} style={{ width: '14.285%', alignItems: 'center', paddingBottom: 8 }}><Text style={{ color: t.muted, fontSize: 10 }}>{label}</Text></View>)}{cells.map((day, index) => {
        const valid = day > 0 && day <= length; const key = `${monthKey}-${String(day).padStart(2, '0')}`; const count = counts[key] ?? 0; const active = date === key;
        return <View key={index} style={{ width: '14.285%', alignItems: 'center' }}>{valid ? <Pressable accessibilityRole="button" accessibilityLabel={`${key}, ${count} workouts`} accessibilityState={{ selected: active }} onPress={() => setDate(active ? null : key)} style={{ width: 35, minHeight: 40, borderRadius: 11, backgroundColor: active ? t.accent : count ? t.accent + '24' : 'transparent', borderWidth: 1, borderColor: key === localDate() ? t.accent : 'transparent', justifyContent: 'center', alignItems: 'center', gap: 4 }}><Text style={{ color: active ? t.onAccent : count ? t.accent : t.muted, fontSize: 12, fontWeight: count ? '700' : '400' }}>{day}</Text><View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: count ? active ? t.onAccent : t.accent : 'transparent' }} /></Pressable> : <View style={{ height: 40 }} />}</View>;
      })}</View>
      <Body muted style={{ fontSize: 11 }}>{monthSessions.length} workouts this month · tap a day to filter</Body>
    </Card>
    <Field accessibilityLabel="Search workout history" placeholder="Search sessions or exercises…" value={search} onChangeText={setSearch} />
    <View style={[u.row, { justifyContent: 'space-between' }]}><Label>{date ? formatDate(date) : 'MONTHLY HISTORY'}</Label>{date && <Pressable accessibilityRole="button" accessibilityLabel="Clear date filter" onPress={() => setDate(null)} style={[u.row, { gap: 5, minHeight: 40 }]}><Text style={{ color: t.accent, fontSize: 12 }}>Show month</Text><X size={14} color={t.accent} /></Pressable>}</View>
    {!filtered.length ? <Empty title={state.sessions.length ? 'No sessions here' : 'Your story starts here'} message={state.sessions.length ? 'Choose another month, clear your search, or pick a different day.' : 'Finish a workout to start building a history you can return to.'} icon={state.sessions.length ? <Search size={30} color={t.muted} /> : <CalendarDays size={30} color={t.accent} />} /> : filtered.map(session => <Pressable key={session.id} accessibilityRole="button" accessibilityLabel={`Open ${session.title} from ${formatDate(session.startedAt)}`} onPress={() => router.push({ pathname: '/session/[id]', params: { id: session.id } })}><Card><View style={u.row}><View style={{ flex: 1, gap: 7 }}><Label>{formatDate(session.startedAt)}</Label><Title>{session.title}</Title></View><ChevronRight size={20} color={t.muted} /></View><Text numberOfLines={2} style={{ color: t.muted, fontSize: 12, lineHeight: 19 }}>{session.exercises.map(exercise => exercise.name).join(' · ')}</Text><View style={[u.row, { flexWrap: 'wrap', columnGap: 18, rowGap: 10 }]}><View style={[u.row, { gap: 5 }]}><Clock3 size={13} color={t.accent} /><Text style={{ color: t.text, fontSize: 11 }}>{formatDuration(durationSeconds(session))}</Text></View><View style={[u.row, { gap: 5 }]}><Dumbbell size={13} color={t.accent} /><Text style={{ color: t.text, fontSize: 11 }}>{Math.round(sessionVolume(session)).toLocaleString()} kg</Text></View><Text style={{ color: t.muted, fontSize: 11 }}>{workingSets(session).length} working sets</Text></View></Card></Pressable>)}
  </Screen>;
}
