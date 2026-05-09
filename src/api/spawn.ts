import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { EventEmitter } from 'events';
import iconv from 'iconv-lite';
import { rib_conf } from "../logics/manage.ts";
import { execution_guard } from "../logics/utils/executions/execution_guard.ts";

const isWindows = process.platform === 'win32';

const shellStatus = () => {
    const isEnabled = rib_conf.all('config').settings.useShell;
    if (isEnabled) {
        return isWindows ? 'powershell.exe' : '/bin/bash';
    }
    return true;
}


export class Spawn {

    public emit = new EventEmitter();

    public child: ChildProcess | null = null;

    public kill = () => {
        this.child?.kill();
    }

    private showInConsole: boolean;

    constructor(showInConsole: boolean = true) {
        this.showInConsole = showInConsole;
    }

    public spawn = (cmd: string) => {

        return new Promise(async (resolve, reject) => {

            this.child = spawn(cmd, {
                shell: shellStatus(),
                stdio: 'pipe',
            });

            const toString = (data: Buffer) => {
                return isWindows ? iconv.decode(data, 'gbk') : data.toString();
            }

            this.child.stdout?.on('data', (data) => {

                data = toString(data);

                if (this.showInConsole) {
                    process.stdout.write(data);
                }

                this.emit.emit('stdout', data);
            });

            this.child.stderr?.on('data', (data) => {

                data = toString(data);

                if (this.showInConsole) {
                    process.stderr.write(data);
                }

                this.emit.emit('stderr', data);
            });

            this.child.on('exit', (code) => {
                this.emit.emit('exit', code);
                resolve(code)
            });

            this.child.on('error', (err) => {
                resolve(1)
            });

        })

    }

}

export const isRibCmd = (cmd: string) => {

    const regex = /(?:^|\s)\brib\b(?:\s|$)/g

    const ifRib = process.env.INDEX_FILE?.endsWith('.exe') ? `"${process.env.INDEX_FILE}" ` : `bun run \"${process.env.INDEX_FILE}\" `

    if (regex.test(cmd)) {
        return cmd.replace(regex, ifRib);
    }

    return cmd;
}

// private

export const spawnChild = ({
    cmd,
    signal,
    pipe = false
}: {
    cmd: string;
    signal?: AbortSignal;
    pipe?: boolean;
}) => {

    return new Promise(async (resolve, reject) => {

        // return msg if pipe
        let message: string | undefined;

        // kill child process
        const kill = (status: boolean) => {
            child.kill();
            status ? resolve({
                status: true,
                message
            }) : reject({
                status: false,
                message
            })
        }

        if (!await execution_guard(cmd)) {
            return reject(false);
        }

        const shell = shellStatus();

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

        const child = spawn(executable, processArgs, {
            shell: useShell,
            stdio: pipe ? 'pipe' : 'inherit',
            signal: signal
        });

        // decode
        const toString = (data: Buffer) => {
            return isWindows ? iconv.decode(data, 'utf8') : data.toString();
        }

        child.stdout?.on('data', (data) => {
            message = (message || '') + toString(data);
        });

        child.stderr?.on('data', (data) => {
            message = (message || '') + toString(data);
        });

        child.on('exit', (code) => {
            code === 0 ? kill(true) : kill(false)
        });

        child.on('error', (err) => {
            kill(false);
        });

    })
}
