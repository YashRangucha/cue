'use client';

import { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { DEFAULT_SETTINGS, AppSettings } from '@/lib/prompts';

export default function SettingsModal() {
  const isOpen = useSessionStore((s) => s.isSettingsOpen);
  const setIsSettingsOpen = useSessionStore((s) => s.setIsSettingsOpen);
  const storeSettings = useSessionStore((s) => s.settings);
  const setSettings = useSessionStore((s) => s.setSettings);

  const [form, setForm] = useState<AppSettings>(storeSettings);
  const [saved, setSaved] = useState(false);

  // Sync form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(storeSettings);
      setSaved(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  function handleSave() {
    const next = { ...form };
    setSettings(next);
    try {
      localStorage.setItem('cue_settings', JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
    setSaved(true);
    setTimeout(() => {
      setIsSettingsOpen(false);
      setSaved(false);
    }, 800);
  }

  function handleReset() {
    setForm((prev) => ({
      ...prev,
      suggestionPrompt: DEFAULT_SETTINGS.suggestionPrompt,
      detailPrompt: DEFAULT_SETTINGS.detailPrompt,
      chatPrompt: DEFAULT_SETTINGS.chatPrompt,
      suggestionContextWindow: DEFAULT_SETTINGS.suggestionContextWindow,
      chatContextWindow: DEFAULT_SETTINGS.chatContextWindow,
      refreshInterval: DEFAULT_SETTINGS.refreshInterval,
    }));
  }

  const field = (label: string, node: React.ReactNode, warning?: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '11px', fontFamily: 'monospace', color: '#71717a', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {warning && (
        <div style={{ fontSize: '11px', color: '#fbbf24', fontFamily: 'monospace', marginBottom: '2px' }}>
          ⚠ {warning}
        </div>
      )}
      {node}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#e4e4e7',
    fontSize: '13px',
    fontFamily: 'monospace',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical',
    minHeight: '120px',
    lineHeight: 1.5,
    fontFamily: 'monospace',
    fontSize: '12px',
  };

  const numberInputStyle: React.CSSProperties = {
    ...inputStyle,
    width: '120px',
  };

  return (
    <div
      onClick={() => setIsSettingsOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        padding: '52px 16px 16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#111',
          border: '1px solid #2a2a2a',
          borderRadius: '12px',
          width: '520px',
          maxHeight: 'calc(100vh - 80px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #1f1f1f',
          position: 'sticky',
          top: 0,
          backgroundColor: '#111',
          zIndex: 1,
        }}>
          <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#e4e4e7', fontWeight: 500 }}>
            Settings
          </span>
          <button
            onClick={() => setIsSettingsOpen(false)}
            style={{ color: '#52525b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px 6px' }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* API Key */}
          {field(
            'Groq API Key',
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="gsk_..."
              style={inputStyle}
            />,
            !form.apiKey ? 'API key required to use Cue' : undefined
          )}

          {/* Model */}
          {field(
            'Model',
            <input
              type="text"
              value={form.modelId}
              onChange={(e) => setForm({ ...form, modelId: e.target.value })}
              style={inputStyle}
            />
          )}

          {/* Refresh Interval */}
          {field(
            'Suggestion Refresh Interval (seconds)',
            <input
              type="number"
              min={10}
              max={120}
              value={form.refreshInterval}
              onChange={(e) => setForm({ ...form, refreshInterval: Number(e.target.value) })}
              style={numberInputStyle}
            />
          )}

          {/* Context windows */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {field(
              'Suggestion Context (chars)',
              <input
                type="number"
                min={500}
                max={16000}
                step={500}
                value={form.suggestionContextWindow}
                onChange={(e) => setForm({ ...form, suggestionContextWindow: Number(e.target.value) })}
                style={numberInputStyle}
              />
            )}
            {field(
              'Chat Context (chars)',
              <input
                type="number"
                min={1000}
                max={32000}
                step={1000}
                value={form.chatContextWindow}
                onChange={(e) => setForm({ ...form, chatContextWindow: Number(e.target.value) })}
                style={numberInputStyle}
              />
            )}
          </div>

          <div style={{ borderTop: '1px solid #1f1f1f', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#71717a', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Prompts
              </span>
              <button
                onClick={handleReset}
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#71717a',
                  background: 'none',
                  border: '1px solid #2a2a2a',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  cursor: 'pointer',
                }}
              >
                Reset defaults
              </button>
            </div>

            {field('Suggestion Prompt',
              <textarea
                value={form.suggestionPrompt}
                onChange={(e) => setForm({ ...form, suggestionPrompt: e.target.value })}
                style={textareaStyle}
              />
            )}
            {field('Detail Answer Prompt',
              <textarea
                value={form.detailPrompt}
                onChange={(e) => setForm({ ...form, detailPrompt: e.target.value })}
                style={{ ...textareaStyle, minHeight: '160px' }}
              />
            )}
            {field('Chat System Prompt',
              <textarea
                value={form.chatPrompt}
                onChange={(e) => setForm({ ...form, chatPrompt: e.target.value })}
                style={textareaStyle}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #1f1f1f',
          display: 'flex',
          justifyContent: 'flex-end',
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#111',
        }}>
          <button
            onClick={handleSave}
            disabled={saved}
            style={{
              backgroundColor: saved ? '#14532d' : '#1d4ed8',
              color: saved ? '#86efac' : 'white',
              fontSize: '13px',
              fontFamily: 'monospace',
              fontWeight: 500,
              padding: '8px 20px',
              borderRadius: '6px',
              border: 'none',
              cursor: saved ? 'default' : 'pointer',
              transition: 'background-color 0.2s, color 0.2s',
              minWidth: '80px',
            }}
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
