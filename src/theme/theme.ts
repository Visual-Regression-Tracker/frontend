import { alpha, createTheme } from "@mui/material/styles";
// adds the Data Grid to the theme's component overrides (types only)
import "@mui/x-data-grid/themeAugmentation";
import {
  brand,
  fontFamily,
  radius,
  slate,
  status,
  surface,
  violet,
} from "./tokens";

// Light and dark live in one theme as colour schemes; MUI switches them with
// CSS variables, so a mode change does not re-render the tree.
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
        primary: {
          main: brand[400],
          light: brand[300],
          dark: brand[600],
          contrastText: brand[900],
        },
        secondary: { main: violet[400], light: violet[300] },
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
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: ({ theme }) => ({
          // CSS variables when the theme has them (the app), plain values
          // under a theme without (a test or story wrapping its own)
          backgroundColor: theme.vars
            ? `rgba(${theme.vars.palette.background.paperChannel} / 0.86)`
            : alpha(theme.palette.background.paper, 0.86),
          backdropFilter: "blur(8px)",
          borderBottom: `1px solid ${(theme.vars ?? theme).palette.divider}`,
        }),
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: radius + 4 } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: slate[800],
          fontSize: "0.75rem",
          borderRadius: 6,
        },
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
