const { rib_conf } = globalThis._rib_manage
const { execution_guard } = globalThis._rib_eg
const { type_checker } = globalThis._rib_tk
const { spawnChild, isRibCmd } = globalThis._rib_spawn
const { _path } = globalThis._rib_path
const { colored_prefix } = globalThis._rib_color
const utils = globalThis._rib_utils
const { cmd_register } = globalThis._rib_types
const fs = globalThis._rib_mod_fs_extra

import enquirer from 'enquirer'
const { prompt } = enquirer

import path from 'path';

const runScript = async (filename: string) => {

    const files = (await fs.readdir(_path.paths.scripts)).filter((file: string) => file.endsWith('.script.ts'))

    if (!files.includes(filename + '.script.ts')) {
        return false
    }

    const toTarget = path.join(_path.paths.scripts, filename + '.script.ts')

    const cmd = process.env.RIB_RUNTIME === 'bun' ?
        `bun "${toTarget}"` :
        `npx tsx "${toTarget}"`;

    return await spawnChild({
        cmd
    })

}

export default {
    command: 'exec',
    alias: ['run', 'r'],
    argument: [
        '<alia>',
        '[args...]',
    ],
    options: [
        {
            option: '-d, --direct',
            desc: 'Direct command execution (bypass alias)'
        },
        {
            option: '-s, --script',
            desc: 'Execute a script'
        },
    ],
    desc: 'Execute a command',
    action: async (alia: string, args: any, options: any) => {

        if (options.script) {

            const res = await runScript(alia);

            if (!res) {
                return console.log(colored_prefix.error + 'script not found');
            }

            return console.log(colored_prefix.success + 'script executed successfully');
        }

        if (options.direct) {

            const cmd = alia;

            const isSafe = await execution_guard(cmd);

            if (!isSafe) {
                return;
            }

            spawnChild({
                cmd
            });

            return;
        }

        const {
            group,
            key
        } = utils.getGroupAndKey(alia);

        const get_cmd = async (key: string = '', group?: string) => {

            const form: {
                key: string,
                group?: string
            } = { key }

            group && (form.group = group)

            console.log('[group]: ', group)
            console.log('[ key ]: ', key)

            const res = rib_conf.get(form)

            if (res === null || res === undefined) {

                const get_select = await prompt({
                    type: 'select',
                    name: 'get',
                    message: 'Command not found',
                    choices: [
                        { name: 'global', message: 'try global search' },
                        { name: 'new', message: 'try new' },
                        { name: 'exit', message: 'exit' }
                    ]
                })

                if ('get' in get_select) {

                    if (get_select.get === 'global') {
                        return await get_cmd(key)
                    }

                    if (get_select.get === 'new') {

                        const get_input = await prompt({
                            type: 'input',
                            name: 'get',
                            message: 'Enter group and alias',
                        })

                        if ('get' in get_input) {
                            const { group, key } = utils.getGroupAndKey(get_input.get as string);
                            return await get_cmd(key, group);
                        }
                    }

                    if (get_select.get === 'exit') {
                        return;
                    }

                }
            }

            utils.log_formatter('Command found: ', res)

            return res;

        };

        const get = await get_cmd(key, group);

        if (!get) {
            console.log(colored_prefix.error + 'command not found');
            return;
        }

        let replaced_cmd = await type_checker(get.cmd, args);
        
        if (!replaced_cmd) {
            return console.log(colored_prefix.error + 'command execution failed');
        }

        replaced_cmd = isRibCmd(replaced_cmd);

        spawnChild({
            cmd: replaced_cmd
        });

    }

} satisfies typeof cmd_register;