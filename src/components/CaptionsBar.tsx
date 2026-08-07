interface CaptionLine {
  userId: string;
  fullname: string;
  text: string;
}

interface CaptionsBarProps {
  lines: CaptionLine[];
  enabled: boolean;
}

function CaptionsBar({ lines, enabled }: CaptionsBarProps) {
  if (!enabled || lines.length === 0) return null;
  const latest = lines.slice(-3);
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 w-[min(40rem,90%)] flex flex-col gap-1 pointer-events-none">
      {latest.map((line, i) => (
        <div
          key={`${line.userId}-${i}-${line.text.slice(0, 12)}`}
          className="bg-black/70 text-white px-3 py-2 rounded text-center text-sm"
        >
          <span className="font-semibold">{line.fullname}: </span>
          {line.text}
        </div>
      ))}
    </div>
  );
}

export default CaptionsBar;
