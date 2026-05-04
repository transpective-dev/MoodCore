const { rib_conf } = globalThis._rib_manage
const { utils } = globalThis._rib_utils
const { search_types, cmd_register } = globalThis._rib_types

export default {
    command: 'find',
    desc: 'find commands',
    argument: ['[value]'],
    options: [
        { option: '-t, --type <value>', desc: 'Type of search' },
        { option: '-g, --group <value>', desc: 'Group of search' },
        { option: '-m --minified', desc: 'Show minified version' }
    ],
    action: (value: any, options: any) => {

        const searchTypes = search_types || ['tag', 'cmd', 'abs', 'id', 'all'];

        if (!options.type || !searchTypes.includes(options.type)) {
            console.log("Invalid search type. We'll use 'all' as default");
            options.type = 'all';
        }

        const res = rib_conf.find({
            type: options.type,
            keywords: value,
            isMinified: options.minified,
            group: options.group
        });

        if (options.minified) {

            if ((res as string[]).length <= 0) return console.log('No macros found');

            if (Array.isArray(res)) {
                return ((utils as any).list_up || console.log)(res as string[]);
            }

        }

        if ((Object.keys(res)).length <= 0) {
            return console.log('No macros found');
        }

        console.log(res)

    }
} satisfies typeof cmd_register
