import { FastifyPluginAsync, FastifyRequest } from "fastify";
import {
  HazardUpdate,
  HazardUpdateRequest,
  HazardUpdateRequestSchema,
  NewHazardRequest,
  NewHazardRequestSchema
} from "../models/hazard.js";
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
  server.get("/:uuid", async (req: FastifyRequest<{Params: {uuid: string}}>, rep) => {
    return await Server().database.fetchHazardUpdates(req.params.uuid);
  });
  server.post("/update", {
    schema: { body: HazardUpdateRequestSchema }
  }, async (req: FastifyRequest<{Body: HazardUpdateRequest}>) => {
    const update = {
      ...req.body,
      uuid: uuidv1(),
      time: new Date(),
    };
    // check that the associated hazard actually exists
    // TODO return actual error
    if ((await Server().database.fetchHazard(update.hazard)) == null) {
      return;
    }
    await Server().database.updateHazard(update);
    return update;
  });
  server.post("/new", {
    schema: { body: NewHazardRequestSchema }
  }, async (req: FastifyRequest<{Body: NewHazardRequest}>) => {
    const hazard = {
      ...req.body,
      uuid: uuidv1(),
      time: new Date(),
    };
    // check that the associated trail actually exists
    // TODO return actual error
    if (!Server().trails.trails[String(hazard.location.trail)]) {
      return;
    }
    await Server().database.saveHazard(hazard);
    return hazard;
  });
  server.get("/active", async () => {
    const hazards = await Server().database.fetchHazards(true);
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
