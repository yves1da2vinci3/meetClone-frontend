import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import DeviceSettingsModal from "./DeviceSettingsModal";

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
}: RoomMediaBridgeProps) {
  const room = useRoomContext();

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
    // only on mount / room ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  // silence unused Track import warning by referencing Source once
  void Track.Source.Microphone;

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
