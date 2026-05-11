import chalk from "chalk";
import { pallete } from "../src/logics/utils/color.ts";
import strWidth from 'string-width'
import { isRibCmd, spawnChild } from '../src/api/spawn.ts'
import { type t_direction } from './interface.ts'
import fs from "fs-extra"
import _path from '../src/logics/path.ts'
import path from 'path'
import { saveIntoFile } from './utils/beforeClosing.ts'
import ux from "./utils/user_experience.ts"

import backlander from '../src/background_console/index.ts'

// const bc = await backlander.backlander({ dispose: 'auto' })

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

			Object.entries(suggestion_list).forEach(([key, value]) =>
			{

				const file_path = path.join(_path.paths.suggestions, key)

				saveIntoFile({
					path: file_path,
					data: value
				})

			})
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

	// currently won't use 
	const user_status = () =>
	{

		const rs = process.env.ROOT_STATUS;

		switch (rs) {

			case 'true': return chalk.hex(pallete.red)('ROOT')

			case 'false': return chalk.hex(pallete.green)('NORMAL')

			default: return chalk.hex(pallete.grey_4)('UNKNOWN')

		}

	}

	return `\n\u25E6 MOOD-CORE > `
};

import { stdin, stdout } from 'node:process';

import { type t_suggestion_group, suggestion as validate_suggestion } from "./interface.ts";

stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

// main buffers
let buffer = "";
let visual_length = 0;
let suggestion_list: t_suggestion_group = {};

(() =>
{

	const file_list = fs.readdirSync(_path.paths.suggestions);

	for (const file of file_list) {

		const fullPath = path.join(_path.paths.suggestions, file)

		if ((/\.json$/.test(file))) {

			const data = fs.readJsonSync(fullPath);

			const validated = validate_suggestion.safeParse(data)

			if (validated.success) {
				suggestion_list[file] = validated.data;
			}

		}


	}

})()

let suggestion: string | null = null;

let is_prefix_initialized = false

const render = () =>
{

	visual_length = strWidth(prefix() + buffer)

	if (!is_prefix_initialized) {

		// initialize prefix
		stdout.write(prefix())
		is_prefix_initialized = true

	}

	const raw_buffer = buffer.replace(/\n/g, '');

	// auto-conplete and suggestion
	const ghostText = (): string =>
	{

		const flatted = Object.values(suggestion_list).flatMap(suggestion =>

			Object.entries(suggestion).map(([name, { cmd, point }]) => ({ name, cmd, point }))

		).map((v) =>
		{

			if (v.cmd.startsWith(raw_buffer) && raw_buffer.length > 0) {
				return v
			}

		}).filter((v) => typeof v?.cmd === 'string');

		flatted.sort((a, b) => (b?.point ?? 0) - (a?.point ?? 0));

		suggestion = flatted[0]?.cmd ?? ''

		return suggestion.slice(raw_buffer.length)

	};

	const current_ghost = ghostText();

	// clear old cache.
	stdout.write('\x1b[J');

	// rewrite if suggestion is available.
	if (current_ghost.length > 0) {

		stdout.write(`\x1b[90m${current_ghost}\x1b[0m`); // 90m is gray


	}

	// back to the last position
	if (current_ghost.length > 0) {

		const lines = (prefix() + buffer).split('\n');
		const C = strWidth(lines[lines.length - 1]!);
		const L = current_ghost.length;
		const W = display_col();

		const lines_to_move_up = Math.floor((C + L) / W) - Math.floor(C / W);

		if (lines_to_move_up > 0) {
			handler.move_between({
				direction: 'u',
				step: lines_to_move_up,
				start: false,
			});
		}

		stdout.write('\r');

		const target_col = C % W;
		if (target_col > 0) {
			handler.move_between({
				direction: 'r',
				step: target_col,
				start: false,
			});
		}

	}

};

let is_executing = false;

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

			ux.historyManager.add(cleaned);

			return resetter();

		}

	}

	// handle backspace
	if (key === '\u007f' || key === '\u0008') {
		if (buffer.length > 0) {
			handle_buffer_change({
				type: 'del',
			});
		}
	}

	const history_cmd = ux.historyManager.detector(key, buffer);

	if (history_cmd !== undefined) {

		const step = () =>
		{

			if (strWidth(buffer) <= 0) {
				return ''
			}

			return keyMap.move_cursor('l', strWidth(buffer))

		}

		stdout.write(`${step()}\x1b[J`)
		
		buffer = history_cmd
		
		stdout.write(buffer)
		
		return render()
	}

	// handle tab (auto complete)
	if (key === '\t') {
		if (suggestion?.startsWith(buffer) && buffer.length < suggestion.length) {
			const remainder = suggestion.slice(buffer.length);
			handle_buffer_change({
				type: 'add',
				char: remainder,
			});

			for (const group of Object.entries(suggestion_list)) {

				for (const index in group[1]) {

					const macro = group[1][index];

					if (macro !== undefined && macro.cmd === suggestion) {
						suggestion_list[group[0]]![index]!.point += 1;
					}

				}

			}
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

			if (char) {
				replaceBuffer(buffer + char);

				if ((visual_length + 1) % display_col() === 0) {
					stdout.write('\n' + char);
				} else {
					stdout.write(char);
				}

			}


			break;

		case 'del':

			const lines_before = (prefix() + buffer).split('\n');
			const len_before = strWidth(lines_before[lines_before.length - 1]!);
			const W_del = display_col();

			let removed_newline = false;
			if (buffer.endsWith('\n')) {
				buffer = buffer.slice(0, -1);
				removed_newline = true;
			}

			// slice the actual character
			buffer = buffer.slice(0, -1);

			if (removed_newline) {
				// Move up 1 line, move to rightmost column, clear character
				stdout.write(keyMap.move_cursor('u', 1) + '\x1b[999C' + '\x1b[K');
			} else if (len_before > 0 && len_before % W_del === 0) {
				stdout.write(keyMap.move_cursor('u', 1) + '\x1b[999C' + '\x1b[K');
			} else {
				stdout.write('\b \b');
			}

			break;
	}

}
