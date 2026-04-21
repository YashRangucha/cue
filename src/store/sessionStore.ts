import { create } from 'zustand';
import { DEFAULT_SETTINGS, AppSettings } from '@/lib/prompts';
import { Suggestion } from '@/lib/groq';
import { generateId, formatTimestamp } from '@/lib/formatters';

export interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: string;
}

export interface SuggestionBatch {
  id: string;
  items: Suggestion[];
  timestamp: string;
  transcriptWindowUsed: number;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface SessionState {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  isRecording: boolean;
  setIsRecording: (v: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (v: boolean) => void;
  transcript: TranscriptEntry[];
  addTranscript: (text: string) => void;
  addTranscriptChunk: (text: string) => void;
  suggestions: SuggestionBatch[];
  addSuggestions: (items: Suggestion[], transcriptWindowUsed: number) => void;
  chat: ChatMessage[];
  addChat: (msg: Omit<ChatMessage, 'id'>) => void;
}

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem('cue_settings');
    const base = saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      : { ...DEFAULT_SETTINGS };
    const decommissioned = [
      'meta-llama/llama-4-maverick-17b-128e-instruct',
      'llama-3.3-70b-versatile',
      'llama3-70b-8192',
      'llama3-8b-8192',
      '',
    ];
    if (decommissioned.includes(base.modelId)) {
      base.modelId = 'llama-3.1-8b-instant';
    }
    return base;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const useSessionStore = create<SessionState>((set) => ({
  settings: loadSettings(),

  setSettings: (s: AppSettings) => set({ settings: s }),

  isRecording: false,
  setIsRecording: (v: boolean) => set({ isRecording: v }),

  isSettingsOpen: false,
  setIsSettingsOpen: (v: boolean) => set({ isSettingsOpen: v }),

  transcript: [],
  addTranscript: (text: string) => {
    const now = new Date();
    set((s) => ({
      transcript: [
        ...s.transcript,
        { id: generateId(), text, timestamp: formatTimestamp(now) },
      ],
    }));
  },

  addTranscriptChunk: (text: string) => {
    const now = new Date();
    set((s) => ({
      transcript: [
        ...s.transcript,
        { id: generateId(), text, timestamp: formatTimestamp(now) },
      ],
    }));
  },

  suggestions: [],
  addSuggestions: (items: Suggestion[], transcriptWindowUsed: number) => {
    const now = new Date();
    set((s) => ({
      suggestions: [
        { id: generateId(), items, timestamp: formatTimestamp(now), transcriptWindowUsed },
        ...s.suggestions,
      ],
    }));
  },

  chat: [],
  addChat: (msg: Omit<ChatMessage, 'id'>) => {
    set((s) => ({
      chat: [...s.chat, { ...msg, id: generateId() }],
    }));
  },
}));
