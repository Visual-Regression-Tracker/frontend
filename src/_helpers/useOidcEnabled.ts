import { usersService } from "../services";
import { useBackendValue } from "./useBackendValue";

export const useOidcEnabled = (): boolean | undefined =>
  useBackendValue(usersService.isOidcEnabled, false);
