import chalk from "chalk";
import { pallete } from "../src/logics/utils/color.ts";
import strWidth from 'string-width'

// keymap 

export const keyMap = {
    'ctrl+c': '\u0003',
    'move_cursor': (which: 'r' | 'l' | 'd' | 'u', step: number = 1) => {

        const assign = (char: string) => {
            return `\x1b[${step}${char}`
        }

        switch (which) {
            case 'r': return assign('C'); // move right
            case 'l': return assign('D'); // move left
            case 'd': return assign('B'); // move down
            case 'u': return assign('A'); // move up
        }
    }
}

export type T_keyMap = keyof typeof keyMap;

export const isKey = (key: string, targetKey: T_keyMap): T_keyMap | 'no_found_key' => {

    if (key === keyMap[targetKey]) {
        return targetKey;
    }

    return 'no_found_key';
}

let activeController: AbortController | undefined;

export const executor = {

    'exit': () => {
        if (activeController) {
            console.log("\n[!] aborted by user\n");
            activeController.abort(); // Kills the running child process via AbortSignal
        } else {
            // If no process is running, Ctrl+C closes the REPL entirely
            console.log("\n\nExiting Ribbon...");
            process.exit(0);
        }
    },
    "move_between": ({
        direction, step, start = false
    }: {
        direction: 'u' | 'd' | 'l' | 'r',
        step: number
        start: boolean
    }) => {

        let converted = keyMap.move_cursor(direction, step);

        if (start) {
            converted += '\r'
        }

        return stdout.write(converted);

    }

}

// controller 

const prefix = () => {
    return `[${process.env.ROOT_STATUS === 'true' ? chalk.hex(pallete.red)('ROOT') : chalk.hex(pallete.green)('NORMAL')}] MOOD-CORE > `
};

import { stdin, stdout } from 'node:process';

stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

let buffer = "";
let visual_length = 0;
let suggestion = "run-test-command"; // 假设这是匹配到的建议

let is_prefix_initialized = false

const is_overflow = (): { overflow: boolean, actual_lines: number, estimated_lines: number } => {

    const get_col = () => stdout.columns;

    const estimated_lines = Math.ceil((visual_length + 1) / get_col())

    const overflow = estimated_lines > 1

    const actual_lines = buffer.split('\n').length

    return {
        overflow,
        actual_lines,
        estimated_lines
    }

}

const handle_line_clean = () => {

    const { overflow, actual_lines } = is_overflow();

    if (overflow) {

        // move to first line and start
        stdout.write(`\x1b[${actual_lines}A\r`)

    }

    // clean all lines
    return stdout.write(`\x1b[${strWidth(prefix() + 1)}G\x1b[J`);

}

const render = () => {

    visual_length = strWidth(prefix() + buffer) + 1;

    if (!is_prefix_initialized) {
        // initialize prefix
        stdout.write(prefix())
        is_prefix_initialized = true
    }

    handle_line_clean();

    stdout.write(buffer);

    // 3. 如果有建议，打印灰色部分
    const ghostText = (): string => {
        if (buffer.length > 0) {
            const slice = suggestion.slice(buffer.length)
            return slice
        }
        return ''
    };

    if (suggestion.startsWith(buffer) && buffer.length > 0) {
        stdout.write(`\x1b[90m${ghostText()}\x1b[0m`); // 90m 是灰色

        // move back to right place (because hint will makes cursor mov to the end)
        stdout.write(`\x1b[${ghostText().length + 1}D`);
    }

};

stdin.on('data', (key: string) => {
    // 处理 Ctrl+C 退出
    if (key === '\u0003') process.exit();

    // 处理 Enter (回车)
    if (key === '\r' || key === '\n') {
        console.log('\n执行指令:', buffer);
        buffer = "";
        render();
        return;
    }

    // 处理 Backspace (退格)
    if (key === '\u007f' || key === '\u0008') {
        buffer = buffer.slice(0, -1);
    }
    // 处理 Tab (补全)
    else if (key === '\t') {
        if (suggestion.startsWith(buffer)) buffer = suggestion;
    }
    // 普通字符输入 (过滤掉控制字符)
    else if (key.length === 1 && key.charCodeAt(0) >= 32) {

        const { overflow, estimated_lines, actual_lines } = is_overflow();

        if (overflow && (actual_lines < estimated_lines)) {
            buffer += '\n' + key
        } else {
            buffer += key;
        }

    }

    render();
    
});

render();
