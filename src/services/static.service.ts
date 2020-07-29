import { API_URL } from "../_config/env.config";

function getImage(name: string): string {
  if (name) return `${API_URL}/${name}`;
  return "/no-image.png";
}

export const staticService = {
  getImage,
};
