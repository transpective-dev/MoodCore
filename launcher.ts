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

// import controller
import "./launcher/controller.ts";

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

  env.WHERE_EXE = path.join(env.GET_ROOT, 'launcher.exe');

} else {

  // dev mode
  env.GET_ROOT = root_path.fromDev;

  env.INDEX_FILE = path.join(env.GET_ROOT, "src", "logics", "index.ts");

  env.WHERE_EXE = path.join(env.GET_ROOT, '.ribbon', 'launcher.exe');

}