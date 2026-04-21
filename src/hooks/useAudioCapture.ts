'use client';

import { useRef, useCallback } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { transcribeAudio } from '@/lib/groq';

const SLICE_MS = 5000;
const BATCH_MS = 30000;
const MIN_BLOB_SIZE = 500;

export function useAudioCapture(onError: (msg: string) => void) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const blobsRef = useRef<Blob[]>([]);
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');
  const isStoppingRef = useRef(false);

  const detectMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const getExtension = (mime: string): string => {
    if (mime.includes('ogg')) return 'ogg';
    if (mime.includes('mp4')) return 'm4a'; // Whisper accepts m4a, rejects raw mp4
    return 'webm';
  };

  const flush = useCallback(async () => {
    const apiKey = useSessionStore.getState().settings.apiKey;
    if (!apiKey || blobsRef.current.length === 0) return;

    const blobs = [...blobsRef.current];
    blobsRef.current = [];

    const mime = mimeTypeRef.current;
    const ext = getExtension(mime);
    const blobMime = mime.split(';')[0];
    const combined = new Blob(blobs, { type: blobMime });

    if (combined.size < MIN_BLOB_SIZE) return;

    try {
      const text = await transcribeAudio(combined, apiKey, ext);
      if (text?.trim()) {
        useSessionStore.getState().addTranscriptChunk(text.trim());
      }
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 401) {
        onError('Invalid API key. Check your settings.');
      } else if (e?.status === 429) {
        onError('Rate limited by Groq. Will retry next cycle.');
      } else if (e?.status === 400) {
        onError('Audio format error. Try refreshing the page.');
      } else {
        onError('Transcription failed: ' + (e?.message ?? 'Unknown error'));
      }
    }
  }, [onError]);

  const attachHandlers = (recorder: MediaRecorder) => {
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        blobsRef.current.push(e.data);
      }
    };
    recorder.onerror = () => {
      onError('Recording error. Please restart.');
    };
  };

  const stopRecorderInstance = async () => {
    const rec = recorderRef.current;
    if (!rec || rec.state === 'inactive') return;
    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      rec.stop();
    });
    recorderRef.current = null;
  };

  const startRecording = useCallback(async () => {
    const apiKey = useSessionStore.getState().settings.apiKey;
    if (!apiKey) {
      useSessionStore.getState().setIsSettingsOpen(true);
      onError('Please enter your Groq API key in Settings first.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      isStoppingRef.current = false;

      const ctx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mime = detectMimeType();
      mimeTypeRef.current = mime;

      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      recorderRef.current = recorder;
      blobsRef.current = [];
      attachHandlers(recorder);
      recorder.start(SLICE_MS);

      useSessionStore.getState().setIsRecording(true);

      const scheduleBatch = () => {
        batchTimerRef.current = setTimeout(async () => {
          if (isStoppingRef.current || !streamRef.current) return;

          await stopRecorderInstance();
          await flush();

          if (isStoppingRef.current || !streamRef.current) return;

          const nextRecorder = new MediaRecorder(
            streamRef.current,
            mime ? { mimeType: mime } : {}
          );
          recorderRef.current = nextRecorder;
          blobsRef.current = [];
          attachHandlers(nextRecorder);
          nextRecorder.start(SLICE_MS);
          scheduleBatch();
        }, BATCH_MS);
      };

      scheduleBatch();
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
        onError('Microphone access denied. Click the lock icon in your browser address bar to allow it.');
      } else if (e?.name === 'NotFoundError') {
        onError('No microphone found. Please connect a microphone.');
      } else {
        onError('Could not access microphone: ' + (e?.message ?? 'Unknown error'));
      }
    }
  }, [flush, onError]);

  const stopRecording = useCallback(async () => {
    isStoppingRef.current = true;

    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }

    await stopRecorderInstance();

    if (audioCtxRef.current) {
      await audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    useSessionStore.getState().setIsRecording(false);

    await flush();
  }, [flush]);

  return { startRecording, stopRecording, analyserRef };
}
