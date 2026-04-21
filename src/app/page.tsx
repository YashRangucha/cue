'use client';

import { useState, useCallback, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import TranscriptPanel from '@/components/TranscriptPanel';
import SuggestionsPanel from '@/components/SuggestionsPanel';
import ChatPanel from '@/components/ChatPanel';
import SettingsModal from '@/components/SettingsModal';
import { useSessionStore } from '@/store/sessionStore';
import { downloadJSON } from '@/lib/export';
import { Suggestion } from '@/lib/groq';

export default function Home() {
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'error' | 'warning' | 'info'>('error');

  // Migrate stale/decommissioned model IDs out of localStorage on first load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cue_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const blockedModels = [
          'meta-llama/llama-4-maverick-17b-128e-instruct',
          'llama-3.3-70b-versatile',
          'llama3-70b-8192',
          'llama3-8b-8192',
        ];
        if (blockedModels.includes(parsed.modelId)) {
          parsed.modelId = 'llama-3.1-8b-instant';
          localStorage.setItem('cue_settings', JSON.stringify(parsed));
          useSessionStore.getState().setSettings(parsed);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Auto-open settings if no API key
  useEffect(() => {
    if (!useSessionStore.getState().settings.apiKey) {
      useSessionStore.getState().setIsSettingsOpen(true);
    }
  }, []);

  const [pendingSuggestion, setPendingSuggestion] = useState<Suggestion | null>(null);
  const clearPending = useCallback(() => setPendingSuggestion(null), []);

  const showToast = useCallback((msg: string, type: 'error' | 'warning' | 'info' = 'error') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const showError = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);

  const handleExport = useCallback(() => {
    const state = useSessionStore.getState();
    if (!state.transcript.length && !state.suggestions.length && !state.chat.length) {
      showToast('Nothing to export yet', 'warning');
      return;
    }
    const date = new Date().toISOString().split('T')[0];
    downloadJSON(
      {
        exportedAt: new Date().toISOString(),
        transcript: state.transcript,
        suggestionBatches: state.suggestions,
        chat: state.chat,
      },
      `cue-session-${date}.json`
    );
  }, [showToast]);

  const toastColors: Record<string, { bg: string; border: string }> = {
    error:   { bg: '#7f1d1d', border: '#991b1b' },
    warning: { bg: '#78350f', border: '#92400e' },
    info:    { bg: '#1e3a5f', border: '#1d4ed8' },
  };
  const tc = toastColors[toastType];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#0d0d0d',
      overflow: 'hidden',
    }}>
      <AppHeader
        onExport={handleExport}
        onSettingsOpen={() => useSessionStore.getState().setIsSettingsOpen(true)}
      />

      <SettingsModal />

      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        marginTop: '44px',
      }}>
        {/* Col 1 — 28% */}
        <div style={{ width: '28%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TranscriptPanel onError={showError} />
        </div>

        {/* Col 2 — 36% */}
        <div style={{ width: '36%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid #2a2a2a' }}>
          <SuggestionsPanel onError={showError} onSuggestionClick={setPendingSuggestion} />
        </div>

        {/* Col 3 — 36% */}
        <div style={{ width: '36%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid #2a2a2a' }}>
          <ChatPanel
            pendingSuggestion={pendingSuggestion}
            onSuggestionConsumed={clearPending}
            onError={showError}
          />
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 200,
          backgroundColor: tc.bg,
          border: `1px solid ${tc.border}`,
          color: 'white',
          fontSize: '12px',
          fontFamily: 'monospace',
          padding: '10px 16px',
          borderRadius: '8px',
          maxWidth: '320px',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
