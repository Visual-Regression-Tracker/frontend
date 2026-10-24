import { useEffect, useState } from "react";
import { dinov2Service } from "../services";
import { Dinov2Status } from "../types";

// a backend that cannot answer has no DINOv2 check to offer: an older one
// without the endpoint, say
const NOT_CONFIGURED: Dinov2Status = { configured: false, available: false };

// Whether the backend can run the DINOv2 check; undefined while loading.
export function useDinov2Status(): Dinov2Status | undefined {
  const [status, setStatus] = useState<Dinov2Status>();

  useEffect(() => {
    let active = true;
    const update = (next: Dinov2Status) => {
      if (active) {
        setStatus(next);
      }
    };
    dinov2Service
      .getStatus()
      .then(update)
      .catch(() => update(NOT_CONFIGURED));
    return () => {
      active = false;
    };
  }, []);

  return status;
}
