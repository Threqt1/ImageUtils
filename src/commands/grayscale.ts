import type { Sharp } from "sharp";
import type { Command } from "../types/commands/Command";

async function grayscale(image: Sharp) {
  return image.grayscale();
}

const exported: Command = {
  info: {
    name: "Grayscale",
  },
  run: grayscale,
  prompt: null,
};

export default exported;
