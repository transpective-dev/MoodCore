// expose pkg and file for when launch from exe file

import * as manage from './manage.ts'
import * as eg from './utils/executions/execution_guard.ts'
import * as tk from './utils/executions/type_checker.ts'
import * as spawn from '../api/spawn.ts'
import * as _path from './path.ts'
import * as color from './utils/color.ts'
import utils from './utils/utils.ts'
import * as types from './templates/interface.ts'

// node packages
import enquirer from 'enquirer';
import fs from 'fs-extra';
import chalk from 'chalk'

// templates
import cmd_temp from './templates/create_temps/cmd_temp.ts';
import schema from './templates/schema.ts';

const glob = globalThis;

glob._rib_manage = manage;
glob._rib_eg = eg;
glob._rib_tk = tk;
glob._rib_spawn = spawn;
glob._rib_path = _path;
glob._rib_color = color;
glob._rib_utils = utils;
glob._rib_types = types;
glob._rib_mod_enquirer = enquirer;
glob._rib_mod_fs_extra = fs;
glob._rib_cmd_temp = cmd_temp;
glob._rib_mod_chalk = chalk;
glob._rib_schema = schema;