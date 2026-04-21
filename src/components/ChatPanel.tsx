'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import ColumnHeader from './ColumnHeader';
import { useChat } from '@/hooks/useChat';
import type { Suggestion } from '@/lib/groq';

interface Props {
  pendingSuggestion?: Suggestion | null;
  onSuggestionConsumed: () => void;
  onError: (msg: string) => void;
}

export default function ChatPanel({ pendingSuggestion, onSuggestionConsumed, onError }: Props) {
  const chat = useSessionStore((s) => s.chat);
  const msgCount = chat.length;
  const { sendMessage, isStreaming, streamingContent } = useChat(onError);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  const scrollToBottom = useCallback((force = false) => {
    const el = scrollRef.current;
    if (!el) return;
    if (force || atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  // Keep stable refs to avoid stale closures in the effect below
  const sendMessageRef = useRef(sendMessage);
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);
  const onConsumedRef = useRef(onSuggestionConsumed);
  useEffect(() => { onConsumedRef.current = onSuggestionConsumed; }, [onSuggestionConsumed]);

  useEffect(() => {
    if (!pendingSuggestion) return;
    atBottomRef.current = true;
    sendMessageRef.current(pendingSuggestion.title, pendingSuggestion);
    onConsumedRef.current();
    // Force scroll after DOM updates with the new user message
    requestAnimationFrame(() => scrollToBottom(true));
  }, [pendingSuggestion, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [chat, streamingContent, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    sendMessage(text);
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const isEmpty = chat.length === 0 && !isStreaming;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <ColumnHeader
        number="3"
        title="CHAT (DETAILED ANSWERS)"
        statusLabel={msgCount > 0 ? `${msgCount} MESSAGE${msgCount !== 1 ? 'S' : ''}` : 'SESSION-ONLY'}
      />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {isEmpty ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{
              color: '#3f3f46',
              fontSize: '12px',
              fontFamily: 'monospace',
              textAlign: 'center',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
            }}>
              {'Click a suggestion or type a question\nto start the conversation'}
            </p>
          </div>
        ) : (
          <>
            {chat.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  backgroundColor: msg.role === 'user' ? '#1d4ed8' : '#1a1a1a',
                  border: msg.role === 'assistant' ? '1px solid #2a2a2a' : 'none',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  padding: '10px 14px',
                  color: '#e4e4e7',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isStreaming && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '12px 12px 12px 2px',
                  padding: '10px 14px',
                  color: '#e4e4e7',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {streamingContent}
                  <span
                    className="animate-blink"
                    style={{
                      display: 'inline-block',
                      width: '2px',
                      height: '14px',
                      backgroundColor: '#60a5fa',
                      marginLeft: '2px',
                      verticalAlign: 'text-bottom',
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{
        borderTop: '1px solid #2a2a2a',
        padding: '12px 16px',
        backgroundColor: '#0d0d0d',
        display: 'flex',
        gap: '8px',
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder="Ask anything..."
          style={{
            flex: 1,
            backgroundColor: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            padding: '10px 16px',
            color: '#e4e4e7',
            fontSize: '13px',
            fontFamily: 'inherit',
            outline: 'none',
            opacity: isStreaming ? 0.6 : 1,
            cursor: isStreaming ? 'not-allowed' : 'text',
            transition: 'opacity 0.15s, border-color 0.15s',
          }}
        />
        <button
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          style={{
            backgroundColor: isStreaming || !input.trim() ? '#1e3a8a' : '#1d4ed8',
            color: isStreaming || !input.trim() ? '#93c5fd80' : 'white',
            fontSize: '13px',
            fontWeight: 500,
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s, color 0.15s',
            minWidth: '60px',
          }}
        >
          {isStreaming ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
