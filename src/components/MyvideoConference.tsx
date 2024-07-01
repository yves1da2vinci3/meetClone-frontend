import React from "react";
import {
  GridLayout,
  ParticipantContext,
  ParticipantTile,
  TrackLoop,
  useTracks,
} from "@livekit/components-react";
import { PiHandFill } from "react-icons/pi";
import { Participant, Track } from "livekit-client";
import { Group, Stack, Text } from "@mantine/core";
import { CustomParticipantTile } from "./CustomParticipationTile";

interface MyVideoConferenceProps {
  handRaiseIds: string[];
}

const CustomParticipant: React.FC<{ participant: Participant }> = ({
  participant,
}) => {
  return (
    <ParticipantContext.Provider value={participant}>
      <Stack className="relative">
        <ParticipantTile title={participant.identity} />
        <PiHandFill
          className="absolute top-6 right-6"
          color="#F7D7B5"
          size={25}
        />
      </Stack>
    </ParticipantContext.Provider>
  );
};

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

  // Ensure uniqueness of tracks based on participant's SID
  const uniqueTracks = Array.from(
    new Map(tracks.map((track) => [track.participant.identity, track])).values()
  );

  return (
    <GridLayout
      tracks={uniqueTracks}
      style={{ height: "calc(100vh - var(--lk-control-bar-height))" }}
    >
      <>
        <CustomParticipantTile handRaiseIds={handRaiseIds} />
      </>
    </GridLayout>
  );
};

export default MyVideoConference;
