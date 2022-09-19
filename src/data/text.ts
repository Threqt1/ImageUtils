import chalk from "chalk";

export const VERSION = "v1.0.0";

let TITLE = `Image Utilities`;
let AUTHOR_CREDIT = `Written By Threqt`;
let spacesToCenter =
  ((TITLE.length + VERSION.length + 1 - AUTHOR_CREDIT.length) / 2) | 0;
export const WELCOME_MESSAGE = `
  ${chalk.cyan(TITLE)} ${chalk.yellow(VERSION)}
  ${" ".repeat(spacesToCenter)}${chalk.bold(AUTHOR_CREDIT)}
`;
