import { API_URL, STATIC_URL } from "../_config/env.config";
import noImage from "../static/no-image.png";
import JSZip from "jszip";
import FileSaver from "file-saver";

// Takes a nullable name because most of them are: a run has no diff until it
// has been compared, and no thumbnail unless one was made. The placeholder
// answer for that was always here; only the signature disagreed.
function getImage(name: string | null | undefined): string {
  if (!name) return noImage;
  // Prefer the static host: the API serves images from the same single-threaded
  // process that computes image diffs, so under ingestion load image requests
  // queue behind CPU-bound work.
  if (STATIC_URL) return `${STATIC_URL}/${name}`;
  return `${API_URL}/images/${name}`;
}

// Bytes served by the API itself: getImage redirects to storage, and a
// pre-signed S3 URL answers without CORS headers, which blocks the fetch below.
function getImageDownloadUrl(name: string): string {
  return `${API_URL}/images/${name}/download`;
}

// The download route serves the bytes from the API's own origin. An API without
// it answers 404, and its redirect to storage is then the only option — which
// works as long as storage is not S3, whose pre-signed URLs answer without CORS
// headers and so cannot be fetched at all.
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

async function downloadAsZip(
  items: {
    name: string;
    filename: string;
  }[],
): Promise<void> {
  const zip = new JSZip();
  // a zip entry of the same name replaces the earlier one, so a repeated name
  // is numbered rather than losing an image. Named up front, in the given order,
  // so which one gets the number does not depend on which download ends first.
  const taken = new Set<string>();
  const entryNames = items.map((item) => {
    let entryName = `${item.filename}.png`;
    for (let copy = 2; taken.has(entryName); copy++) {
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
  FileSaver.saveAs(zipBlob, "vrt_images.zip");
}

export const staticService = {
  getImage,
  getImageDownloadUrl,
  downloadAsZip,
};
