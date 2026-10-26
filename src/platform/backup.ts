import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

const MAX_BYTES = 20_000_000;
export async function exportBackup(text: string): Promise<void> {
  if (!await Sharing.isAvailableAsync()) throw new Error('File sharing is unavailable on this device.');
  const name = `workout-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(text);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save your workout backup', UTI: 'public.json' });
}
export async function pickBackup(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', 'application/octet-stream'], copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.size && asset.size > MAX_BYTES) throw new Error('Choose a workout backup smaller than 20 MB.');
  const file = new File(asset.uri);
  if (file.size > MAX_BYTES) throw new Error('Choose a workout backup smaller than 20 MB.');
  return file.text();
}
