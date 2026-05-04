import path from 'path'

const root = process.env.GET_ROOT || '';

// dont forget to delete src when publish
const misc = path.join(root, 'misc');
const usr_config = path.join(misc, 'ribbon_config.json');
const usr_command = path.join(misc, 'alias_macro.json');
const scripts = path.join(root, 'scripts');
const commands = path.join(root, 'commands');
const custom = path.join(commands, 'custom');
const launcher_config = path.join(root, 'launcher_config.json');

const paths = {
    misc,
    scripts,
    commands,
    launcher_config,
    custom,
}

const dev = {
    misc, 
}

import fs from "fs-extra";

export const init_path = async () => {

    const ls = process.env.GET_ROOT?.endsWith('.exe') ? Object.values(paths) : Object.values(dev)

    for (const i of ls) {

        let t: 'folder' | 'file' | undefined = undefined

        const suffix = ['.json', '.js', '.ts']

        if (suffix.some((s) => i.endsWith(s))) {
            t = 'file'
        } else {
            t = 'folder'
        }

        if (t === 'folder') {
            await fs.ensureDir(i)
        }

        if (t === 'file') {
            await fs.ensureFile(i)
        }
    }
}

await init_path();

export default {
    root,
    misc,
    paths,
    usr_config,
    usr_command,
    custom
}