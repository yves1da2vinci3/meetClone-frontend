import { Button } from "@mantine/core";
import { useLocalParticipant, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";

function PresentingBanner() {
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false }
  );
  const presenting = tracks.some(
    (t) => t.participant.identity === localParticipant.identity
  );

  if (!presenting) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg">
      <span className="text-sm font-medium">Vous présentez</span>
      <Button
        size="xs"
        color="red"
        onClick={() => {
          localParticipant.setScreenShareEnabled(false).catch(() => {});
        }}
      >
        Arrêter
      </Button>
    </div>
  );
}

export default PresentingBanner;
