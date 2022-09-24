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
import path from "path";
inquirer.registerPrompt("file-tree-selection", FileTreeSelectionPrompt);

const VALID_FILE_EXTENSIONS = ["gif", "png", "jpg", "jpeg", "webp", "svg"];

async function main() {
  console.log(WELCOME_MESSAGE);
  await session();
}

async function session() {
  inquirer
    .prompt([
      {
        root: dfold(),
        enableGoUpperDirectory: true,
        type: "file-tree-selection",
        name: "filePath",
        message: "Enter a path to an image",
        validate: (input: string) => {
          let split = input.split(path.sep).at(-1);
          if (split === undefined) return false;
          split = split.split(".").at(-1);
          if (split === undefined) return false;
          return VALID_FILE_EXTENSIONS.includes(split.toLowerCase());
        },
      },
    ])
    .then((answers) => {
      console.log(answers);
    });
}

main();
