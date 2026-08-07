import { Button, Modal, Select, Stack, Switch } from "@mantine/core";
import { useEffect, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { BackgroundBlur } from "@livekit/track-processors";
import { Track } from "livekit-client";

interface DeviceSettingsModalProps {
  opened: boolean;
  onClose: () => void;
  blurEnabled: boolean;
  onBlurChange: (enabled: boolean) => void;
}

function DeviceSettingsModal({
  opened,
  onClose,
  blurEnabled,
  onBlurChange,
}: DeviceSettingsModalProps) {
  const room = useRoomContext();
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [audioInputId, setAudioInputId] = useState("");
  const [videoInputId, setVideoInputId] = useState("");
  const [audioOutputId, setAudioOutputId] = useState("");
  const [busyBlur, setBusyBlur] = useState(false);

  useEffect(() => {
    if (!opened) return;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const mics = devices.filter((d) => d.kind === "audioinput");
      const cams = devices.filter((d) => d.kind === "videoinput");
      const outs = devices.filter((d) => d.kind === "audiooutput");
      setAudioInputs(mics);
      setVideoInputs(cams);
      setAudioOutputs(outs);
      setAudioInputId(mics[0]?.deviceId || "");
      setVideoInputId(cams[0]?.deviceId || "");
      setAudioOutputId(outs[0]?.deviceId || "");
    });
  }, [opened]);

  const switchDevice = async (
    kind: "audioinput" | "videoinput" | "audiooutput",
    deviceId: string
  ) => {
    if (!room || !deviceId) return;
    try {
      await room.switchActiveDevice(kind, deviceId);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBlur = async (enabled: boolean) => {
    if (!room) return;
    setBusyBlur(true);
    try {
      const pub = room.localParticipant.getTrackPublication(
        Track.Source.Camera
      );
      const track = pub?.track;
      if (!track || track.kind !== "video") {
        onBlurChange(enabled);
        return;
      }
      if (enabled) {
        const blur = BackgroundBlur(10);
        await (track as any).setProcessor(blur);
      } else {
        await (track as any).stopProcessor();
      }
      onBlurChange(enabled);
    } catch (e) {
      console.error("blur failed", e);
      onBlurChange(enabled);
    } finally {
      setBusyBlur(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Paramètres" centered>
      <Stack>
        <Select
          label="Microphone"
          data={audioInputs.map((d) => ({
            value: d.deviceId,
            label: d.label || `Micro ${d.deviceId.slice(0, 6)}`,
          }))}
          value={audioInputId}
          onChange={(v) => {
            if (!v) return;
            setAudioInputId(v);
            switchDevice("audioinput", v);
          }}
        />
        <Select
          label="Caméra"
          data={videoInputs.map((d) => ({
            value: d.deviceId,
            label: d.label || `Caméra ${d.deviceId.slice(0, 6)}`,
          }))}
          value={videoInputId}
          onChange={(v) => {
            if (!v) return;
            setVideoInputId(v);
            switchDevice("videoinput", v);
          }}
        />
        {audioOutputs.length > 0 && (
          <Select
            label="Haut-parleurs"
            data={audioOutputs.map((d) => ({
              value: d.deviceId,
              label: d.label || `Sortie ${d.deviceId.slice(0, 6)}`,
            }))}
            value={audioOutputId}
            onChange={(v) => {
              if (!v) return;
              setAudioOutputId(v);
              switchDevice("audiooutput", v);
            }}
          />
        )}
        <Switch
          label="Flou d'arrière-plan"
          checked={blurEnabled}
          disabled={busyBlur}
          onChange={(e) => toggleBlur(e.currentTarget.checked)}
        />
        <Button onClick={onClose}>Fermer</Button>
      </Stack>
    </Modal>
  );
}

export default DeviceSettingsModal;
