import { dinov2Service } from "../services";
import { Dinov2Status } from "../types";
import { useBackendValue } from "./useBackendValue";

// an older backend without the endpoint cannot answer: no DINOv2 check to offer
const NOT_CONFIGURED: Dinov2Status = { configured: false, available: false };

export const useDinov2Status = (): Dinov2Status | undefined =>
  useBackendValue(dinov2Service.getStatus, NOT_CONFIGURED);
