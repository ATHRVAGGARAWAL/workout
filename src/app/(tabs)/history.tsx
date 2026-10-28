import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowUpRight, Clock3, Dumbbell, Search, X } from 'lucide-react-native';
import { useAppTheme } from '../../ThemeProvider';
import { useTraining } from '../../data/store';
import { formatNumber } from '../../data/analytics';
import { durationSeconds, formatDate, formatDuration, localDate, sessionVolume, workingSets } from '../../data/workout';
import type { WorkoutSession } from '../../data/types';
import { Body, Button, Card, Field, Heading, Screen, Title, u } from '../../components/ui';

function monthKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export default function HistoryScreen() {
  const { theme: t } = useAppTheme();
  const { state } = useTraining();
  const [search, setSearch] = useState('');
  const sessions = useMemo(() => [...state.sessions].sort((a, b) => b.startedAt - a.startedAt), [state.sessions]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter(session => `${session.title} ${session.notes} ${session.exercises.map(exercise => exercise.name).join(' ')}`.toLowerCase().includes(query));
  }, [sessions, search]);
  const monthCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const session of filtered) {
      const key = monthKey(session.startedAt);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [filtered]);
  const summary = useMemo(() => ({
    days: new Set(sessions.map(session => localDate(session.startedAt))).size,
    seconds: sessions.reduce((total, session) => total + durationSeconds(session), 0),
    volume: sessions.reduce((total, session) => total + sessionVolume(session), 0),
  }), [sessions]);
  const timeLabel = summary.seconds >= 3600 ? `${formatNumber(summary.seconds / 3600)} hr` : formatDuration(summary.seconds);
  const volumeLabel = summary.volume >= 1_000_000 ? `${formatNumber(summary.volume / 1_000_000)}m` : summary.volume >= 10_000 ? `${formatNumber(summary.volume / 1000)}k` : formatNumber(summary.volume, 0);

  return <Screen scroll={false} style={{ padding: 0, gap: 0 }}>
    <FlatList
      data={filtered}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      style={{ width: '100%' }}
      contentContainerStyle={{ width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 44, gap: 12 }}
      ListHeaderComponent={<View style={{ gap: 19, marginBottom: 9 }}>
        <Heading eyebrow="YOUR JOURNAL" title="History" subtitle="The work you put in, all in one place." />
        <View style={{ backgroundColor: '#182A43', borderRadius: 25, padding: 21, gap: 18, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderColor: '#FFFFFF16', right: -75, top: -100 }} />
          <View style={[u.row, { alignItems: 'flex-end' }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: '#AFC9E8', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }}>ALL TIME</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 48, lineHeight: 54, letterSpacing: -1.7, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{sessions.length}</Text>
              <Text style={{ color: '#C7D4E2', fontSize: 13 }}>{sessions.length === 1 ? 'workout in your journal' : 'workouts in your journal'}</Text>
            </View>
            <View style={{ width: 45, height: 45, borderRadius: 15, backgroundColor: '#27486F', alignItems: 'center', justifyContent: 'center' }}><Dumbbell size={22} color="#B6D9FF" /></View>
          </View>
          <View style={{ height: 1, backgroundColor: '#FFFFFF20' }} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SummaryMetric label="DAYS ACTIVE" value={String(summary.days)} />
            <SummaryMetric label="TIME" value={timeLabel} />
            <SummaryMetric label="VOLUME · KG" value={volumeLabel} />
          </View>
        </View>
        <View style={{ gap: 10 }}>
          <View style={[u.row, { justifyContent: 'space-between' }]}><Title>Sessions</Title><Text style={{ color: t.muted, fontSize: 12 }}>{search.trim() ? `${filtered.length} found` : 'Newest first'}</Text></View>
          <View style={{ position: 'relative' }}><Search size={18} color={t.muted} style={{ position: 'absolute', left: 15, top: 15, zIndex: 1 }} /><Field accessibilityLabel="Search workout history" placeholder="Search workouts or exercises" returnKeyType="search" autoCorrect={false} value={search} onChangeText={setSearch} style={{ paddingLeft: 43, paddingRight: search ? 44 : 14 }} />{!!search && <Pressable accessibilityRole="button" accessibilityLabel="Clear history search" onPress={() => setSearch('')} style={{ position: 'absolute', right: 3, top: 2, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><X size={16} color={t.muted} /></Pressable>}</View>
        </View>
      </View>}
      ListEmptyComponent={<Card style={{ alignItems: 'center', paddingVertical: 34, gap: 12 }}>
        {search ? <Search size={27} color={t.muted} /> : <Dumbbell size={27} color={t.accent} />}
        <Title>{search ? 'No matches' : 'Your first session starts here'}</Title>
        <Body muted style={{ textAlign: 'center' }}>{search ? 'Try another workout or exercise name.' : 'Complete a workout and it will appear in your journal.'}</Body>
        {!search && <Button label="Start a workout" onPress={() => router.push('/')} />}
      </Card>}
      renderItem={({ item: session, index }) => <View style={{ gap: 9 }}>
        {(index === 0 || monthKey(filtered[index - 1].startedAt) !== monthKey(session.startedAt)) && <View style={[u.row, { justifyContent: 'space-between', marginTop: index ? 13 : 0 }]}><Text style={{ color: t.text, fontSize: 14, fontWeight: '700' }}>{new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(session.startedAt)}</Text><Text style={{ color: t.muted, fontSize: 12 }}>{monthCounts.get(monthKey(session.startedAt))} {monthCounts.get(monthKey(session.startedAt)) === 1 ? 'session' : 'sessions'}</Text></View>}
        <SessionCard session={session} />
      </View>}
    />
  </Screen>;
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return <View style={{ flex: 1, gap: 5 }}><Text style={{ color: '#AFC9E8', fontSize: 9, fontWeight: '700', letterSpacing: 0.7 }}>{label}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{value}</Text></View>;
}

function SessionCard({ session }: { session: WorkoutSession }) {
  const { theme: t } = useAppTheme();
  const date = new Date(session.startedAt);
  const otherExercises = Math.max(0, session.exercises.length - 1);
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${session.title} from ${formatDate(session.startedAt)}`} onPress={() => router.push({ pathname: '/session/[id]', params: { id: session.id } })} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
    <Card style={{ gap: 14, padding: 15, borderRadius: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 13 }}>
        <View style={{ width: 47, height: 53, borderRadius: 13, backgroundColor: t.id === 'dark' ? '#203A57' : '#EAF3FF', alignItems: 'center', justifyContent: 'center', gap: 1 }}><Text style={{ color: t.accent, fontSize: 20, lineHeight: 23, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{date.getDate()}</Text><Text style={{ color: t.accent, fontSize: 10, fontWeight: '700' }}>{new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date).toUpperCase()}</Text></View>
        <View style={{ flex: 1, gap: 5, paddingTop: 2 }}><Text numberOfLines={2} style={{ color: t.text, fontSize: 16, lineHeight: 21, fontWeight: '700' }}>{session.title}</Text><Text numberOfLines={1} style={{ color: t.muted, fontSize: 12 }}>{session.exercises[0]?.name ?? 'Workout'}{otherExercises ? ` + ${otherExercises} more` : ''}</Text></View>
        <ArrowUpRight size={18} color={t.muted} />
      </View>
      <View style={{ height: 1, backgroundColor: t.line }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
        <View style={[u.row, { gap: 4 }]}><Clock3 size={13} color={t.muted} /><Text style={{ color: t.muted, fontSize: 11 }}>{formatDuration(durationSeconds(session))}</Text></View>
        <Text style={{ color: t.muted, fontSize: 11 }}>{workingSets(session).length} working sets</Text>
        <Text style={{ color: t.muted, fontSize: 11 }}>{formatNumber(sessionVolume(session), 0)} kg moved</Text>
      </View>
    </Card>
  </Pressable>;
}
