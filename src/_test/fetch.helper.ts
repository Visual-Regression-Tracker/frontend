export const API = "http://api.test";

export const AUTH = { Authorization: "Bearer token-1" };
export const JSON_AUTH = { "Content-Type": "application/json", ...AUTH };

// services read the token from the stored user
export function signInForEachTest() {
  beforeEach(() => {
    localStorage.setItem("user", JSON.stringify({ token: "token-1" }));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });
}

export function stubFetch(body: unknown = {}, init?: ResponseInit) {
  const fetchMock = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(body), init)),
    );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
