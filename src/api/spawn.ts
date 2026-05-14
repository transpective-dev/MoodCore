import { spawn, spawnSync } from "node:child_process";
import iconv from 'iconv-lite';
import { rib_conf } from "../logics/manage.ts";
import { execution_guard } from "../logics/utils/executions/execution_guard.ts";
import { startBy } from "../logics/env.ts";

const isWindows = process.platform === 'win32';

const shellStatus = () =>
{

	const useShell = rib_conf.getConfig('useShell') as boolean;

	if (useShell) {
		return isWindows ? 'powershell.exe' : '/bin/bash';
	}

	return true;
}

export const isRibCmd = (cmd: string) =>
{

	const regex = /(?:^|\s)\brib\b(?:\s|$)/g

	const ifRib = process.env.INDEX_FILE?.endsWith('.exe') ? `${startBy()} "${process.env.INDEX_FILE}" ` : `bun run \"${process.env.INDEX_FILE}\" `

	if (regex.test(cmd)) {
		return cmd.replace(regex, ifRib);
	}

	return cmd;
}

const init_spawn_config = (cmd: string, shell: ReturnType<typeof shellStatus>): { executable: string, processArgs: string[], useShell: boolean | string } =>
{

	let executable = cmd;
	let processArgs: string[] = [];
	let useShell: boolean | string = true;

	if (shell === 'powershell.exe') {
		executable = 'powershell.exe';

		// reject interaction and return error
		// prevent direct exit from system
		processArgs = ['-NonInteractive', '-NoProfile', '-Command', cmd];
		useShell = false;
	} else if (shell === '/bin/bash') {
		executable = '/bin/bash';
		processArgs = ['-c', cmd];
		useShell = false;
	}

	return {
		executable,
		processArgs,
		useShell
	};

}

// private
export const spawnChild = ({
	cmd,
	signal,
	pipe = false,
}: {
	cmd: string;
	signal?: AbortSignal;
	pipe?: boolean;
}) =>
{

	return new Promise(async (resolve, reject) =>
	{

		if (!await execution_guard(cmd)) {
			return reject(false);
		}

		// return msg if pipe
		let message: string | undefined;

		// kill child process
		const kill = (status: boolean) =>
		{
			child.kill();
			status ? resolve({
				state: true,
				message
			}) : reject({
				state: false,
				message
			})
		}

		const shell = shellStatus();

		const { executable, processArgs, useShell } = init_spawn_config(cmd, shell);

		const child = spawn(executable, processArgs, {
			shell: useShell,
			stdio: pipe ? 'pipe' : 'inherit',
			signal: signal,
			env: {
				...process.env,
				HLIN_MODE: 'interactive'
			}
		});

		// decode
		const toString = (data: Buffer) =>
		{
			return isWindows ? iconv.decode(data, 'utf8') : data.toString();
		}

		child.stdout?.on('data', (data) =>
		{
			message = (message || '') + toString(data);
		});

		child.stderr?.on('data', (data) =>
		{
			message = (message || '') + toString(data);
		});

		child.on('exit', (code) =>
		{
			code === 0 ? kill(true) : kill(false)
		});

		child.on('error', (err) =>
		{
			kill(false);
		});

	})
}

export const spawnAgent = (agentName: string) =>
{

	const interceptor = process.env.WHERE_EXE as string;

	const newEnv = {
		...process.env,
		HLIN_MODE: 'agent',
		SHELL: interceptor,
		COMSPEC: interceptor,
	}

	spawn(agentName, [], {
		detached: true,
		env: newEnv,
		stdio: 'inherit',
	})

}
