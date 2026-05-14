
const search_types = [
	'tag', // search by tag
	'cmd', // search by command
	'abs', // search by description
	'id', // search by code
	'all'
] as const

export const supported_type = [
	'string',
	'number',
	'boolean',
] as const

export default {
	search_types,
	supported_type
}

export interface cmd_register
{
	command: string,
	alias?: string[] | string,
	argument?: string[],
	options?: {
		option: string,
		desc?: string
	}[],
	desc?: string,
	action?: (...args: any[]) => void
}

// types
export type t_search_types = typeof search_types[number]

export interface CommandObject
{
	id: string;
	time: string;
	desc: string;
	cmd: string;
}

export type CommandGroup = Record<string, CommandObject>;

export type CommandStore = Record<string, CommandGroup>;