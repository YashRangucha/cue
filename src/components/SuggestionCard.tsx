'use client';

import { Suggestion } from '@/lib/groq';

const TYPE_META: Record<Suggestion['type'], { bg: string; text: string; label: string }> = {
  QUESTION:      { bg: '#0e2a1e', text: '#4ade80', label: 'QUESTION TO ASK' },
  TALKING_POINT: { bg: '#1c1a08', text: '#facc15', label: 'TALKING POINT' },
  ANSWER:        { bg: '#0a1a2e', text: '#60a5fa', label: 'ANSWER' },
  FACT_CHECK:    { bg: '#1a0a0a', text: '#f87171', label: 'FACT-CHECK' },
  CLARIFY:       { bg: '#1a0a1a', text: '#c084fc', label: 'CLARIFY' },
};

interface Props {
  suggestion: Suggestion;
  onClick: (s: Suggestion) => void;
  animationDelay?: number;
}

export default function SuggestionCard({ suggestion, onClick, animationDelay = 0 }: Props) {
  const meta = TYPE_META[suggestion.type] ?? TYPE_META.QUESTION;

  return (
    <button
      onClick={() => onClick(suggestion)}
      className="w-full text-left bg-[#1a1a1a] border border-[#2a2a2a] hover:border-zinc-500 rounded-lg p-4 transition-all cursor-pointer animate-slide-in"
      style={{ animationDelay: `${animationDelay}ms`, opacity: 0 }}
    >
      <div
        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium mb-2"
        style={{ backgroundColor: meta.bg, color: meta.text }}
      >
        {meta.label}
      </div>
      <p className="text-zinc-200 text-sm font-medium leading-snug mb-1">
        {suggestion.title}
      </p>
      <p className="text-zinc-500 text-xs leading-relaxed">
        {suggestion.subtitle}
      </p>
    </button>
  );
}
