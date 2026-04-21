'use client';

import { useCallback, useState, useRef } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { streamChatResponse } from '@/lib/groq';
import { fillTemplate } from '@/lib/prompts';
import type { Suggestion } from '@/lib/groq';

const isDev = process.env.NODE_ENV === 'development';

export function useChat(onError: (msg: string) => void) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const isStreamingRef = useRef(false);
  const bufferRef = useRef('');

  const sendMessage = useCallback(async (
    userText: string,
    suggestion?: Suggestion,
  ) => {
    if (isStreamingRef.current) return;

    const state = useSessionStore.getState();
    const { settings } = state;

    if (!settings.apiKey) {
      state.setIsSettingsOpen(true);
      onError('Enter your Groq API key in Settings.');
      return;
    }

    if (!userText.trim()) return;

    state.addChat({ role: 'user', content: suggestion ? suggestion.title : userText });

    const transcriptText = state.transcript.map((e) => e.text).join('\n');

    const systemPrompt = fillTemplate(settings.chatPrompt, {
      transcript: transcriptText || 'No transcript yet.',
    });

    // Suggestion click → fill detailPrompt (includes per-type instructions + suggestionType)
    // Free typing → use userText directly as the user turn
    const finalUserContent = suggestion
      ? fillTemplate(settings.detailPrompt, {
          transcript: transcriptText || 'No transcript yet.',
          suggestionType: suggestion.type,
          suggestionTitle: suggestion.title,
          suggestionSubtitle: suggestion.subtitle ?? '',
        })
      : userText;

    const history = useSessionStore.getState().chat;
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: finalUserContent },
    ];

    if (isDev) {
      console.log('[Chat] Using model:', settings.modelId);
      console.log('[Chat] Transcript chars:', transcriptText.length);
    }

    isStreamingRef.current = true;
    setIsStreaming(true);
    bufferRef.current = '';
    setStreamingContent('');

    await streamChatResponse(
      messages,
      settings.apiKey,
      settings.modelId,
      (token) => {
        const clean = token
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/#/g, '')
          .replace(/`/g, '')
          .replace(/^\d+\.\s?/gm, '');
        bufferRef.current += clean;
        setStreamingContent(bufferRef.current);
      },
      () => {
        useSessionStore.getState().addChat({
          role: 'assistant',
          content: bufferRef.current.trim() || 'No response received.',
        });
        isStreamingRef.current = false;
        setIsStreaming(false);
        setStreamingContent('');
        bufferRef.current = '';
      },
      (err) => {
        useSessionStore.getState().addChat({
          role: 'assistant',
          content: bufferRef.current.trim() || 'Sorry — I could not generate a response.',
        });
        isStreamingRef.current = false;
        setIsStreaming(false);
        setStreamingContent('');
        bufferRef.current = '';

        const e = err as { status?: number };
        if (e?.status === 401) {
          onError('Invalid API key.');
          useSessionStore.getState().setIsSettingsOpen(true);
        } else if (e?.status === 429) {
          onError('Rate limited. Try again shortly.');
        } else {
          onError('Chat error: ' + err.message);
        }
      },
      0.2,
    );
  }, [onError]);

  return { sendMessage, isStreaming, streamingContent };
}
