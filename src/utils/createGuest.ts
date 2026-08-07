export interface GuestUser {
  _id: string;
  fullname: string;
  email: string;
  photoUrl: string;
  isGuest: boolean;
}

export function createGuestUser(name: string): GuestUser {
  const trimmed = name.trim() || "Guest";
  const id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return {
    _id: id,
    fullname: trimmed,
    email: "guest@local",
    photoUrl: "",
    isGuest: true,
  };
}

export function ensureParticipant(): GuestUser | null {
  const raw = localStorage.getItem("participant");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
