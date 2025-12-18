import { API_URL } from "../_config/env.config";
import noImage from "../static/no-image.png";
import JSZip from "jszip";
import FileSaver from "file-saver";

function getImage(name: string): string {
  if (name) return `${API_URL}/images/${name}`;
  return noImage;
}

async function downloadAsZip(
  items: {
    url: string;
    filename: string;
  }[],
): Promise<void> {
  const zip = new JSZip();
  const downloadFilePromises = items.map(async (item) => {
    const response = await fetch(item.url);
    const blob = await response.blob();
    zip.file(item.filename.concat(".png"), blob);
  });

  await Promise.all(downloadFilePromises);
  const zipBlob = await zip.generateAsync({ type: "blob" });
  FileSaver.saveAs(zipBlob, "vrt_images.zip");
}

export const staticService = {
  getImage,
  downloadAsZip,
};
