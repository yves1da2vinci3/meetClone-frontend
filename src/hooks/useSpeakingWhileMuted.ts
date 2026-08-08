import { useEffect, useRef } from "react";
import type { Room } from "livekit-client";
import { notifications } from "@mantine/notifications";

const RMS_THRESHOLD = 0.08;
const ALERT_COOLDOWN_MS = 8000;

export function useSpeakingWhileMuted(room: Room | undefined) {
  const lastAlertRef = useRef(0);

  useEffect(() => {
    if (!room) return;

    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let stream: MediaStream | null = null;
    let raf = 0;
    let monitoring = false;

    const stopMonitor = () => {
      monitoring = false;
      cancelAnimationFrame(raf);
      raf = 0;
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      analyser = null;
      if (ctx) {
        ctx.close().catch(() => {});
        ctx = null;
      }
    };

    const tick = () => {
      if (!analyser || !monitoring) return;
      const data = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      if (rms > RMS_THRESHOLD) {
        const now = Date.now();
        if (now - lastAlertRef.current > ALERT_COOLDOWN_MS) {
          lastAlertRef.current = now;
          notifications.show({
            id: "speaking-muted",
            title: "Micro coupé",
            message: "Votre micro est coupé",
            color: "yellow",
          });
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const startMonitor = async () => {
      if (monitoring) return;
      monitoring = true;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        ctx = new AudioContext();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        raf = requestAnimationFrame(tick);
      } catch {
        monitoring = false;
      }
    };

    const sync = () => {
      const muted = !room.localParticipant.isMicrophoneEnabled;
      if (muted) startMonitor();
      else stopMonitor();
    };

    sync();
    const interval = window.setInterval(sync, 400);

    return () => {
      window.clearInterval(interval);
      stopMonitor();
    };
  }, [room]);
}
