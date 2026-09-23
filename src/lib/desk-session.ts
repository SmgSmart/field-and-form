const DESK_KEY = "desk-session";

/** Preview iframes often drop cookies, so the desk also keeps its session here. */
export function getDeskToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(DESK_KEY);
  } catch {
    return null;
  }
}

export function setDeskToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.sessionStorage.setItem(DESK_KEY, token);
    else window.sessionStorage.removeItem(DESK_KEY);
  } catch {
    /* storage unavailable */
  }
}
