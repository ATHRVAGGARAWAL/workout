import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../ThemeProvider';
import { Body, Button, Title } from './ui';

export function ConfirmDialog({ visible, title, message, confirmLabel = 'Delete', onCancel, onConfirm, busy = false }: {
  visible: boolean; title: string; message: string; confirmLabel?: string; onCancel: () => void; onConfirm: () => void; busy?: boolean;
}) {
  const { theme: t } = useAppTheme();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!busy) onCancel(); }}>
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#000000B3' }}>
      <Pressable accessible={false} onPress={() => { if (!busy) onCancel(); }} style={{ position: 'absolute', inset: 0 }} />
      <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 420, alignSelf: 'center', borderRadius: 22, padding: 22, gap: 18, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }}>
        <Title>{title}</Title><Body muted>{message}</Body>
        <Button label={busy ? 'Please wait…' : confirmLabel} variant="danger" disabled={busy} onPress={onConfirm} />
        <Button label="Cancel" variant="secondary" disabled={busy} onPress={onCancel} />
      </View>
    </SafeAreaView>
  </Modal>;
}
