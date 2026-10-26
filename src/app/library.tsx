import { router } from 'expo-router';
import { View } from 'react-native';
import { Screen, Heading } from '../components/ui';
import { ExerciseBrowser } from '../components/ExercisePicker';

export default function LibraryScreen() {
  return <Screen scroll={false} style={{ padding: 0, gap: 0 }}><View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 20 }}><Heading title="Exercise library" subtitle="A movement for every session." back /></View><ExerciseBrowser onSelect={exercise => router.push({ pathname: '/exercise/[id]', params: { id: exercise.id } })} /></Screen>;
}
