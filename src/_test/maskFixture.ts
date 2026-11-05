// Reference masks are bit-packed row-major, LSB first, as the backend script writes them.
export const unpackMask = (packed: Uint8Array, pixels: number): Uint8Array =>
  Uint8Array.from(
    { length: pixels },
    (_, i) => (packed[i >> 3] >> (i & 7)) & 1,
  );
