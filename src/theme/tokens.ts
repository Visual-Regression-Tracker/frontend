// Design tokens. Components take colours from the theme built from these,
// never from here directly, so light and dark stay in step.

// the cyan of the VRT logo, as a scale
export const brand = {
  50: "#ecfeff",
  100: "#cffafe",
  200: "#a5f3fc",
  300: "#67e8f9",
  400: "#22d3ee",
  500: "#06b6d4",
  600: "#0891b2",
  700: "#0e7490",
  800: "#155e75",
  900: "#164e63",
} as const;

export const violet = {
  300: "#c4b5fd",
  400: "#a78bfa",
  600: "#7c3aed",
  700: "#6d28d9",
} as const;

export const slate = {
  50: "#f8fafc",
  100: "#f1f5f9",
  200: "#e2e8f0",
  300: "#cbd5e1",
  400: "#94a3b8",
  500: "#64748b",
  600: "#475569",
  700: "#334155",
  800: "#1e293b",
  900: "#0f172a",
  950: "#0b1120",
} as const;

// status colours: text on paper must reach WCAG AA (4.5:1) in both modes
export const status = {
  light: {
    success: "#15803d",
    warning: "#b45309",
    error: "#b91c1c",
    info: "#1d4ed8",
  },
  dark: {
    success: "#4ade80",
    warning: "#fbbf24",
    error: "#f87171",
    info: "#60a5fa",
  },
} as const;

export const surface = {
  light: {
    default: "#f4f6f9",
    paper: "#ffffff",
    divider: slate[200],
    textPrimary: slate[900],
    textSecondary: slate[600],
  },
  dark: {
    default: slate[950],
    paper: "#111827",
    divider: "rgba(148, 163, 184, 0.18)",
    textPrimary: slate[200],
    textSecondary: slate[400],
  },
} as const;

// screenshots are shown on these in both colour modes, so transparent pixels
// look the same to every reviewer
export const imageSurface = {
  canvas: "#ffffff",
  thumbnail: "#fafafa",
} as const;

export const radius = 10;

export const fontFamily =
  '"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
