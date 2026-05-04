#!/usr/bin/env node

// FOLDER (.ribbon)
// |- launcher.exe (start up a new terminal) 
// |- ribbon.exe (handle ribbon logics)
// |- misc (miscelaneous things)
// /-- ribbon_config.json (config for ribbon)
// /-- alias-macro.json (saving macro)
// /-- scripts (saving script)
// /-- commands (saving commands)
// |- launcher_config.json (config for launcher)

import path from "path";
import { fileURLToPath } from "url";
import { pallete } from "./src/logics/utils/color.ts";
import { spawnChild, isRibCmd } from "./src/api/spawn.ts";
import chalk from "chalk";

import readline from "readline";
import { execPath } from "process";

// Node.js ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root_path = {
  // root when packed
  fromExec: path.dirname(execPath),

  // root when dev
  fromDev: __dirname,
};

const index_name = "ribbon.exe";

const launcher_name = "launcher.exe";

const env = process.env;

env.ROOT_STATUS = 'false'; // allow user to switch admin mode
env.GET_ROOT = undefined; // get the root path
env.INDEX_FILE = undefined; // get the entry point of the application

if (execPath.endsWith(launcher_name)) {

  // top dir (the folder containing launcher.exe)
  env.GET_ROOT = root_path.fromExec;
  
  // point to exe file
  env.INDEX_FILE = path.join(env.GET_ROOT, index_name);
  
} else {
  
  // dev mode
  env.GET_ROOT = root_path.fromDev;
  
  env.INDEX_FILE = path.join(__dirname, "src", "logics", "index.ts");
  
}

console.log(process.env.GET_ROOT)

await import("./src/logics/path.ts");


// readline logic
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let activeController: AbortController | null = null;

// Global SIGINT handler to prevent memory leaks and handle aborts properly
rl.on("SIGINT", () => {
  if (activeController) {
    console.log("\n[!] aborted by user\n");
    activeController.abort(); // Kills the running child process via AbortSignal
  } else {
    // If no process is running, Ctrl+C closes the REPL entirely
    console.log("\n\nExiting Ribbon...");
    process.exit(0);
  }
});


const startLoop = async () => {
  rl.question(
    `[${process.env.ROOT_STATUS === 'true' ? chalk.hex(pallete.red)('ROOT') : chalk.hex(pallete.green)('NORMAL')}] Ribbon > `,
    async (answer) => {

      const trimmed = answer.trim();

      if (trimmed === "rib exit") {
        rl.close();
        return;
      }

      if (!trimmed) {
        startLoop();
        return;
      }

      try {

        answer = isRibCmd(answer);

        // Create the controller early so Ctrl+C during prompt doesn't exit the whole app
        activeController = new AbortController();

        // Pause readline early so it doesn't steal keypresses from execution_guard's enquirer prompt!
        rl.pause();

        console.log(`\n${chalk.hex(pallete.grey_4)("Running : ")}${answer}\n`);

        // Pass the signal down to spawnChild
        await spawnChild({
            cmd: answer,
            signal: activeController.signal,
        });

      } catch (e) {
        
        if (e !== false) {
          
          console.log("something went wrong: ", e);
          
        }
        
      } finally {
                        
        // Clear the controller once the process naturally exits or gets killed
        activeController = null;

        // Resume readline to accept user input again
        rl.resume();

        // Resume the loop to show the prompt again
        startLoop();
        
      }

    },
  );
};

startLoop();
