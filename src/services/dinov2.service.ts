import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/env.config";
import { Dinov2Status } from "../types";

async function getStatus(): Promise<Dinov2Status> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  const response = await fetch(`${API_URL}/dinov2/status`, requestOptions);
  return handleResponse(response);
}

export const dinov2Service = {
  getStatus,
};
