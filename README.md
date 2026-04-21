# Cue — AI Meeting Copilot

A real-time meeting assistant that transcribes speech, generates contextual suggestions, and answers questions via streaming chat — built for the TwinMind engineering assignment.

## Features

- **Live transcription** — Captures microphone audio in 30-second batches and transcribes via Groq Whisper (`whisper-large-v3`)
- **Smart suggestions** — Generates 3 suggestions every 30s (Answer / Fact-Check / Question / Talking Point / Clarify) weighted toward the most recent speech
- **Streaming chat** — Click any suggestion or type freely; answers stream token-by-token with a blinking cursor
- **Settings modal** — Edit API key, model, refresh interval, context window, and all three prompts live
- **Session export** — Download the full session as JSON (transcript + suggestions with transcript window audit + chat history)

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| AI | Groq API — Whisper + Llama 3.1 8B |
| Audio | MediaRecorder + Web Audio API |

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/yrangucha/cue.git
cd cue
npm install
```

### 2. Add your Groq API key

Copy the example env file and add your key:

```bash
cp .env.example .env.local
```

Or paste your key directly in the Settings modal on first launch — it's stored in `localStorage`.

Get a free key at [console.groq.com](https://console.groq.com).

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. **Start recording** — Click the mic button (Column 1). The browser will ask for microphone permission.
2. **Watch suggestions appear** — Column 2 refreshes every 30 seconds with contextual suggestions.
3. **Click a suggestion** — It opens a detailed answer in the chat panel (Column 3).
4. **Type freely** — Ask follow-up questions or anything unrelated to the suggestions.
5. **Export** — Click **Export** in the top bar to download the session JSON.
6. **Settings** — Click **Settings** to change the API key, model, or prompts.

## Architecture

```
src/
  app/           # Next.js App Router — layout, page, globals
  components/    # TranscriptPanel, SuggestionsPanel, ChatPanel, SettingsModal, …
  hooks/         # useAudioCapture, useSuggestions, useChat
  lib/           # groq.ts (API calls), prompts.ts (defaults), formatters.ts
  store/         # sessionStore.ts (Zustand)
```

### Key design decisions

- **MediaRecorder stop+restart** — Each 30s batch stops and restarts the recorder so every audio blob includes the container initialization header, making it a valid standalone file for Whisper.
- **`[EARLIER]/[RECENT]` transcript split** — The last 800 chars of transcript are labelled `[RECENT]` in the suggestion prompt so the model weights new content more heavily while still having full context.
- **JSON parse retry** — If the model returns malformed JSON, the suggestion generator retries once with a strict suffix instructing plain JSON output.
- **Dedup by batch** — A suggestion batch is skipped only if every title is an exact duplicate of a previous one; partial overlaps are kept.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | Display name (default: `Cue`) |

The Groq API key is stored client-side in `localStorage` (key: `cue_settings`) and never sent to any server other than `api.groq.com`.

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

## License

MIT
