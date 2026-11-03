import { dinov2Service } from "../services";
import { Dinov2Status } from "../types";
import { useBackendValue } from "./useBackendValue";

export const useDinov2Status = (): Dinov2Status | undefined =>
  useBackendValue<Dinov2Status | undefined>(dinov2Service.getStatus, undefined);
