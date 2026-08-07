export function downloadIcsInvite(opts: {
  roomId: string;
  roomName: string;
  joinUrl: string;
  startDate?: Date;
  durationMinutes?: number;
}) {
  const start = opts.startDate || new Date();
  const end = new Date(
    start.getTime() + (opts.durationMinutes || 60) * 60 * 1000
  );

  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MeetClone//EN",
    "BEGIN:VEVENT",
    `UID:${opts.roomId}@meetclone.local`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escapeIcs(opts.roomName)}`,
    `DESCRIPTION:Code salle: ${opts.roomId}\\nLien: ${opts.joinUrl}`,
    `URL:${opts.joinUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `meet-${opts.roomId}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeIcs(text: string) {
  return text.replace(/[,;\\]/g, (c) => `\\${c}`);
}

export function buildInviteText(opts: {
  roomId: string;
  roomName: string;
  joinUrl: string;
}) {
  return [
    `Invitation: ${opts.roomName}`,
    `Code: ${opts.roomId}`,
    `Lien: ${opts.joinUrl}`,
  ].join("\n");
}
