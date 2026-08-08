import React, { useEffect, useMemo, useRef } from "react";
import {
  GridLayout,
  FocusLayout,
  TrackReferenceOrPlaceholder,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { CustomParticipantTile } from "./CustomParticipationTile";
import AloneEmptyState from "./AloneEmptyState";

interface MyVideoConferenceProps {
  handRaiseIds: string[];
  pinnedIdentity?: string | null;
  onLocalPinChange?: (identity: string | null) => void;
  joinUrl?: string;
  roomId?: string;
}

const MyVideoConference: React.FC<MyVideoConferenceProps> = ({
  handRaiseIds,
  pinnedIdentity,
  onLocalPinChange,
  joinUrl,
  roomId,
}) => {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const screenShareTrack = useMemo(
    () =>
      tracks.find(
        (t) =>
          t.source === Track.Source.ScreenShare &&
          t.publication?.isSubscribed !== false
      ) || null,
    [tracks]
  );

  const cameraTracks = useMemo(() => {
    const seen = new Map<string, TrackReferenceOrPlaceholder>();
    for (const t of tracks) {
      if (t.source === Track.Source.ScreenShare) continue;
      if (!seen.has(t.participant.identity)) {
        seen.set(t.participant.identity, t);
      }
    }
    return Array.from(seen.values());
  }, [tracks]);

  const uniqueParticipants = useMemo(() => {
    const ids = new Set(tracks.map((t) => t.participant.identity));
    return ids.size;
  }, [tracks]);

  const [track, setTrack] = React.useState<TrackReferenceOrPlaceholder | null>(
    null
  );
  const autoShareRef = useRef<string | null>(null);
  const userOverrideRef = useRef(false);

  useEffect(() => {
    if (screenShareTrack) {
      const id = screenShareTrack.participant.identity;
      if (autoShareRef.current !== id && !userOverrideRef.current) {
        autoShareRef.current = id;
        setTrack(screenShareTrack);
      } else if (autoShareRef.current === id) {
        setTrack(screenShareTrack);
      }
      return;
    }
    autoShareRef.current = null;
    userOverrideRef.current = false;
    if (pinnedIdentity) {
      const found = tracks.find((t) => t.participant.identity === pinnedIdentity);
      setTrack(found || null);
      return;
    }
    setTrack(null);
  }, [screenShareTrack, pinnedIdentity, tracks]);

  const toggleTrack = (trackToAdd: TrackReferenceOrPlaceholder) => {
    if (trackToAdd === track) {
      userOverrideRef.current = true;
      setTrack(null);
      onLocalPinChange?.(null);
      return;
    }
    userOverrideRef.current = true;
    setTrack(trackToAdd);
    onLocalPinChange?.(trackToAdd.participant.identity);
  };

  const alone = uniqueParticipants <= 1 && !screenShareTrack;

  return (
    <div className="relative" style={{ height: "100%" }}>
      {alone && joinUrl && roomId && (
        <AloneEmptyState joinUrl={joinUrl} roomId={roomId} />
      )}
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
          tracks={cameraTracks}
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
    </div>
  );
};

export default MyVideoConference;
