import { Hono, Context } from "hono";
import trailRoutes from "./trail.ts";
import hazardRoutes from "./hazard.ts";

function apiRoutes() {
  const apiGroup = new Hono();

  apiGroup.get('/ping', (ctx: Context) => ctx.text(`Pong!`));
  apiGroup.route('/trail', trailRoutes());
  apiGroup.route('/hazard', hazardRoutes());

  return apiGroup;
}

export default apiRoutes;
