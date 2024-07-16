import React from "react";
import {
  GridLayout,
  ParticipantContext,
  ParticipantTile,
  TrackLoop,
  useTracks,
  FocusLayout,
  TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import {  Track } from "livekit-client";
import { CustomParticipantTile } from "./CustomParticipationTile";

interface MyVideoConferenceProps {
  handRaiseIds: string[];
}

const MyVideoConference: React.FC<MyVideoConferenceProps> = ({
  handRaiseIds,
}) => {
  // `useTracks` returns all camera and screen share tracks. If a user
  // joins without a published camera track, a placeholder track is returned.
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Ensure uniqueness of tracks based on participant's identity
  const uniqueTracks = Array.from(
    new Map(tracks.map((track) => [track.participant.identity, track])).values()
  );

  const [track, setTrack] = React.useState<TrackReferenceOrPlaceholder | null>(
    null
  );

  const toggleTrack = (trackToAdd: TrackReferenceOrPlaceholder) => {
    if (trackToAdd === track) {
      setTrack(null);
      return;
    }
    setTrack(trackToAdd);
  };

  return (
    <>
      {track ? (
        <FocusLayout
          style={{ height: "calc(90vh - var(--lk-control-bar-height))" }}
          trackRef={track}
        >
          <CustomParticipantTile
            onParticipantClick={(event) => {
              
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
