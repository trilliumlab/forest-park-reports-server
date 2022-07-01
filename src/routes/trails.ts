import { FastifyPluginAsync, FastifyRequest } from "fastify";
import Server from "../server.js";

const trailRoutes: FastifyPluginAsync = async (server) => {
  server.get('/list', async () => {
    return Server.trails.trailInfo;
  });
  server.get('/:uuid', async (req: FastifyRequest<{Params: {uuid: string}}>, rep) => {
    let { uuid } = req.params;
    uuid = uuid.replaceAll("-", "");
    if (uuid in Server.trails.trailPaths) {
      return Server.trails.trailPaths[uuid];
    } else {
      return Server.decorators.notFound(req, rep);
    }
  });
};
export default trailRoutes;
