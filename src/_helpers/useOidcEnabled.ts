import { useEffect, useState } from "react";
import { usersService } from "../services";

// Whether the backend runs with OIDC (SSO) enabled; undefined while loading.
export function useOidcEnabled(): boolean | undefined {
  const [oidcEnabled, setOidcEnabled] = useState<boolean>();

  useEffect(() => {
    let active = true;
    usersService.isOidcEnabled().then((enabled) => {
      if (active) {
        setOidcEnabled(enabled);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return oidcEnabled;
}
