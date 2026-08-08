import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import DeviceSettingsModal from "./DeviceSettingsModal";
import { useSpeakingWhileMuted } from "../hooks/useSpeakingWhileMuted";

interface RoomMediaBridgeProps {
  forceMuteToken: number;
  settingsOpened: boolean;
  onCloseSettings: () => void;
  blurEnabled: boolean;
  onBlurChange: (v: boolean) => void;
  initialAudio?: boolean;
  initialVideo?: boolean;
  initialDevices?: {
    audioInputId?: string;
    videoInputId?: string;
    audioOutputId?: string;
  };
  onToggleHand?: () => void;
  onLeave?: () => void;
}

/** Lives inside LiveKitRoom — applies mute/device/settings side effects */
function RoomMediaBridge({
  forceMuteToken,
  settingsOpened,
  onCloseSettings,
  blurEnabled,
  onBlurChange,
  initialAudio,
  initialVideo,
  initialDevices,
  onToggleHand,
  onLeave,
}: RoomMediaBridgeProps) {
  const room = useRoomContext();
  useSpeakingWhileMuted(room);

  useEffect(() => {
    if (!room) return;
    if (forceMuteToken === 0) return;
    room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
  }, [forceMuteToken, room]);

  useEffect(() => {
    if (!room) return;
    let cancelled = false;
    (async () => {
      try {
        if (initialAudio === false) {
          await room.localParticipant.setMicrophoneEnabled(false);
        }
        if (initialVideo === false) {
          await room.localParticipant.setCameraEnabled(false);
        }
        if (initialDevices?.audioInputId) {
          await room.switchActiveDevice(
            "audioinput",
            initialDevices.audioInputId
          );
        }
        if (initialDevices?.videoInputId) {
          await room.switchActiveDevice(
            "videoinput",
            initialDevices.videoInputId
          );
        }
        if (initialDevices?.audioOutputId) {
          await room.switchActiveDevice(
            "audiooutput",
            initialDevices.audioOutputId
          );
        }
      } catch (e) {
        if (!cancelled) console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  useEffect(() => {
    if (!room) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el?.isContentEditable
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "m") {
        e.preventDefault();
        room.localParticipant
          .setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled)
          .catch(() => {});
      } else if (k === "v") {
        e.preventDefault();
        room.localParticipant
          .setCameraEnabled(!room.localParticipant.isCameraEnabled)
          .catch(() => {});
      } else if (k === "h") {
        e.preventDefault();
        onToggleHand?.();
      } else if (k === "f") {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
          return;
        }
        if (window.confirm("Quitter la réunion ?")) onLeave?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [room, onToggleHand, onLeave]);

  return (
    <DeviceSettingsModal
      opened={settingsOpened}
      onClose={onCloseSettings}
      blurEnabled={blurEnabled}
      onBlurChange={onBlurChange}
    />
  );
}

export default RoomMediaBridge;
