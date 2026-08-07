import { Button, Select, Stack, Text } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import {
  BiMicrophone,
  BiMicrophoneOff,
  BiSolidVideo,
  BiSolidVideoOff,
} from "react-icons/bi";

export interface LobbyDevices {
  audioInputId: string;
  videoInputId: string;
  audioOutputId: string;
}

export interface LobbyPreviewProps {
  onJoin: (opts: {
    audioEnabled: boolean;
    videoEnabled: boolean;
    devices: LobbyDevices;
  }) => void;
  onCancel: () => void;
  roomLabel?: string;
}

function LobbyPreview({ onJoin, onCancel, roomLabel }: LobbyPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [audioInputId, setAudioInputId] = useState("");
  const [videoInputId, setVideoInputId] = useState("");
  const [audioOutputId, setAudioOutputId] = useState("");
  const [error, setError] = useState("");

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startPreview = async (
    nextAudioId = audioInputId,
    nextVideoId = videoInputId,
    wantAudio = audioEnabled,
    wantVideo = videoEnabled
  ) => {
    try {
      setError("");
      stopStream();
      if (!wantAudio && !wantVideo) {
        if (videoRef.current) videoRef.current.srcObject = null;
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: wantAudio
          ? nextAudioId
            ? { deviceId: { exact: nextAudioId } }
            : true
          : false,
        video: wantVideo
          ? nextVideoId
            ? { deviceId: { exact: nextVideoId } }
            : true
          : false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      setError("Impossible d'accéder au micro / à la caméra");
      console.error(e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bootstrap = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        bootstrap.getTracks().forEach((t) => t.stop());
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        const mics = devices.filter((d) => d.kind === "audioinput");
        const cams = devices.filter((d) => d.kind === "videoinput");
        const outs = devices.filter((d) => d.kind === "audiooutput");
        setAudioInputs(mics);
        setVideoInputs(cams);
        setAudioOutputs(outs);
        const micId = mics[0]?.deviceId || "";
        const camId = cams[0]?.deviceId || "";
        const outId = outs[0]?.deviceId || "";
        setAudioInputId(micId);
        setVideoInputId(camId);
        setAudioOutputId(outId);
        await startPreview(micId, camId, true, true);
      } catch (e) {
        setError("Autorisez micro et caméra pour prévisualiser");
      }
    })();
    return () => {
      cancelled = true;
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    startPreview(audioInputId, videoInputId, audioEnabled, videoEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioEnabled, videoEnabled, audioInputId, videoInputId]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-xl p-6 flex flex-col gap-4">
        <div>
          <Text fw={700} size="xl">
            Prêt à rejoindre ?
          </Text>
          {roomLabel && (
            <Text c="dimmed" size="sm">
              Salle {roomLabel}
            </Text>
          )}
        </div>

        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              videoEnabled ? "" : "hidden"
            }`}
          />
          {!videoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              Caméra désactivée
            </div>
          )}
        </div>

        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        <div className="flex gap-3">
          <Button
            variant={audioEnabled ? "filled" : "outline"}
            color={audioEnabled ? "blue" : "gray"}
            leftIcon={
              audioEnabled ? <BiMicrophone /> : <BiMicrophoneOff />
            }
            onClick={() => setAudioEnabled((v) => !v)}
          >
            Micro
          </Button>
          <Button
            variant={videoEnabled ? "filled" : "outline"}
            color={videoEnabled ? "blue" : "gray"}
            leftIcon={
              videoEnabled ? <BiSolidVideo /> : <BiSolidVideoOff />
            }
            onClick={() => setVideoEnabled((v) => !v)}
          >
            Caméra
          </Button>
        </div>

        <Stack spacing="xs">
          <Select
            label="Microphone"
            data={audioInputs.map((d) => ({
              value: d.deviceId,
              label: d.label || `Micro ${d.deviceId.slice(0, 6)}`,
            }))}
            value={audioInputId}
            onChange={(v) => v && setAudioInputId(v)}
          />
          <Select
            label="Caméra"
            data={videoInputs.map((d) => ({
              value: d.deviceId,
              label: d.label || `Caméra ${d.deviceId.slice(0, 6)}`,
            }))}
            value={videoInputId}
            onChange={(v) => v && setVideoInputId(v)}
          />
          {audioOutputs.length > 0 && (
            <Select
              label="Haut-parleurs"
              data={audioOutputs.map((d) => ({
                value: d.deviceId,
                label: d.label || `Sortie ${d.deviceId.slice(0, 6)}`,
              }))}
              value={audioOutputId}
              onChange={(v) => v && setAudioOutputId(v)}
            />
          )}
        </Stack>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="default" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            className="bg-blue-600"
            onClick={() => {
              stopStream();
              onJoin({
                audioEnabled,
                videoEnabled,
                devices: { audioInputId, videoInputId, audioOutputId },
              });
            }}
          >
            Rejoindre
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LobbyPreview;
