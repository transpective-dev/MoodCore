import chalk from "chalk";
import { pallete } from "../src/logics/utils/color.ts";
import strWidth from 'string-width'
import { isRibCmd, spawnChild } from '../src/api/spawn.ts'
import { type t_direction } from './interface.ts'

// keymap 

export const keyMap = {
	'ctrl+c': '\u0003',
	'move_cursor': (direction: t_direction, step: number = 1) =>
	{

		type t_assign = (char: string) => string;

		let assign: t_assign;

		// for extract keymap and debug
		if (step === 0) {

			assign = (char: string) =>
			{
				return `\x1b[${char}`
			}

		} else {

			assign = (char: string) =>
			{
				return `\x1b[${step}${char}`
			}

		}


		switch (direction) {
			case 'r': return assign('C'); // move right
			case 'l': return assign('D'); // move left
			case 'd': return assign('B'); // move down
			case 'u': return assign('A'); // move up
		}
	},
	'erase': (type: 'l' | 'd') =>
	{

		switch (type) {
			case 'l': return "\x1b[k" // erase in line
			case 'd': return "\x1b[J" // erase from cursor to the end 
		}

	}
}

export type T_keyMap = keyof typeof keyMap;

export const isKey = (key: string, targetKey: T_keyMap): T_keyMap | 'no_found_key' =>
{

	if (key === keyMap[targetKey]) {
		return targetKey;
	}

	return 'no_found_key';
}

let activeController: AbortController | null;

export const handler = {

	'exit': () =>
	{
		if (activeController) {
			console.log("\n[!] aborted by user\n");
			activeController.abort(); // Kills the running child process via AbortSignal
		} else {
			// If no process is running, Ctrl+C closes the REPL entirely
			console.log("\n\nExiting mood-core ...");
			process.exit();
		}
	},
	"move_between": ({
		direction, step, start = false
	}: {
		direction: 'u' | 'd' | 'l' | 'r',
		step: number
		start: boolean
	}) =>
	{

		let converted = keyMap.move_cursor(direction, step);

		if (start) {
			converted += '\r'
		}

		return stdout.write(converted);

	}

}

// controller 

const prefix = () =>
{
	const user_status = () =>
	{

		const rs = process.env.ROOT_STATUS;

		switch (rs) {

			case 'true': return chalk.hex(pallete.red)('ROOT')

			case 'false': return chalk.hex(pallete.green)('NORMAL')

			default: return chalk.hex(pallete.grey_4)('UNKNOWN')

		}

	}

	return `[${user_status()}] MOOD-CORE > `
};

import { stdin, stdout } from 'node:process';

stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

// main buffers
let buffer = "";
let visual_buffer = "";
let visual_length = 0;
let suggestion = "run-test-command"; // auto-fill

let is_prefix_initialized = false

const render = () =>
{

	visual_buffer = prefix() + buffer;

	// +1 for if key was char
	visual_length = strWidth(visual_buffer) + 1;

	if (!is_prefix_initialized) {

		// initialize prefix
		stdout.write(prefix())
		is_prefix_initialized = true

	}

	// auto-conplete and suggestion
	const ghostText = (): string =>
	{
		if (suggestion.startsWith(buffer) && buffer.length > 0) {
			return suggestion.slice(buffer.length)
		}
		return ''
	};

	const current_ghost = ghostText();

	if (current_ghost.length > 0) {
		stdout.write(`\x1b[90m${current_ghost}\x1b[0m`); // 90m is gray
	}

	// use [K to clear current cursor to the end of the line
	stdout.write('\x1b[K');

	if (current_ghost.length > 0) {
		// move back to right place
		stdout.write(`\x1b[${current_ghost.length}D`);
	}

};

let is_executing = false;

import backlander from '../src/background_console/index.ts'

const bc = await backlander.backlander({ dispose: 'auto' })

stdin.on('data', async (key: string) =>
{
	if (is_executing) return;

	// handle ctrl + c (exit)
	if (key === '\u0003') handler.exit();

	if (key === '\r' || key === '\n') {

		// clean output
		stdout.write('\x1b[K');

		const cleaned = buffer.replace(/\n|\r/g, '')

		is_executing = true;

		try {

			const answer = isRibCmd(cleaned);

			// Create the controller early so Ctrl+C during prompt doesn't exit the whole app
			activeController = new AbortController();

			console.log(`\n\n${chalk.hex(pallete.grey_4)("Running : ")}${answer}\n`);

			// Pause stdin so it doesn't fight with the spawned child process for input
			stdin.setRawMode(false);
			stdin.pause();

			// Pass the signal down to spawnChild
			await spawnChild({
				cmd: answer,
				signal: activeController.signal,
			});

		} catch (e) {

			if (e !== false) {

				console.log("something went wrong: ", e);

			}

		} finally {

			is_executing = false;

			// Clear the controller once the process naturally exits or gets killed
			activeController = null;

			// Resume stdin after execution finishes
			stdin.resume();
			stdin.setRawMode(true);

			const resetter = () =>
			{
				buffer = "";
				is_prefix_initialized = false;
				render();
			}

			return resetter();

		}

	}

	// handle backspace
	if (key === '\u007f' || key === '\u0008') {
		if (buffer.length > 0 && strWidth(prefix()) < visual_length - 1) {
			handle_buffer_change({
				type: 'del',
			});
		}
	}

	// handle tab (auto complete)
	if (key === '\t') {
		if (suggestion.startsWith(buffer) && buffer.length < suggestion.length) {
			const remainder = suggestion.slice(buffer.length);
			handle_buffer_change({
				type: 'add',
				char: remainder,
			});
		}
	}

	// handle normal chars (exclude DEL)
	if (key.length === 1 && key.charCodeAt(0) >= 32 && key !== '\u007f') {

		handle_buffer_change({
			type: 'add',
			char: key,
		});

	}

	render();

});

render();

const stripAnsi = (str: string) =>
{
	const ansiPattern = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
	return str.replace(ansiPattern, '');
};

const replaceBuffer = (str: string) =>
{
	buffer = stripAnsi(str);
}

// get display column dynamically
const display_col = () => stdout.columns;

export const handle_buffer_change = ({
	type,
	char,
}: {
	type: 'add' | 'del'
	char?: string,
}) =>
{

	switch (type) {

		case 'add':

			let build_up: string | null = null

			if (char) {

				// handle \n end 

				// save a space for later adding 
				if (visual_length % (display_col()) === 0) {
					build_up = char + '\n'
				} else {
					build_up = char
				}

			}


			if (build_up) {
				stdout.write(build_up)
			};

			replaceBuffer(buffer + build_up || '');

			break;

		case 'del':

			stdout.write('\b \b');

			const split_by_newline = buffer.split('\n')

			const last_obj = split_by_newline.pop()

			const sliced = last_obj!.slice(0, -1);

			bc.log("last_obj: " + last_obj?.length)

			if (sliced !== undefined && sliced !== "") {

				bc.log(last_obj + " " + sliced)
				split_by_newline.push(sliced)

			}

			const rebuild = split_by_newline.join('\n')

			buffer = rebuild

			bc.log(buffer);

			// visual length only calc printable characters
			const K = display_col() - 1;

			const is_line_start = (visual_length - 1) > 0 && (visual_length - 1) % K === 0;

			if (is_line_start) {
				stdout.write(keyMap.move_cursor('u', 1) + '\x1b[999C');
			}

			break;
	}

}
