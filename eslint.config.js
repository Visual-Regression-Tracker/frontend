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
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  jsxA11y.flatConfigs.recommended,
  // the rules SonarCloud runs on every PR, so they fail here first
  sonarjs.configs.recommended,
  // Warnings, not errors: an open-task comment is debt to see, not a reason
  // to fail the build, and an async function with nothing to await (Sonar's
  // S7503, which the plugin leaves to require-await) is common in older tests
  // and mocks. SonarCloud flags both in new code only.
  {
    rules: {
      "sonarjs/todo-tag": "warn",
      "require-await": "warn",
    },
  },
  {
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    settings: { react: { version: "detect" } },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "warn",
      // most files still import React from the classic JSX transform days
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^React$" },
      ],
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
    // Playwright fixtures call a parameter named use(), which is not a hook.
    // Specs assert through shared helpers and page objects, which the
    // assertion check does not follow, and `void fixture` asks for a fixture
    // that is wanted only for its setup.
    files: ["integration_tests/**"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "sonarjs/assertions-in-tests": "off",
      "sonarjs/void-use": "off",
    },
  },
  prettier,
);
