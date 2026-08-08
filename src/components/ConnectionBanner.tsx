import { useEffect, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { ConnectionQuality, ConnectionState, RoomEvent } from "livekit-client";

function ConnectionBanner() {
  const room = useRoomContext();
  const [label, setLabel] = useState<string | null>(null);
  const [tone, setTone] = useState<"warn" | "bad">("warn");

  useEffect(() => {
    if (!room) return;

    const update = () => {
      const state = room.state;
      const quality = room.localParticipant.connectionQuality;

      if (state === ConnectionState.Disconnected) {
        setLabel("Déconnecté");
        setTone("bad");
        return;
      }
      if (state === ConnectionState.Reconnecting) {
        setLabel("Reconnexion…");
        setTone("warn");
        return;
      }
      if (
        state === ConnectionState.Connected &&
        quality === ConnectionQuality.Poor
      ) {
        setLabel("Connexion instable");
        setTone("warn");
        return;
      }
      setLabel(null);
    };

    update();
    room.on(RoomEvent.ConnectionStateChanged, update);
    room.on(RoomEvent.ConnectionQualityChanged, update);
    return () => {
      room.off(RoomEvent.ConnectionStateChanged, update);
      room.off(RoomEvent.ConnectionQualityChanged, update);
    };
  }, [room]);

  if (!label) return null;

  return (
    <div
      className={`absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-medium text-white shadow ${
        tone === "bad" ? "bg-red-600" : "bg-amber-500"
      }`}
    >
      {label}
    </div>
  );
}

export default ConnectionBanner;
