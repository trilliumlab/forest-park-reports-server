import * as fs from '@std/fs';
import * as path from '@std/path';
import {MultipartFile} from "fastify/multipart";
import Service from "../service.ts";
import {FastifyReply} from "fastify";
import Server from "../server.ts";

const imageDir = import.meta.resolve("../../images").substring(7);

export default class ImageService implements Service {
  async init() {
    if (!await fs.exists(imageDir)) {
      await fs.ensureDir(imageDir);
    }
    setInterval(this.cleanImages.bind(this), Server().config.images.cleanInterval*1000*60);
  }
  async saveImage(data: MultipartFile, uuid: string) {
    // await pipeline(data.file, fs.createWriteStream(path.join(imageDir, uuid.replaceAll("-", ""))));
  }
  async sendImage(reply: FastifyReply<never>, uuid: string) {
    await reply.sendFile(path.join('/images', uuid.replaceAll("-", "")));
  }
  async imageExists(uuid: string) {
    return uuid == null ? false : fs.exists(path.resolve(imageDir, uuid.replaceAll("-", "")));
  }
  taggedImages: string[] = [];
  async cleanImages() {
    for await (const entry of Deno.readDir(imageDir)) {
      if (!await Server().database.imageInDatabase(entry.name)) {
        if (this.taggedImages.includes(entry.name)) {
          console.log(`deleting tagged image: ${entry.name}`);
          const filePath = path.resolve(imageDir, entry.name);
          await Deno.remove(filePath);
          this.taggedImages.splice(this.taggedImages.indexOf(entry.name), 1);
        } else {
          console.log(entry.name + ' is not in database, tagging');
          this.taggedImages.push(entry.name);
        }
      }
    }
  }
}
