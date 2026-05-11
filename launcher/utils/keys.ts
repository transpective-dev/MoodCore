import { type t_direction, type t_suggestion_group } from '../interface.ts'
import _path from '../../src/logics/path.ts'
import { stdout } from 'node:process'

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

export const handler = {
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