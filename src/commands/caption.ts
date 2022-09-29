import chalk from "chalk";
import inquirer from "inquirer";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Sharp } from "sharp";
import sharp from "sharp";
import type { Command } from "../types/commands/Command";

const PADDING_VERTICAL = 32;
const PADDING_HORIZONTAL = 32;
const DPI = 550;

const __dirname = dirname(fileURLToPath(import.meta.url));

async function caption(image: Sharp, text: string) {
  let currDPI = DPI;
  text = text.trim();
  let imageMetadata = await image.metadata();
  let maxTextWidth = imageMetadata.width! - PADDING_HORIZONTAL * 2;
  let textImage = sharp({
    text: {
      text: text,
      font: "Futura Extra Black Condensed",
      fontfile: join(__dirname, "..", "..", "resources", "font", "futura.otf"),
      width: maxTextWidth,
      dpi: currDPI,
      align: "center",
      rgba: true,
    },
  }).toFormat("png");

  let textMetadata = await textImage.metadata();

  while (textMetadata.width! > maxTextWidth) {
    currDPI -= 10;
    textImage = sharp({
      text: {
        text: text,
        font: "Futura Extra Black Condensed",
        fontfile: join(
          __dirname,
          "..",
          "..",
          "resources",
          "font",
          "futura.otf"
        ),
        width: maxTextWidth,
        dpi: currDPI,
        align: "center",
        rgba: true,
      },
    }).toFormat("png");
    textMetadata = await textImage.metadata();
  }

  let textBuffer = await textImage.toBuffer();

  if (textMetadata.width! > imageMetadata.width!) {
    textImage.resize({ width: imageMetadata.width! });
    textMetadata.width = imageMetadata.width!;
  }

  let topExtension = textMetadata.height! + PADDING_VERTICAL * 2;
  let pushRight = ((imageMetadata.width! - textMetadata.width!) / 2) | 0;

  let captionImage = sharp({
    create: {
      width: imageMetadata.width!,
      height:
        (imageMetadata.format === "gif"
          ? imageMetadata.pageHeight!
          : imageMetadata.height!) + topExtension,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: textBuffer,
        top: PADDING_VERTICAL,
        left: pushRight,
      },
    ])
    .toFormat("png");

  let captionBuffer = await captionImage.toBuffer();

  let newImage = image
    .extend({
      top: topExtension,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .composite([
      {
        input: captionBuffer,
        left: 0,
        top: 0,
        tile: true,
      },
    ]);
  return newImage;
}

async function prompt() {
  const { text } = await inquirer.prompt([
    {
      type: "input",
      name: "text",
      message: `${chalk.bold("Enter The Text To Be Used As The Caption: ")}`,
      validate: (input: string) => {
        return input.trim().length > 0;
      },
    },
  ]);
  return [text];
}

const exported: Command = {
  info: {
    name: "Caption",
  },
  run: caption,
  prompt: prompt,
};

export default exported;
