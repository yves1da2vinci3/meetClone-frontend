import { Button, Text } from "@mantine/core";

export interface RaisedHand {
  identity: string;
  fullname: string;
  userId: string;
  raisedAt: string;
}

interface RaisedHandsQueueProps {
  hands: RaisedHand[];
  isAdmin: boolean;
  onLower: (identity: string) => void;
}

function RaisedHandsQueue({ hands, isAdmin, onLower }: RaisedHandsQueueProps) {
  if (hands.length === 0) return null;

  return (
    <div className="mb-4 border rounded-lg p-3 bg-amber-50">
      <Text fw={600} size="sm" mb={8}>
        Mains levées ({hands.length})
      </Text>
      <ol className="list-decimal pl-5 flex flex-col gap-2">
        {hands.map((h, i) => (
          <li key={h.identity} className="flex items-center justify-between gap-2">
            <span className="text-sm">
              {i + 1}. {h.fullname || h.identity}
            </span>
            {isAdmin && (
              <Button size="xs" variant="outline" onClick={() => onLower(h.identity)}>
                Baisser
              </Button>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default RaisedHandsQueue;
