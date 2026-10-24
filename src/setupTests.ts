// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/jest-globals";
import { TextDecoder, TextEncoder } from "node:util";

// React Router 7 needs TextEncoder, which jsdom does not provide.
Object.assign(globalThis, { TextEncoder, TextDecoder });
