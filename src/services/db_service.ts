import {
  Hazard,
  hazardRowToHazard,
  hazardToHazardRow,
  HazardUpdate,
} from "../models/hazard.ts";
import { db } from "../database/client.ts";
import Service from "../service.ts";
import { v1 as uuidv1 } from "@std/uuid";
import {
  hazards as hazardsTable,
  updates as updatesTable,
} from "../database/schema.ts";
import { eq } from "drizzle-orm";

export default class DbService implements Service {
  async init() {}
  async saveHazard(hazard: Hazard) {
    const row = hazardToHazardRow(hazard);
    await db.transaction(async (tx) => {
      await db.insert(hazardsTable).values(row).onConflictDoUpdate({
        target: hazardsTable.uuid,
        set: row,
      });
      await this.updateHazard({
        uuid: uuidv1.generate(),
        hazard: hazard.uuid,
        time: hazard.time,
        active: true,
        blurHash: hazard.blurHash,
        image: hazard.image,
      }, tx);
    });
  }
  async updateHazard(update: HazardUpdate, tx = db) {
    await tx.insert(updatesTable).values(update).onConflictDoUpdate({
      target: updatesTable.uuid,
      set: update,
    });
  }
  async fetchHazards(active = true): Promise<Hazard[]> {
    const hazardRows = await db.query.hazards.findMany();
    const hazards: Hazard[] = [];
    await hazardRows.forEachParallel(async (row) => {
      const hazard = hazardRowToHazard(row);
      if (!active) {
        hazards.push(hazard);
      } else {
        const updates = (await this.fetchHazardUpdates(hazard.uuid))
          .sort((a, b) => b.time.getTime() - a.time.getTime());
        if (updates.length > 0) {
          if (updates[0].active) {
            hazards.push(hazard);
          }
        }
      }
    });
    return hazards;
  }
  async fetchHazard(uuid: string): Promise<Hazard | null> {
    const hazardRow = await db.query.hazards.findFirst({
      where: eq(hazardsTable.uuid, uuid),
    });
    return hazardRow ? hazardRowToHazard(hazardRow) : null;
  }
  async fetchHazardUpdates(hazard: string): Promise<Array<HazardUpdate>> {
    return await db.query.updates.findMany({
      where: eq(updatesTable.hazard, hazard),
    });
  }
  async imageInDatabase(uuid: string): Promise<boolean> {
    return !!await db.query.updates.findFirst({
      where: eq(updatesTable.image, uuid),
    });
  }
}
