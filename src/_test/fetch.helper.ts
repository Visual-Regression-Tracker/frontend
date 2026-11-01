export const API = "http://api.test";

export function stubFetch(body: unknown = {}, init?: ResponseInit) {
  const fetchMock = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(body), init)),
    );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
