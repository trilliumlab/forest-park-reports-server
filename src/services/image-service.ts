import * as fs from '@std/fs';
import * as path from '@std/path';
import Service from "../service.ts";
import Server from "../server.ts";

const imageDir = import.meta.resolve("../../images").substring(7);

export default class ImageService implements Service {
  async init() {
    if (!await fs.exists(imageDir)) {
      await fs.ensureDir(imageDir);
    }
    setInterval(this.cleanImages.bind(this), Server().config.images.cleanInterval*1000*60);
  }
  async saveImage(data: File, uuid: string) {
    await Deno.writeFile(path.resolve(imageDir, uuid.replaceAll("-", "")), data.stream());
  }
  async getImage(uuid: string): Promise<ReadableStream<Uint8Array>> {
    const imageFile = await Deno.open(path.resolve(imageDir, uuid.replaceAll("-", "")));
    return imageFile.readable;
  }
  async imageExists(uuid: string) {
    return uuid ? await fs.exists(path.resolve(imageDir, uuid.replaceAll("-", ""))) : false;
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
