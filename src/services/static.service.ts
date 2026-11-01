import { API_URL, STATIC_URL } from "../_config/env.config";
import noImage from "../static/no-image.png";

function getImage(name: string | null | undefined): string {
  if (!name) return noImage;
  // Prefer the static host: the API's process also computes diffs, so images queue behind it.
  if (STATIC_URL) return `${STATIC_URL}/${name}`;
  return `${API_URL}/images/${name}`;
}

// The API's own bytes: a pre-signed S3 URL has no CORS headers, blocking the fetch.
function getImageDownloadUrl(name: string): string {
  return `${API_URL}/images/${name}/download`;
}

// On a 404 (no download route), the storage redirect works only if storage is not S3.
async function fetchImage(name: string, filename: string): Promise<Blob> {
  const response = await fetch(getImageDownloadUrl(name));
  if (response.ok) {
    return response.blob();
  }
  if (response.status !== 404) {
    throw new Error(`Cannot download ${filename}: ${response.status}`);
  }

  const redirected = await fetch(getImage(name));
  if (!redirected.ok) {
    // otherwise the error body lands in the zip named like an image
    throw new Error(`Cannot download ${filename}: ${redirected.status}`);
  }
  return redirected.blob();
}

// revoked later, not at once: some browsers have not started the download when click() returns
function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 40_000);
}

async function downloadAsZip(
  items: {
    name: string;
    filename: string;
  }[],
): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  // a repeated name would overwrite its zip entry, so it is numbered in the given order
  const taken = new Set<string>();
  const entryNames = items.map((item) => {
    let entryName = `${item.filename}.png`;
    let copy = 1;
    while (taken.has(entryName)) {
      copy += 1;
      entryName = `${item.filename} (${copy}).png`;
    }
    taken.add(entryName);
    return entryName;
  });
  const downloadFilePromises = items.map(async (item, index) => {
    const blob = await fetchImage(item.name, item.filename);
    zip.file(entryNames[index], blob);
  });

  await Promise.all(downloadFilePromises);
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveBlob(zipBlob, "vrt_images.zip");
}

export const staticService = {
  getImage,
  downloadAsZip,
};
