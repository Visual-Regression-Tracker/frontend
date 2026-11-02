import { alpha, createTheme, type Theme } from "@mui/material/styles";
// adds the Data Grid to the theme's component overrides (types only)
import "@mui/x-data-grid/themeAugmentation";
import {
  brand,
  darkAccent,
  fontFamily,
  radius,
  slate,
  status,
  surface,
  violet,
} from "./tokens";

const STATUS_COLORS = ["success", "warning", "error", "info"] as const;

// in dark mode what floats sits one step lighter than the panels, as a shadow sets it apart in light
const elevatedInDark = ({ theme }: { theme: Theme }) =>
  theme.applyStyles("dark", {
    backgroundColor: surface.dark.elevated,
    border: `1px solid ${surface.dark.divider}`,
  });

// MUI switches colour schemes with CSS variables, so a mode change does not re-render the tree
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: "data-vrt-color-scheme" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: brand[700], light: brand[500], dark: brand[800] },
        secondary: { main: violet[700], light: violet[400] },
        success: { main: status.light.success },
        warning: { main: status.light.warning },
        error: { main: status.light.error },
        info: { main: status.light.info },
        background: {
          default: surface.light.default,
          paper: surface.light.paper,
        },
        divider: surface.light.divider,
        text: {
          primary: surface.light.textPrimary,
          secondary: surface.light.textSecondary,
        },
      },
    },
    dark: {
      palette: {
        primary: { ...darkAccent },
        secondary: { main: violet[300], light: violet[300] },
        success: { main: status.dark.success },
        warning: { main: status.dark.warning },
        error: { main: status.dark.error },
        info: { main: status.dark.info },
        background: {
          default: surface.dark.default,
          paper: surface.dark.paper,
        },
        divider: surface.dark.divider,
        text: {
          primary: surface.dark.textPrimary,
          secondary: surface.dark.textSecondary,
        },
        action: { selectedOpacity: 0.1, hoverOpacity: 0.06 },
      },
    },
  },
  shape: { borderRadius: radius },
  typography: {
    fontFamily,
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none", letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitFontSmoothing: "antialiased" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: radius - 2 } },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: radius - 2 } },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: radius + 2,
          transition: theme.transitions.create(["box-shadow", "border-color"]),
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500 },
        sizeSmall: { height: 22, fontSize: "0.75rem" },
      },
      // in dark mode a filled chip is a tint with coloured text; a solid saturated badge shouts
      variants: STATUS_COLORS.map((color) => ({
        props: { variant: "filled" as const, color },
        style: ({ theme }: { theme: Theme }) =>
          theme.applyStyles("dark", {
            backgroundColor: `rgba(${theme.vars?.palette[color].mainChannel} / 0.16)`,
            color: theme.vars?.palette[color].main,
          }),
      })),
    },
    MuiMenu: {
      styleOverrides: { paper: elevatedInDark },
    },
    MuiPopover: {
      styleOverrides: { paper: elevatedInDark },
    },
    MuiAutocomplete: {
      styleOverrides: { paper: elevatedInDark },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: ({ theme }) => ({
          // CSS variables when the theme has them (the app), plain values under a theme without (a test)
          backgroundColor: theme.vars
            ? `rgba(${theme.vars.palette.background.paperChannel} / 0.86)`
            : alpha(theme.palette.background.paper, 0.86),
          backdropFilter: "blur(8px)",
          borderBottom: `1px solid ${(theme.vars ?? theme).palette.divider}`,
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: radius + 4,
          ...elevatedInDark({ theme }),
        }),
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          backgroundColor: slate[800],
          fontSize: "0.75rem",
          borderRadius: 6,
          ...theme.applyStyles("dark", {
            backgroundColor: surface.dark.tooltip,
            border: `1px solid ${surface.dark.divider}`,
          }),
        }),
        arrow: ({ theme }) =>
          theme.applyStyles("dark", { color: surface.dark.tooltip }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: radius - 2 } },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: 0,
          "--DataGrid-containerBackground": (theme.vars ?? theme).palette
            .background.paper,
        }),
        columnHeaderTitle: { fontWeight: 600 },
      },
    },
  },
});
