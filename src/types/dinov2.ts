// GET /dinov2/status: whether this server can run the rendering-noise
// filter's DINOv2 check
export interface Dinov2Status {
  // DINOV2_URL is set on the backend
  configured: boolean;
  // the service answered its health check just now
  available: boolean;
}
