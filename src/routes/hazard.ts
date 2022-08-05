import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { NewHazardRequest, NewHazardRequestSchema } from "../models/hazard.js";
import { v1 as uuidv1} from 'uuid';
import Server from "../server.js";

// array extensions
declare global {
  interface Array<T> {
    forEachParallel(this: Array<T>, func: (item: T) => Promise<void>): Promise<void>
  }
}
Object.defineProperty(Array.prototype, 'forEachParallel', {
  value: async function<T>(this: Array<T>, func: (item: T) => Promise<void>): Promise<void> {
    // TypeScript now correctly infers the result from this.map
    await Promise.all(this.map(item => func(item)));
  }
});

const hazardRoutes: FastifyPluginAsync = async (server) => {
  server.post("/new", {
    schema: { body: NewHazardRequestSchema }
  }, async (req: FastifyRequest<{Body: NewHazardRequest}>) => {
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
  server.get("/active", async () => {
    const hazards = await Server().database.fetchActiveHazards();
    await hazards.forEachParallel(async (hazard) => {
      if (!await Server().images.imageExists(hazard.image)) hazard.image = null;
    });
    return hazards;
  });
  server.post("/image", async (req) => {
    const data = await req.file();
    const uuid = uuidv1();
    await Server().images.saveImage(data, uuid);
    return {uuid};
  });
  server.get("/image/:uuid", async (req: FastifyRequest<{Params: {uuid: string}}>, rep) => {
    await Server().images.sendImage(rep, req.params.uuid);
  });
};

export default hazardRoutes;
