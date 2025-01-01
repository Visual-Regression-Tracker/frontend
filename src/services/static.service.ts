import { API_URL } from "../_config/env.config";
import noImage from "../static/no-image.png";
import JSZip from "jszip";
import axios from "axios";
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
  const downloadFilePromises = items.map((item) =>
    axios.get(item.url, { responseType: "blob" }).then((resp) => {
      zip.file(item.filename.concat(".png"), resp.data);
    }),
  );

  return Promise.all(downloadFilePromises).then(() => {
    zip.generateAsync({ type: "blob" }).then((blob) => {
      FileSaver.saveAs(blob, "vrt_images.zip");
    });
  });
}

export const staticService = {
  getImage,
  downloadAsZip,
};
