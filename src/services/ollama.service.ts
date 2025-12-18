import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/env.config";
import { OllamaModel } from "../types";

interface OllamaModelsResponse {
  models: OllamaModel[];
}

async function listModels(): Promise<OllamaModel[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  const response = await fetch(`${API_URL}/ollama/models`, requestOptions);
  const data: OllamaModelsResponse = await handleResponse(response);
  return data.models;
}

export const ollamaService = {
  listModels,
};


