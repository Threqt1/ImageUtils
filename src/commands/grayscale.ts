import type { Sharp } from "sharp";
import type { Command } from "../types/commands/Command";

async function grayscale(image: Sharp, num1: number, num2: number) {
  console.log(num1, num2);
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
