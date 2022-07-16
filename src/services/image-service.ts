import root from 'app-root-path';
import path from 'path';
import fs from 'fs-extra';
import {pipeline} from "stream/promises";
import {MultipartFile} from "@fastify/multipart";
import Service from "../service.js";
import {FastifyReply} from "fastify";

const imageDir = path.join(root.path, "images");

export default class ImageService implements Service {
  async init() {
    if (!await fs.pathExists(imageDir)) {
      await fs.mkdir(imageDir);
    }
  }
  async saveImage(data: MultipartFile, uuid: string) {
    await pipeline(data.file, fs.createWriteStream(path.join(imageDir, uuid.replaceAll("-", ""))));
  }
  async sendImage(reply: FastifyReply<any>, uuid: string) {
    await reply.sendFile(path.join('/images', uuid.replaceAll("-", "")));
  }
}
