import { useEffect, useState } from "react";
import { usersService } from "../services";

// Whether the backend runs with OIDC (SSO) enabled; undefined while loading.
export function useOidcEnabled(): boolean | undefined {
  const [oidcEnabled, setOidcEnabled] = useState<boolean>();

  useEffect(() => {
    let active = true;
    const update = (enabled: boolean) => {
      if (active) {
        setOidcEnabled(enabled);
      }
    };
    usersService
      .isOidcEnabled()
      .then(update)
      .catch(() => update(false));
    return () => {
      active = false;
    };
  }, []);

  return oidcEnabled;
}
