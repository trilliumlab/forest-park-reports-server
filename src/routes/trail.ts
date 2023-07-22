import { FastifyPluginAsync, FastifyRequest } from "fastify";
import Server from "../server.js";

const trailRoutes: FastifyPluginAsync = async (server) => {
  server.get('/list', async () => {
    return Object.keys(Server().trails.trails).map((k) => Number(k));
  });
  server.get('/:id', async (req: FastifyRequest<{Params: {id: string}}>, rep) => {
    const { id } = req.params;
    Server().logger.debug(`Got request with ${id}, ${typeof id}`);
    if (id in Server().trails.trails) {
      return Server().trails.trails[id].encode();
    } else {
      return Server().decorators.notFound(req, rep);
    }
  });
};
export default trailRoutes;
