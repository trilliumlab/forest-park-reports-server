import { FastifyPluginAsync, FastifyRequest } from "fastify";
import Server from "../server.js";
import { Trail, TrailColor, Color } from "../services/trails-service.js";

const trailRoutes: FastifyPluginAsync = async (server) => {
  server.get('/list', async () => {
    return Server().trails.trailInfo;
  });
  server.get('/:uuid', async (req: FastifyRequest<{Params: {uuid: string}}>, rep) => {
    let { uuid } = req.params;
    uuid = uuid.replaceAll("-", "");
    if (uuid in Server().trails.trailPaths) {
      const gpx = Server().trails.trailPaths[uuid];
      return new Trail(gpx, new TrailColor(Color.hex("FFFFFF"))).encode();
    } else {
      return Server().decorators.notFound(req, rep);
    }
  });
};
export default trailRoutes;
