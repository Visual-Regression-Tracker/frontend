import { usersService } from "../services";
import { useBackendValue } from "./useBackendValue";

export const useRegistrationEnabled = (): boolean | undefined =>
  useBackendValue(usersService.isRegistrationEnabled, true);
