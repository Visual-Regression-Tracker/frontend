import { API_URL } from "../_config/env.config";
import noImage from "../static/no-image.png";

function getImage(name: string): string {
  if (name) return `${API_URL}/${name}`;
  return noImage;
}

export const staticService = {
  getImage,
};
