// GET /dinov2/status
export interface Dinov2Status {
  // DINOV2_URL is set on the backend
  configured: boolean;
  // the service answered its health check just now
  available: boolean;
}
