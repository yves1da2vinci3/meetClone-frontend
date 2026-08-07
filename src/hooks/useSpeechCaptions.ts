import { useEffect, useRef } from "react";

type RecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
  onend: (() => void) | null;
};

interface UseSpeechCaptionsOpts {
  enabled: boolean;
  onChunk: (text: string) => void;
}

export function useSpeechCaptions({ enabled, onChunk }: UseSpeechCaptionsOpts) {
  const recognitionRef = useRef<RecognitionType | null>(null);
  const onChunkRef = useRef(onChunk);
  onChunkRef.current = onChunk;

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (!enabled) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      return;
    }

    const recognition: RecognitionType = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "fr-FR";
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result?.[0]?.transcript?.trim();
      if (text) onChunkRef.current(text);
    };
    recognition.onerror = () => {};
    recognition.onend = () => {
      if (enabled) {
        try {
          recognition.start();
        } catch {
          /* ignore */
        }
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      /* ignore */
    }

    return () => {
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, [enabled]);
}
