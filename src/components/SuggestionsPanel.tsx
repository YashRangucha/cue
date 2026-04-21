'use client';

import { useRef, useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useSuggestions } from '@/hooks/useSuggestions';
import { Suggestion } from '@/lib/groq';
import ColumnHeader from './ColumnHeader';
import SkeletonCard from './SkeletonCard';
import SuggestionBatch from './SuggestionBatch';

interface Props {
  onError: (msg: string) => void;
  onSuggestionClick: (s: Suggestion) => void;
}

export default function SuggestionsPanel({ onError, onSuggestionClick }: Props) {
  const suggestions = useSessionStore((s) => s.suggestions);
  const interval = useSessionStore((s) => s.settings.refreshInterval);
  const { countdown, isGenerating, manualRefresh } = useSuggestions(onError);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top when a new batch arrives
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [suggestions.length]);

  const progress = Math.max(0, (countdown / interval) * 100);
  const batchCount = suggestions.length;

  return (
    <div className="flex flex-col h-full min-h-0">
      <ColumnHeader
        number="2"
        title="LIVE SUGGESTIONS"
        statusLabel={`${batchCount} BATCH${batchCount !== 1 ? 'ES' : ''}`}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={manualRefresh}
            disabled={isGenerating}
            className="text-xs font-mono text-zinc-500 border border-[#2a2a2a] hover:border-zinc-500 hover:text-zinc-200 rounded px-2.5 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGenerating ? '⟳ Generating...' : '↺ Reload suggestions'}
          </button>
          <span className="text-xs font-mono text-zinc-600">
            auto-refresh in {countdown}s
          </span>
        </div>

        <div className="mt-2 h-[2px] bg-[#2a2a2a] rounded-full overflow-hidden">
          <div
            className="h-full bg-green-700 rounded-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </ColumnHeader>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {isGenerating && batchCount === 0 && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!isGenerating && batchCount === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-600 text-sm font-mono text-center">
              Start recording to generate suggestions
            </p>
          </div>
        )}

        {suggestions.map((batch, i) => (
          <SuggestionBatch
            key={batch.id}
            batch={batch}
            batchNumber={batchCount - i}
            isFirst={i === 0}
            onSuggestionClick={onSuggestionClick}
          />
        ))}
      </div>
    </div>
  );
}
