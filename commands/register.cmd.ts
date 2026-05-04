const { rib_conf } = globalThis._rib_manage;
const { utils } = globalThis._rib_utils;
const { cmd_register } = globalThis._rib_types

export default {
    command: 'register',
    alias: ['regis', 'rgs', 'add'],
    argument: [
        '<i...>'
    ],
    options: [
        { option: '-d, --desc <value>', desc: 'Description of the command' },
        { option: '-a, --abstract <value>', desc: 'Abstract of the command' },
        { option: '-t, --tags <value>', desc: 'Tags of the command. form: "tag1, tag2..."' },
    ],
    desc: "register new command \n\ngrammer: rib $/regis name='command' -d 'desc' -a 'abstract' -t 'tag1, tag2...'",
    action: (i: any, options: any) => {

        i = i.join(' ');

        // split into two parts 
        const parts = i.split(/=(.*)/s).filter(Boolean);

        let [key, value] = parts;

        key = key.trim();

        if (rib_conf.has(key)) {
            console.log('error: command already exists');
            return;
        }

        if (options?.abstract?.length > 30) {

            console.log('abstract-error: abstract must be less than 30 characters');

            options.abstract = (options.abstract as string).slice(0, 30) + '...';

            console.log(`after trimmed: ${options.abstract}`);

        }

        if (!value) {
            console.log("format-error: please use key='command'");
            return;
        }

        // Strip quotes and trim
        const cleanCmd = value.replace(/^"(.*)"$/, '$1').trim();

        const tags = options.tags && (options.tags as string).split(',').map((tag) => tag.trim());

        const content = {
            id: utils.generate_id(),
            time: utils.generate_local_time(),
            abs: options.abstract || 'No abstract provided',
            desc: options.desc || "No description provided",
            cmd: cleanCmd,
            tags: tags || [],
        }

        const res = rib_conf.register(key, content);

        if (res.status) {
            (() => {
                const config = rib_conf.all('config') as any;
                if (config.settings.showMacro) {
                    return [...utils.log_formatter('Command registered: ', rib_conf.get({key}))];
                }
            })();
        } else {
            console.log(`Command registration failed: ${res.msg}`);
        }

    }
} satisfies typeof cmd_register;