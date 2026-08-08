import { Button, CopyButton } from "@mantine/core";

interface AloneEmptyStateProps {
  joinUrl: string;
  roomId: string;
}

function AloneEmptyState({ joinUrl, roomId }: AloneEmptyStateProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto bg-white/95 shadow-xl rounded-2xl p-8 max-w-md text-center flex flex-col gap-4">
        <p className="text-xl font-semibold">Vous êtes seul ici</p>
        <p className="text-gray-500 text-sm">
          Partagez le lien pour inviter des participants.
        </p>
        <p className="text-xs text-gray-400 font-mono">{roomId}</p>
        <CopyButton value={joinUrl} timeout={2000}>
          {({ copied, copy }) => (
            <Button className="bg-blue-600" onClick={copy}>
              {copied ? "Lien copié" : "Copier le lien"}
            </Button>
          )}
        </CopyButton>
      </div>
    </div>
  );
}

export default AloneEmptyState;
