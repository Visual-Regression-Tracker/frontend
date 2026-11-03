import { act } from "@testing-library/react";

// an async act, so the updates a resolved answer causes are flushed before the next assertion
export const actAsync = (fn: () => void) =>
  act(() => {
    fn();
    return Promise.resolve();
  });
