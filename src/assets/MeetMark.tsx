export default function MeetMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      width="32"
      height="32"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#1B73E8" />
      <path
        d="M8 11.5h10.5a2 2 0 0 1 2 2V18.5a2 2 0 0 1-2 2H8a1.5 1.5 0 0 1-1.5-1.5v-6A1.5 1.5 0 0 1 8 11.5z"
        fill="white"
      />
      <path d="M21.5 13.5 27 10.5v11l-5.5-3v-5z" fill="white" />
    </svg>
  );
}
