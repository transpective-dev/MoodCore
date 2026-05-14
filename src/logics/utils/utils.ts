const base36 = 'abcdefghijklmnopqrstuvwxyz0123456789';

function generate_id(digit: number = 6) {

    const a = Math.random().toString().slice(2, 2 + digit);
    const b = Math.random().toString(36).slice(2, 2 + digit);

    let final_id = "";

    a.split('').forEach((char, n) => {
        const valA = parseInt(char, 10);
        const valB = base36.indexOf(b[n]!);

        let targetIndex = valA + valB;

        targetIndex = targetIndex % 36;

        final_id += base36[targetIndex];

    });

    return final_id.toUpperCase();

}

function generate_local_time() {
    return new Date().toLocaleString();
}

import type { t_command_schema } from "../templates/schema.ts";

function log_formatter(msg: string, detail: t_command_schema[string]) {

    return [
        console.log(`\n${msg}\n`),
        console.log(detail),
        console.log("\n")
    ]

}

const header = {
    id: 'ID',
    alia: 'ALIA',
    t: '<T>',
    abs: 'ABSTRACT',
    time: 'TIME',
    group: 'GROUP'
}

import Table from 'cli-table3';

function list_up(ls: (typeof header)[]) {

    const table = new Table({
        head: Object.values(header),
        colWidths: [9, 20, 5, 35, 25, 20],
        wordWrap: true,
        chars: {
            'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
            'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
            'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
            'right': '│', 'right-mid': '┤', 'middle': '│'
        },
        style: { 'padding-left': 1, 'padding-right': 1, 'head': ['cyan'], }
    })

    console.log('\n');

    ls.forEach((i) => table.push(Object.values(i)))

    console.log(table.toString())

    console.log('\n');

    return
}

export default {
    generate_id,
    generate_local_time,
    log_formatter,
    header,
    list_up
}