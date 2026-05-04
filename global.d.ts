// files

import * as manageModule from './src/logics/manage'; 

import * as spawnModule from './src/api/spawn';

import * as egModule from './src/logics/utils/executions/execution_guard';

import * as tkModule from './src/logics/utils/executions/type_checker';

import * as pathModule from './src/logics/path';

import * as colorModule from './src/logics/utils/color';

import utilsModule from './src/logics/utils/utils';

import * as typesModule from './src/logics/templates/interface';


// node modules

import enquirer from 'enquirer';

import fsExtra from 'fs-extra';

import chalk from 'chalk';

//templates

import type * as schemaModule from './src/logics/templates/schema';

import cmd_temp from './src/logics/templates/create_temps/cmd_temp.ts';

// declare global

declare global {
    var _rib_manage: typeof manageModule;
    var _rib_spawn: typeof spawnModule;
    var _rib_eg: typeof egModule;
    var _rib_tk: typeof tkModule;
    var _rib_path: typeof pathModule;
    var _rib_color: typeof colorModule;
    var _rib_utils: typeof utilsModule;
    var _rib_types: typeof typesModule;
    var _rib_mod_enquirer: typeof enquirer;
    var _rib_mod_fs_extra: typeof fsExtra;
    var _rib_cmd_temp: typeof cmd_temp;
    var _rib_mod_chalk: typeof chalk;
    var _rib_schema: typeof schemaModule;
}

export {};
