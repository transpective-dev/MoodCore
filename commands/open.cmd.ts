const { cmd_register } = globalThis._rib_types;
const { spawnChild } = globalThis._rib_spawn;
const _path = globalThis._rib_path;

const platform = process.env.USR_PLATFORM;

export default {
    command: "open",
    argument: ['<name>'],
    desc: "open system file",
    action: async (name: any) => {

        const p = platform;

        const cmd = () => {
            if (p === 'win') return 'start';
            if (p === 'mac') return 'open';
            if (p === 'lnx') return 'xdg-open';
        };

        const forRunning = async (path: string) => {
            try {

                await spawnChild({
                    cmd: `${cmd()} "${path}"`
                });

            } catch (error) {

                console.log(error);

            }
        }

        switch (name) {
            case "config":
                return await forRunning(_path.usr_config);
            case 'alias':
                return await forRunning(_path.usr_command);
            default:
                console.log(`file not supported: ${name}`)
                break
        }
    }
} satisfies typeof cmd_register;