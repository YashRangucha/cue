'use client';

import { useEffect, useRef } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useAudioCapture } from '@/hooks/useAudioCapture';
import ColumnHeader from '@/components/ColumnHeader';
import WaveformVisualizer from '@/components/WaveformVisualizer';

interface Props {
  onError: (msg: string) => void;
}

export default function TranscriptPanel({ onError }: Props) {
  const isRecording = useSessionStore((s) => s.isRecording);
  const transcriptChunks = useSessionStore((s) => s.transcript);
  const { startRecording, stopRecording, analyserRef } = useAudioCapture(onError);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptChunks.length]);

  const handleMicClick = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid #2a2a2a' }}>

      <ColumnHeader
        number="1"
        title="MIC & TRANSCRIPT"
        statusLabel={isRecording ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#ef4444', fontSize: '10px', fontFamily: 'monospace' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', animation: 'ping 1.5s ease-in-out infinite' }} />
            LIVE
          </span>
        ) : 'IDLE'}
      />

      {/* Mic area */}
      <div style={{ padding: '16px', borderBottom: '1px solid #2a2a2a', backgroundColor: '#111111' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

          {/* Mic button with ping ring */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isRecording && (
              <span style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: '#60a5fa',
                opacity: 0.2,
                animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite',
              }} />
            )}
            <button
              onClick={handleMicClick}
              style={{
                position: 'relative',
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                border: isRecording ? '2px solid #60a5fa' : '2px solid #52525b',
                backgroundColor: isRecording ? '#2563eb' : '#27272a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="11" rx="3"
                  fill={isRecording ? 'white' : '#a1a1aa'} />
                <path d="M5 10a7 7 0 0 0 14 0"
                  stroke={isRecording ? 'white' : '#a1a1aa'}
                  strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="17" x2="12" y2="21"
                  stroke={isRecording ? 'white' : '#a1a1aa'}
                  strokeWidth="2" strokeLinecap="round" />
                <line x1="9" y1="21" x2="15" y2="21"
                  stroke={isRecording ? 'white' : '#a1a1aa'}
                  strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Status + waveform */}
          <div>
            <p style={{ fontSize: '11px', fontFamily: 'monospace', color: '#71717a' }}>
              {isRecording
                ? 'Recording... transcribes every 30s'
                : 'Click to start recording'}
            </p>
            <WaveformVisualizer
              analyserNode={analyserRef.current}
              isActive={isRecording}
            />
          </div>
        </div>
      </div>

      {/* Transcript scroll area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {transcriptChunks.length === 0 ? (
          <div style={{
            border: '1px dashed #2a2a2a',
            borderRadius: '8px',
            padding: '16px',
            color: '#52525b',
            fontSize: '12px',
            fontFamily: 'monospace',
            lineHeight: '1.6',
          }}>
            <p>Transcript will appear here as you speak.</p>
            <p style={{ marginTop: '4px' }}>Chunks append every ~30 seconds.</p>
          </div>
        ) : (
          transcriptChunks.map((chunk) => (
            <div key={chunk.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{
                color: '#52525b',
                fontFamily: 'monospace',
                fontSize: '11px',
                flexShrink: 0,
                paddingTop: '2px',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {chunk.timestamp}
              </span>
              <p style={{ color: '#d4d4d8', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                {chunk.text}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
