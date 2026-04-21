'use client';

import { SuggestionBatch as BatchData } from '@/store/sessionStore';
import { Suggestion } from '@/lib/groq';
import SuggestionCard from './SuggestionCard';

interface Props {
  batch: BatchData;
  batchNumber: number;
  isFirst: boolean;
  onSuggestionClick: (s: Suggestion) => void;
}

export default function SuggestionBatch({ batch, batchNumber, isFirst, onSuggestionClick }: Props) {
  return (
    <div className="mb-2">
      {!isFirst && (
        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-[#2a2a2a]" />
          <span className="text-[10px] font-mono text-zinc-600 shrink-0">
            — BATCH {batchNumber} · {batch.timestamp} —
          </span>
          <div className="flex-1 h-px bg-[#2a2a2a]" />
        </div>
      )}
      <div className="flex flex-col gap-3">
        {batch.items.map((suggestion, i) => (
          <SuggestionCard
            key={`${batch.id}-${i}`}
            suggestion={suggestion}
            onClick={onSuggestionClick}
            animationDelay={i * 75}
          />
        ))}
      </div>
    </div>
  );
}
