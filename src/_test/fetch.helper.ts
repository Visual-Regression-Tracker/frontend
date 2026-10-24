export const API = "http://api.test";

/// Replaces the global fetch with a stub answering `body` as JSON, and returns it
export function stubFetch(body: unknown = {}, init?: ResponseInit) {
  const fetchMock = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(body), init)),
    );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
