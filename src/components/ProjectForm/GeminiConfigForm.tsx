import { type ChangeEvent, Fragment } from "react";
import { Link } from "@mui/material";
import { ValidatedTextField } from "../ValidatedForm";
import { required } from "../../_helpers/validation";
import { GeminiVlmConfig } from "../../types/imageComparison";
import { FieldRow } from "./SettingsRow";
import { useConfigHook } from "./useConfigHook";
import { VlmSharedFields } from "./VlmSharedFields";
import { MODEL_RULES } from "./rules";
import { ELEMENT_ID } from "../../constants/locators";

// the API returns a saved key masked; sending the mask back keeps the key
const MASKED_KEY_PREFIX = "••••";

const API_KEY_RULES = [required("API key is required")];

export const GeminiConfigForm = () => {
  const [config, updateConfig] = useConfigHook<GeminiVlmConfig>();
  const keyIsMasked = (config.apiKey || "").startsWith(MASKED_KEY_PREFIX);

  return (
    <Fragment>
      <FieldRow
        id="model"
        title="Gemini Model"
        required
        description="The Google Gemini model to use for image comparison."
        stacked
      >
        <ValidatedTextField
          name="model"
          rules={MODEL_RULES}
          id="model"
          size="small"
          type="text"
          fullWidth
          required
          value={config.model || ""}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            updateConfig("model", event.target.value);
          }}
          helperText={
            <span>
              Gemini model name.{" "}
              <Link
                href="https://ai.google.dev/models/gemini"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                View all available models
              </Link>
            </span>
          }
        />
      </FieldRow>
      <FieldRow
        id={ELEMENT_ID.geminiApiKey}
        title="Gemini API Key"
        required
        description="Your Google Gemini API key. Get one from https://makersuite.google.com/app/apikey"
        stacked
      >
        <ValidatedTextField
          name="apiKey"
          rules={API_KEY_RULES}
          id={ELEMENT_ID.geminiApiKey}
          size="small"
          type="password"
          fullWidth
          required
          value={config.apiKey || ""}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            updateConfig("apiKey", event.target.value);
          }}
          helperText={
            keyIsMasked
              ? "Leave as is to keep the saved key."
              : "Enter your Google Gemini API key"
          }
        />
      </FieldRow>
      <VlmSharedFields />
    </Fragment>
  );
};
