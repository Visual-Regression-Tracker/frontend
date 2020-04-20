import { API_URL } from "../_config/api.config";

export const staticService = {
  getImage,
};

function getImage(name: string): string {
  return `${API_URL}/${name}`;
}
