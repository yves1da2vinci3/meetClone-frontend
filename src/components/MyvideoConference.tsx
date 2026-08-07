import React, { useEffect } from "react";
import {
  GridLayout,
  FocusLayout,
  TrackReferenceOrPlaceholder,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { CustomParticipantTile } from "./CustomParticipationTile";

interface MyVideoConferenceProps {
  handRaiseIds: string[];
  pinnedIdentity?: string | null;
  onLocalPinChange?: (identity: string | null) => void;
}

const MyVideoConference: React.FC<MyVideoConferenceProps> = ({
  handRaiseIds,
  pinnedIdentity,
  onLocalPinChange,
}) => {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const uniqueTracks = Array.from(
    new Map(tracks.map((track) => [track.participant.identity, track])).values()
  );

  const [track, setTrack] = React.useState<TrackReferenceOrPlaceholder | null>(
    null
  );

  useEffect(() => {
    if (!pinnedIdentity) {
      setTrack(null);
      return;
    }
    const found = tracks.find(
      (t) => t.participant.identity === pinnedIdentity
    );
    if (found) setTrack(found);
  }, [pinnedIdentity, tracks]);

  const toggleTrack = (trackToAdd: TrackReferenceOrPlaceholder) => {
    if (trackToAdd === track) {
      setTrack(null);
      onLocalPinChange?.(null);
      return;
    }
    setTrack(trackToAdd);
    onLocalPinChange?.(trackToAdd.participant.identity);
  };

  return (
    <>
      {track ? (
        <FocusLayout
          style={{ height: "calc(90vh - var(--lk-control-bar-height))" }}
          trackRef={track}
        >
          <CustomParticipantTile
            onParticipantClick={() => {
              toggleTrack(track);
            }}
            handRaiseIds={handRaiseIds}
          />
        </FocusLayout>
      ) : (
        <GridLayout
          tracks={uniqueTracks}
          style={{ height: "calc(100vh - var(--lk-control-bar-height))" }}
        >
          <CustomParticipantTile
            onParticipantClick={(event) => {
              const trackToToggle = tracks.find(
                (t) => t.participant.identity === event.participant.identity
              );
              if (trackToToggle) {
                toggleTrack(trackToToggle);
              }
            }}
            handRaiseIds={handRaiseIds}
          />
        </GridLayout>
      )}
    </>
  );
};

export default MyVideoConference;
