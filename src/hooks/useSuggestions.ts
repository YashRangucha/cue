'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { generateSuggestions } from '@/lib/groq';
import { truncateToLastN } from '@/lib/formatters';

const isDev = process.env.NODE_ENV === 'development';

export function useSuggestions(onError: (msg: string) => void) {
  const [countdown, setCountdown] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);

  const countdownRef = useRef(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isGeneratingRef = useRef(false);

  const generate = useCallback(async (showErrors = true) => {
    if (isGeneratingRef.current) return;

    const state = useSessionStore.getState();
    const { settings, transcript, suggestions } = state;

    if (!settings.apiKey) {
      state.setIsSettingsOpen(true);
      if (showErrors) onError('Enter your Groq API key in Settings.');
      return;
    }

    if (transcript.length === 0) {
      if (showErrors) onError('Start recording to generate suggestions.');
      return;
    }

    isGeneratingRef.current = true;
    setIsGenerating(true);

    try {
      const fullText = transcript.map((e) => e.text).join('\n');
      const prevTitles = suggestions.flatMap((b) => b.items.map((s) => s.title));

      // Split into earlier context + recent focus so the model weights new content
      const RECENT_CHARS = 800;
      const recentPortion = truncateToLastN(fullText, RECENT_CHARS);
      const earlierPortion = fullText.length > RECENT_CHARS
        ? truncateToLastN(
            fullText.slice(0, fullText.length - RECENT_CHARS),
            settings.suggestionContextWindow - RECENT_CHARS
          )
        : '';
      const recent = earlierPortion
        ? `[EARLIER — background context]\n${earlierPortion}\n\n[RECENT — base suggestions on this]\n${recentPortion}`
        : recentPortion;

      if (isDev) {
        console.log('[Cue] Transcript window:', recent.length, 'chars');
        console.log('[Cue] Prompt sent:', settings.suggestionPrompt.slice(0, 200) + '...');
      }

      const items = await generateSuggestions(
        settings.suggestionPrompt,
        recent,
        prevTitles.slice(0, 30),
        settings.apiKey,
        settings.modelId
      );

      // Skip batch only if every title is an exact duplicate
      const seenTitles = new Set(prevTitles.map((t) => t.toLowerCase().trim()));
      const allDuplicates = items.every((item) => seenTitles.has(item.title.toLowerCase().trim()));

      if (items.length > 0 && !allDuplicates) {
        state.addSuggestions(items, recent.length);
      }
    } catch (err: unknown) {
      if (isDev) console.error('[Cue] Suggestion error:', err);
      const e = err as { status?: number };
      if (e?.status === 401) {
        onError('Invalid API key.');
        state.setIsSettingsOpen(true);
      } else if (e?.status === 429) {
        if (showErrors) onError('Rate limited. Retrying...');
        setTimeout(() => generate(false), 5000);
      } else {
        if (showErrors) onError('Failed to generate suggestions.');
      }
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  }, [onError]);

  const resetCountdown = useCallback(() => {
    const interval = useSessionStore.getState().settings.refreshInterval;
    countdownRef.current = interval;
    setCountdown(interval);
  }, []);

  const manualRefresh = useCallback(async () => {
    resetCountdown();
    await generate(true);
  }, [generate, resetCountdown]);

  useEffect(() => {
    const interval = useSessionStore.getState().settings.refreshInterval;
    countdownRef.current = interval;
    setCountdown(interval);

    timerRef.current = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);

      if (countdownRef.current <= 0) {
        const next = useSessionStore.getState().settings.refreshInterval;
        countdownRef.current = next;
        setCountdown(next);
        generate(false);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [generate]);

  return { countdown, isGenerating, manualRefresh };
}
