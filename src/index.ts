/*
TODO:
1. Add a selection for commands after image selected
2. Add a command handler/registrator to register commands in a /commands folder
3. Add a handler to find commands relevant to image extension, link code with selection
*/

import { WELCOME_MESSAGE } from "./data/text.js";
import inquirer from "inquirer";
import dfold from "downloads-folder";
import FileTreeSelectionPrompt from "inquirer-file-tree-selection-prompt";
import { dirname, join, parse, sep } from "node:path";
import { readdir } from "node:fs/promises";
import type { Command } from "./types/commands/Command.js";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Sharp } from "sharp";
import { createSpinner } from "nanospinner";
import sharp from "sharp";
import chalk from "chalk";
import type separator from "inquirer/lib/objects/separator.js";
inquirer.registerPrompt("file-tree-selection", FileTreeSelectionPrompt);

const __dirname = dirname(fileURLToPath(import.meta.url));

const VALID_FILE_EXTENSIONS = ["gif", "png", "jpg", "jpeg"];
let CommandsMap: { [key: string]: Command };
let CommandKeys: Array<string>;
const FINISH_SELECTION = "Finish Selection";

function generateRandomID() {
  return (
    Date.now().toString(36) +
    Math.floor(
      Math.pow(10, 12) + Math.random() * 9 * Math.pow(10, 12)
    ).toString(36)
  );
}

async function saveImagePrompt(
  finalImage: Sharp,
  fileName: string,
  modifications: Array<string>
) {
  clearConsole();
  const { finalDirPath } = await inquirer.prompt([
    {
      type: "file-tree-selection",
      enableGoUpperDirectory: true,
      name: "finalDirPath",
      message: "Select The Directory To Save The Final Image In",
      root: dfold(),
      onlyShowDir: true,
    },
  ]);
  let splitFileName = fileName.split(".");
  let realFileName = splitFileName[0]!.trim();
  let extension = splitFileName[1]!.trim().toLowerCase();
  let finalPath = join(
    finalDirPath,
    realFileName + "-" + generateRandomID() + "." + extension
  );
  let imageSaved = false;
  clearConsole();
  const spinner = createSpinner(chalk.bold("Modifying The Image...")).start();
  try {
    await finalImage.toFile(finalPath);
    imageSaved = true;
  } catch (e) {}
  if (imageSaved) {
    spinner.success({
      text: `Successfully modified file ${chalk.bold(
        fileName
      )} with modifications ${chalk.bold(
        modifications.join(", ")
      )} and saved to file ${chalk.cyan(finalPath)}`,
    });
  } else {
    spinner.error({
      text: `Failed to modify file ${chalk.bold(
        fileName
      )} with modifications ${chalk.bold(modifications.join(", "))}`,
    });
  }
  return process.exit(1);
}

async function parseFinalImage(
  image: Sharp,
  fileName: string,
  modifications: Array<string>
) {
  let currentImage = image;
  for (let modification of modifications) {
    let command = CommandsMap[modification]!;
    let args;
    if (command.prompt) {
      args = await command.prompt();
    } else {
      args = [];
    }
    currentImage = await command.run(currentImage, ...args);
  }
  return saveImagePrompt(currentImage, fileName, modifications);
}

async function imagePrompt(
  image: Sharp,
  fileName: string,
  currentModifications: Array<string>
): Promise<void> {
  clearConsole();
  let avaliableModifications: Array<string | separator> = CommandKeys.filter(
    (r) => !currentModifications.includes(r)
  );
  avaliableModifications.push(new inquirer.Separator());
  const { nextModification } = await inquirer.prompt([
    {
      type: "list",
      name: "nextModification",
      message: `${chalk.cyan.bold("CURRENT FILE:")} ${chalk.dim(
        fileName
      )} ${chalk.bold("|")} ${chalk.cyan.bold(
        "CURRENT MODIFICATIONS:"
      )} ${chalk.dim(currentModifications.join(", "))}\n${chalk.bold(
        "Choose Another Modification To Apply To The Image"
      )}`,
      choices: avaliableModifications,
      loop: true,
    },
  ]);
  if (nextModification === FINISH_SELECTION) {
    return parseFinalImage(image, fileName, currentModifications);
  } else {
    currentModifications.push(nextModification);
    return imagePrompt(image, fileName, currentModifications);
  }
}

async function startImagePrompt(imagePath: string) {
  let image: Sharp;
  let parsedPath = parse(imagePath);
  if (parsedPath.ext.toLowerCase().trim() === ".gif") {
    image = sharp(imagePath, {
      animated: true,
    });
  } else {
    image = sharp(imagePath);
  }
  return imagePrompt(image, parsedPath.base.trim(), []);
}

async function sessionPrompt() {
  clearConsole();
  let { filePath } = await inquirer.prompt([
    {
      root: dfold(),
      enableGoUpperDirectory: true,
      type: "file-tree-selection",
      name: "filePath",
      message: "Select A Path To The Image You Want To Modify",
      validate: (input: string) => {
        let fileName = input.split(sep).at(-1);
        if (fileName === undefined) return false;
        let fileExtension = fileName.split(".").at(-1);
        if (fileExtension === undefined) return false;
        return VALID_FILE_EXTENSIONS.includes(fileExtension.toLowerCase());
      },
    },
  ]);
  return startImagePrompt(filePath);
}

async function registerValidCommands() {
  const commandsMap: {
    [key: string]: Command;
  } = {};
  const commandsDirectory = join(__dirname, "commands");
  const commandFiles = await readdir(commandsDirectory);
  for (let filePath of commandFiles) {
    const command: Command = (
      await import(pathToFileURL(join(commandsDirectory, filePath)).toString())
    ).default;
    commandsMap[command.info.name] = command;
  }
  return commandsMap;
}

async function clearConsole() {
  console.clear();
  console.log(WELCOME_MESSAGE);
}

async function main() {
  clearConsole();
  CommandsMap = await registerValidCommands();
  CommandKeys = Object.keys(CommandsMap);
  CommandKeys.push(FINISH_SELECTION);
  await sessionPrompt();
}

main();
