import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import sonarjs from "eslint-plugin-sonarjs";
import prettier from "eslint-config-prettier";
import globals from "globals";

// the lower layers (see AGENTS.md) never reach up into UI code
const UI_LAYERS = [
  "**/components",
  "**/components/**",
  "**/pages",
  "**/pages/**",
  "**/contexts",
  "**/contexts/**",
];

const TYPED_FILES = ["src/**/*.{ts,tsx}", "integration_tests/**/*.ts"];

export default tseslint.config(
  {
    ignores: [
      "build/",
      "coverage/",
      "node_modules/",
      "playwright-report/",
      "test-results/",
      "public/env-config.js",
      "env-config.js",
      ".claude/",
      "docs/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Type-aware rules need a tsconfig: src/ uses the root one, integration_tests/ its own
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: TYPED_FILES,
  })),
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  jsxA11y.flatConfigs.recommended,
  // the rules SonarCloud runs on every PR, so they fail here first
  sonarjs.configs.recommended,
  {
    rules: {
      "require-await": "error",
    },
  },
  {
    files: TYPED_FILES,
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      // the typed variant of require-await replaces the base rule
      "require-await": "off",
      "@typescript-eslint/require-await": "error",
      // navigate()'s promise only matters with flushSync or view transitions
      "@typescript-eslint/no-floating-promises": [
        "error",
        {
          allowForKnownSafeCalls: [
            {
              from: "package",
              name: "NavigateFunction",
              package: "react-router",
            },
          ],
        },
      ],
    },
  },
  reactHooks.configs.flat.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    settings: { react: { version: "detect" } },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@mui/styles",
              message: "Deprecated; use the sx prop or styled().",
            },
          ],
          patterns: [
            {
              group: ["@mui/*/internal", "@mui/*/internal/**"],
              message: "MUI internals are not a public API.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    ignores: ["src/services/**", "src/**/*.test.*", "src/_test/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message: "Talk to the API through src/services.",
        },
      ],
    },
  },
  {
    files: [
      "src/services/**",
      "src/types/**",
      "src/_helpers/**",
      "src/constants/**",
      "src/_config/**",
    ],
    ignores: ["src/**/*.test.*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "@mui/styles", message: "Deprecated." }],
          patterns: [
            {
              group: UI_LAYERS,
              message:
                "services, types, _helpers and constants must not import UI layers (AGENTS.md).",
            },
          ],
        },
      ],
    },
  },
  {
    // Fixtures call use(), not a hook; specs assert through helpers and page objects the assertion check cannot follow
    files: ["integration_tests/**"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "sonarjs/assertions-in-tests": "off",
      "sonarjs/void-use": "off",
    },
  },
  prettier,
);
