import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { NewHazardRequest, NewHazardRequestSchema } from "../models/hazard.js";
import { v1 as uuidv1} from 'uuid';
import Server from "../server.js";

const hazardRoutes: FastifyPluginAsync = async (server) => {
  server.post("/new", {
    schema: { body: NewHazardRequestSchema }
  }, async (req: FastifyRequest<{Body: NewHazardRequest}>, rep) => {
    const hazard = {
      uuid: uuidv1(),
      time: new Date(),
      active: true,
      ...req.body
    };
    // check that the associated trail actually exists
    // TODO return actual error
    if (!Server().trails.trailInfo[hazard.location.trail]) {
      return;
    }
    await Server().database.saveHazard(hazard);
    return hazard;
  });
  server.get("/active", async (req, rep) => {
    return await Server().database.fetchActiveHazards();
  });
};
export default hazardRoutes;
