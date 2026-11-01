// Components take colours from the theme built from these, never from here, so light and dark stay in step

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

// the logo's cyan, toned down for dark surfaces where the full hue glares
export const darkAccent = {
  main: "#5ec3d6",
  light: "#8ad4e2",
  dark: "#3aa6bb",
  contrastText: "#082028",
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
  // softer than the light ones: saturated hues glare on a dark surface
  dark: {
    success: "#5cc58c",
    warning: "#e0b44a",
    error: "#f0787d",
    info: "#72b4f2",
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
  // graphite rather than navy; elevated is what floats over the panels (menus, dialogs, popovers)
  dark: {
    default: "#111318",
    paper: "#181b21",
    elevated: "#20242c",
    tooltip: "#2c313b",
    divider: "rgba(255, 255, 255, 0.09)",
    textPrimary: "#e6e8ec",
    textSecondary: "#a1a8b4",
  },
} as const;

// screenshots sit on these in both modes so transparent pixels look the same to every reviewer
export const imageSurface = {
  canvas: "#ffffff",
  thumbnail: "#fafafa",
} as const;

export const radius = 10;

export const fontFamily =
  '"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
