const { rib_conf } = globalThis._rib_manage;
const { utils } = globalThis._rib_utils;
const { cmd_register } = globalThis._rib_types;
const { prompt } = globalThis._rib_mod_enquirer;

export default {
    command: 'del',
    argument: [
        '<name>'
    ],
    desc: 'Delete a command',
    action: async (name: any) => {

        const config = rib_conf.all('config') as any;
        const ask = 'askBeforeDelete' in config.settings ? config.settings.askBeforeDelete : true;

        if (ask) {

            (() => {
                if (config.settings.showMacro) {
                    return [...utils.log_formatter('Command to delete: ', rib_conf.get({ key: name }))];
                }
            })();

            const res = await prompt({
                type: 'select',
                name: 'ask',
                message: 'Are you sure you want to delete this command?',
                choices: [
                    'yes',
                    'no'
                ]
            });

            if ('ask' in res && (res as any).ask === 'no') {
                return console.log('Deletion cancelled')
            }

        }

        const res = rib_conf.delete(name);

        if (res.status) {
            console.log(`Command deleted successfully: ${name}`);
        } else {
            console.log(`Command deletion failed: ${res.msg}`);
        }

    }
} satisfies typeof cmd_register