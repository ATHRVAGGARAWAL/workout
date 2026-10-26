import { useState } from 'react';
import { useTraining } from '../data/store';
import type { DataState } from '../data/types';
import { parseBackup } from '../data/validation';
import Storage from '../platform/storage';
import { exportBackup, pickBackup } from '../platform/backup';
import { ConfirmDialog } from './ConfirmDialog';
import { Body, Button, Screen, Title } from './ui';

export function JournalRecovery() {
  const { error, retry, replace } = useTraining();
  const [pending, setPending] = useState<DataState | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<void>) {
    setBusy(true); setNotice('');
    try { await action(); } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'The operation could not be completed.'); }
    finally { setBusy(false); }
  }
  return <Screen>
    <Title>Let’s recover your journal</Title><Body>{error}</Body>
    <Body muted>You can save a copy of the existing file before replacing it with a backup.</Body>
    <Button label="Retry opening journal" disabled={busy} onPress={() => void run(retry)} />
    <Button label="Save existing data file" variant="secondary" disabled={busy} onPress={() => void run(async () => { const raw = await Storage.getItem('workout.data.v1'); if (raw === null) throw new Error('No saved data file was found.'); await exportBackup(raw); setNotice('Existing data file prepared for recovery.'); })} />
    <Button label="Restore journal backup" variant="secondary" disabled={busy} onPress={() => void run(async () => { const text = await pickBackup(); if (text !== null) setPending(parseBackup(text)); })} />
    {!!notice && <Body>{notice}</Body>}
    <ConfirmDialog visible={!!pending} title="Recover from this backup?" message={`This replaces the unreadable journal with ${pending?.sessions.length ?? 0} workouts and ${pending?.measurements.length ?? 0} measurements. Save the existing file first if you want to keep it for recovery.`} confirmLabel="Recover journal" busy={busy} onCancel={() => setPending(null)} onConfirm={() => void run(async () => { if (pending) await replace(pending); })} />
  </Screen>;
}
