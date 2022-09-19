import { WELCOME_MESSAGE } from "./data/text.js";
import inquirer from "inquirer";
import prompt from "inquirer-autocomplete-prompt";
import path from "path";
import fs from "fs/promises";
import fuzzy from "fuzzy";
import type separator from "inquirer/lib/objects/separator.js";
import dfold from "downloads-folder";
inquirer.registerPrompt("autocomplete", prompt);

/*
TODO:
1. Add a selection for commands after image selected
2. Add a command handler/registrator to register commands in a /commands folder
3. Add a handler to find commands relevant to image extension, link code with selection
*/

const VALID_FILE_EXTENSIONS = [
  ".gif",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
];

async function main() {
  console.log(WELCOME_MESSAGE);
  await session();
}

async function session() {
  let cache: {
    [key: string]: string[];
  } = {};
  inquirer
    .prompt([
      {
        type: "autocomplete",
        name: "filePath",
        message: "Enter a path to an Image",
        suggestOnly: true,
        source: async (_answers: any[], input = dfold()) => {
          let choices: string[] = [];
          input = input.replace(/\/+/g, "/");
          if (input.length == 0) return choices;
          let parts = path.parse(input);
          let isDir = false;
          try {
            isDir = (await fs.lstat(parts.dir)).isDirectory();
          } catch (e) {}
          if (!isDir) return choices;
          let filePaths = cache[parts.dir];
          if (filePaths == undefined) {
            let tempPaths = await fs.readdir(parts.dir);
            cache[parts.dir] = tempPaths.map((r) => {
              let extension = r.split(".").length > 1;
              if (extension) {
                return parts.dir + "/" + r;
              } else {
                return parts.dir + "/" + r + "/";
              }
            });
            filePaths = cache[parts.dir];
          }

          let validChoices: (string | separator)[] = fuzzy
            .filter(parts.base.trim(), filePaths!)
            .map((r) => r.original);
          validChoices.push(new inquirer.Separator());
          return validChoices;
        },
        validate: async (input) => {
          let isValidFile = false;
          try {
            await fs.access(input, fs.constants.R_OK);
            isValidFile = true;
          } catch (e) {}
          if (!isValidFile) return "Please input a valid file!";
          let inputSplit: string[] = input.split(".");
          let ext = inputSplit[inputSplit.length - 1];
          if (!VALID_FILE_EXTENSIONS.includes("." + ext!.toLowerCase()))
            return (
              "Please input a supported image file! Supported extensions are: " +
              VALID_FILE_EXTENSIONS.join(", ")
            );
          return true;
        },
      },
    ])
    .then((answers) => {
      console.log(answers);
    });
}

main();
