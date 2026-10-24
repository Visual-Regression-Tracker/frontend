import socketIOClient, { Socket } from "socket.io-client";
import { connect, socketReducer } from "./socket.context";

const { env } = vi.hoisted(() => ({
  env: { apiUrl: undefined as string | undefined },
}));

vi.mock("../_config/env.config", () => ({
  get API_URL() {
    return env.apiUrl;
  },
}));

vi.mock("socket.io-client", () => ({ default: vi.fn() }));

const socket = { id: "socket-1" } as unknown as Socket;

describe("socketReducer", () => {
  it("connect keeps the socket", () => {
    const state = socketReducer(
      { socket: undefined },
      { type: "connect", payload: socket },
    );

    expect(state).toEqual({ socket });
  });

  it("connect replaces the socket it had", () => {
    const other = { id: "socket-2" } as unknown as Socket;

    const state = socketReducer(
      { socket },
      { type: "connect", payload: other },
    );

    expect(state.socket).toBe(other);
  });

  // NOTE: "clear" is a declared action but the reducer ignores it
  it("does not change the state for clear", () => {
    const before = { socket };

    expect(socketReducer(before, { type: "clear" })).toBe(before);
  });

  it("does not change the state for an unknown action", () => {
    const before = { socket: undefined };

    expect(socketReducer(before, { type: "nope" } as never)).toBe(before);
  });
});

describe("connect", () => {
  beforeEach(() => {
    env.apiUrl = undefined;
  });

  it("opens a socket to the API and dispatches connect with it", () => {
    env.apiUrl = "http://api.test";
    vi.mocked(socketIOClient).mockReturnValue(socket);
    const dispatch = vi.fn();

    connect(dispatch);

    expect(socketIOClient).toHaveBeenCalledWith("http://api.test");
    expect(dispatch).toHaveBeenCalledWith({ type: "connect", payload: socket });
  });

  it("does nothing when there is no API URL", () => {
    const dispatch = vi.fn();

    connect(dispatch);

    expect(socketIOClient).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
