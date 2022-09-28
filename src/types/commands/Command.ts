import type { Sharp } from "sharp";

export interface Command {
  info: {
    name: string;
  };
  run: (image: Sharp, ...args: any[]) => Promise<Sharp>;
  prompt: (() => Promise<Array<any>>) | null;
}
