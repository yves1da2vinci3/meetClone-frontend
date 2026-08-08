import { ActionIcon, Button, Stack, TextInput, Text, Progress } from "@mantine/core";
import { useState } from "react";

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  closed: boolean;
  createdBy: string;
}

interface PollsPanelProps {
  polls: Poll[];
  userId: string;
  isAdmin: boolean;
  onCreate: (question: string, options: string[]) => void;
  onVote: (pollId: string, optionId: string) => void;
  onClosePoll: (pollId: string) => void;
}

function PollsPanel({
  polls,
  userId,
  isAdmin,
  onCreate,
  onVote,
  onClosePoll,
}: PollsPanelProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);

  const create = () => {
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || cleaned.length < 2) return;
    onCreate(question.trim(), cleaned);
    setQuestion("");
    setOptions(["", ""]);
  };

  return (
    <div className="h-[85vh] pt-2 flex flex-col gap-4 overflow-y-auto">
      {isAdmin && (
        <Stack spacing="xs" className="border-b pb-3">
          <Text fw={600}>Nouveau sondage</Text>
          <TextInput
            placeholder="Question"
            value={question}
            onChange={(e) => setQuestion(e.currentTarget.value)}
          />
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2 items-center">
              <TextInput
                className="flex-1"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = e.currentTarget.value;
                  setOptions(next);
                }}
              />
              {options.length > 2 && (
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() =>
                    setOptions(options.filter((_, idx) => idx !== i))
                  }
                >
                  ×
                </ActionIcon>
              )}
            </div>
          ))}
          {options.length < 8 && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setOptions([...options, ""])}
            >
              + Ajouter option
            </Button>
          )}
          <Button className="bg-blue-600" onClick={create}>
            Lancer
          </Button>
        </Stack>
      )}

      {polls.length === 0 && (
        <Text c="dimmed" size="sm">
          Aucun sondage pour l'instant
        </Text>
      )}

      {polls.map((poll) => {
        const total = poll.options.reduce((s, o) => s + o.votes.length, 0) || 1;
        const myVote = poll.options.find((o) => o.votes.includes(userId));
        return (
          <div
            key={poll.id}
            className="border rounded-lg p-3 flex flex-col gap-2"
          >
            <div className="flex justify-between items-start gap-2">
              <Text fw={600}>{poll.question}</Text>
              {poll.closed && (
                <Text size="xs" c="red">
                  Clos
                </Text>
              )}
            </div>
            {poll.options.map((opt) => {
              const pct = Math.round((opt.votes.length / total) * 100);
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={poll.closed || !!myVote}
                  onClick={() => onVote(poll.id, opt.id)}
                  className={`text-left p-2 rounded border ${
                    myVote?.id === opt.id ? "border-blue-500 bg-blue-50" : ""
                  } ${poll.closed || myVote ? "cursor-default" : "hover:bg-gray-50"}`}
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span>{opt.text}</span>
                    <span>
                      {opt.votes.length} ({pct}%)
                    </span>
                  </div>
                  <Progress value={pct} size="sm" />
                </button>
              );
            })}
            {isAdmin && !poll.closed && (
              <Button
                size="xs"
                variant="outline"
                color="red"
                onClick={() => onClosePoll(poll.id)}
              >
                Clôturer
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PollsPanel;
