export const LOOKS = ["editorial", "classic", "glass", "bold"] as const;

export type Look = (typeof LOOKS)[number];

export type ThemeTokens = {
  id: string;
  name: string;
  look: Look;
  bone: string;
  paper: string;
  ink: string;
  muted: string;
  line: string;
  copper: string;
  field: string;
};

export const LOOK_NOTES: Record<Look, { name: string; note: string }> = {
  editorial: { name: "Editorial", note: "Warm paper, soft cards, the current house." },
  classic: { name: "Classic", note: "A printed page. Serif type, flat rules, square cards." },
  glass: { name: "Glass", note: "Frosted cards on a washed background." },
  bold: { name: "Bold", note: "Hard edges and a stamped shadow." },
};

export const THEMES: ThemeTokens[] = [
  {
    id: "field",
    name: "Field",
    look: "editorial",
    bone: "#f4efe7",
    paper: "#fbf7f2",
    ink: "#1c1915",
    muted: "#6f675e",
    line: "#e3d9cc",
    copper: "#b85c38",
    field: "#241f1a",
  },
  {
    id: "classic",
    name: "Classic",
    look: "classic",
    bone: "#f3efe4",
    paper: "#faf8f2",
    ink: "#1c2430",
    muted: "#5e6570",
    line: "#d5d0c4",
    copper: "#8d6b2f",
    field: "#1c2430",
  },
  {
    id: "glass",
    name: "Glass",
    look: "glass",
    bone: "#dfe7f2",
    paper: "#f7f9fc",
    ink: "#1a2433",
    muted: "#5d6b7c",
    line: "#d5deea",
    copper: "#3d6f8f",
    field: "#1a2433",
  },
  {
    id: "gallery",
    name: "Gallery",
    look: "editorial",
    bone: "#f6f6f4",
    paper: "#ffffff",
    ink: "#111111",
    muted: "#5c5c5c",
    line: "#e4e4e2",
    copper: "#c23b22",
    field: "#111111",
  },
  {
    id: "garden",
    name: "Garden",
    look: "editorial",
    bone: "#eef2e8",
    paper: "#f7f8f3",
    ink: "#1d2a22",
    muted: "#5d6b60",
    line: "#d5dfd0",
    copper: "#3f6b4a",
    field: "#1a2b22",
  },
  {
    id: "coast",
    name: "Coast",
    look: "glass",
    bone: "#e5f1f2",
    paper: "#f4fbfb",
    ink: "#16343a",
    muted: "#4e6b70",
    line: "#c9e0e2",
    copper: "#0e7490",
    field: "#0f2e33",
  },
  {
    id: "wine",
    name: "Wine",
    look: "classic",
    bone: "#f6efe9",
    paper: "#fbf7f4",
    ink: "#2a1218",
    muted: "#7a5c62",
    line: "#eadfd8",
    copper: "#8c2f39",
    field: "#2a1218",
  },
  {
    id: "night",
    name: "Night",
    look: "bold",
    bone: "#14181f",
    paper: "#1c222c",
    ink: "#f4efe7",
    muted: "#b7b1a8",
    line: "#2e3542",
    copper: "#a8752a",
    field: "#0c0f14",
  },
  {
    id: "dusk",
    name: "Dusk",
    look: "glass",
    bone: "#1b2030",
    paper: "#262c3e",
    ink: "#f3efe8",
    muted: "#c5c0d4",
    line: "#3a4158",
    copper: "#8d5cc4",
    field: "#121624",
  },
  {
    id: "linen",
    name: "Linen",
    look: "editorial",
    bone: "#efeae3",
    paper: "#f7f4ef",
    ink: "#2b2723",
    muted: "#746c64",
    line: "#e2dbd2",
    copper: "#a35b3b",
    field: "#2b2723",
  },
  {
    id: "signal",
    name: "Signal",
    look: "bold",
    bone: "#f2f6fb",
    paper: "#ffffff",
    ink: "#0b1f3a",
    muted: "#4d6482",
    line: "#d5e1f0",
    copper: "#155eef",
    field: "#0b1f3a",
  },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

export function resolveTheme(stored: string | null | undefined): ThemeTokens {
  if (!stored || stored === "field") return THEMES[0];
  const preset = THEMES.find((theme) => theme.id === stored);
  if (preset) return preset;
  try {
    return sanitizeTheme(JSON.parse(stored) as Partial<ThemeTokens>);
  } catch {
    return THEMES[0];
  }
}

export function sanitizeTheme(input: Partial<ThemeTokens> | null | undefined): ThemeTokens {
  const fallback = THEMES[0];
  const look = LOOKS.includes(input?.look as Look) ? (input?.look as Look) : fallback.look;
  const color = (value: unknown, backup: string) =>
    typeof value === "string" && HEX.test(value) ? value.toLowerCase() : backup;
  const preset = THEMES.find((theme) => theme.id === input?.id);
  const base = preset ?? fallback;
  const next: ThemeTokens = {
    id: preset?.id ?? "custom",
    name: preset?.name ?? "Custom",
    look,
    bone: color(input?.bone, base.bone),
    paper: color(input?.paper, base.paper),
    ink: color(input?.ink, base.ink),
    muted: color(input?.muted, base.muted),
    line: color(input?.line, base.line),
    copper: color(input?.copper, base.copper),
    field: color(input?.field, base.field),
  };
  if (!preset || !sameColors(next, preset) || next.look !== preset.look) {
    if (!preset || !sameColors(next, preset)) {
      next.id = "custom";
      next.name = "Custom";
    }
  }
  return next;
}

function sameColors(a: ThemeTokens, b: ThemeTokens): boolean {
  return (
    a.bone === b.bone &&
    a.paper === b.paper &&
    a.ink === b.ink &&
    a.muted === b.muted &&
    a.line === b.line &&
    a.copper === b.copper &&
    a.field === b.field
  );
}

export function mix(a: string, b: string, amount: number): string {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  const channel = (from: number, to: number) => Math.round(from + (to - from) * amount);
  return hex(channel(ar, br), channel(ag, bg), channel(ab, bb));
}

export function tuneTheme(
  theme: ThemeTokens,
  key: "bone" | "paper" | "ink" | "copper" | "field",
  value: string,
): ThemeTokens {
  const next = sanitizeTheme({ ...theme, id: "custom", name: "Custom", [key]: value });
  if (key === "bone" || key === "ink") {
    next.muted = mix(next.ink, next.bone, 0.45);
    next.line = mix(next.bone, next.ink, 0.18);
  }
  next.id = "custom";
  next.name = "Custom";
  return next;
}

export function isDark(hexColor: string): boolean {
  const [r, g, b] = rgb(hexColor);
  return (r * 299 + g * 587 + b * 114) / 1000 < 150;
}

export function themeVars(theme: ThemeTokens): Record<string, string> {
  return {
    "--color-bone": theme.bone,
    "--color-paper": theme.paper,
    "--color-ink": theme.ink,
    "--color-muted": theme.muted,
    "--color-line": theme.line,
    "--color-copper": theme.copper,
    "--color-field": theme.field,
    colorScheme: isDark(theme.bone) ? "dark" : "light",
  };
}

export function applyTheme(theme: ThemeTokens) {
  const root = document.documentElement;
  const vars = themeVars(theme);
  for (const [key, value] of Object.entries(vars)) {
    if (key.startsWith("--")) root.style.setProperty(key, value);
  }
  root.dataset.look = theme.look;
  root.style.colorScheme = isDark(theme.bone) ? "dark" : "light";
}

function rgb(hexColor: string): [number, number, number] {
  const n = Number.parseInt(hexColor.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hex(r: number, g: number, b: number): string {
  const channel = (n: number) => n.toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}
