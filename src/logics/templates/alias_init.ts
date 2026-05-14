import type { CommandObject } from "./interface.ts";

export const system_init: Record<string, CommandObject> = {

	gac: {
		id: "SYS000",
		time: "1955-02-24T00:00:00",
		desc: "Stage all changes and create a commit with the given message.",
		cmd: "git add . ; git commit -m <T: string>",
	},

	clean: {
		id: "SYS001",
		time: "1955-02-24T00:00:00",
		desc: "Remove all cached files, re-add everything, then commit with message.",
		cmd: "git rm -r --cached . ; git add . ; git commit -am <T: string>",
	},

	gcb: {
		id: "SYS002",
		time: "1955-02-24T00:00:00",
		desc: "Create a new git branch and immediately switch to it.",
		cmd: "git checkout -b <T: string>",
	},

	gbdel: {
		id: "SYS003",
		time: "1955-02-24T00:00:00",
		desc: "Delete a local branch that has been fully merged into upstream.",
		cmd: "git branch -d <T: string>",
	},

	glog: {
		id: "SYS004",
		time: "1955-02-24T00:00:00",
		desc: "Display the recent commits in a compact one-line format.",
		cmd: "git log --oneline",
	},

	gpf: {
		id: "SYS005",
		time: "1955-02-24 00:00:00",
		desc: "Force push current branch to remote origin. Use with caution.",
		cmd: "git push --force origin <T: string>",
	},

	grepfind: {
		id: "SYS006",
		time: "1955-02-24 00:00:00",
		desc: "Recursively search for a given string in files, showing line numbers.",
		cmd: "grep -rn <T: string> .",
	},

	biggest: {
		id: "SYS007",
		time: "1955-02-24 00:00:00",
		desc: "List the top N largest items in current directory sorted by size (human readable).",
		cmd: "du -ah . | sort -rh | head -n <T: number>",
	},

	killport: {
		id: "SYS008",
		time: "1955-02-24 00:00:00",
		desc: "Find and forcefully terminate the process listening on the specified port.",
		cmd: "lsof -ti :<T: number> | xargs kill -9",
	},

	backup: {
		id: "SYS009",
		time: "1955-02-24 00:00:00",
		desc: "Create a .tar.gz archive of current directory with a timestamp in the name.",
		cmd: "tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz .",
	},

	renamepre: {
		id: "SYS010",
		time: "1955-02-24 00:00:00",
		desc: "Add a specified prefix to all files matching a given pattern.",
		cmd: "for f in <T: string>; do mv \"$f\" \"<T: string>_$f\"; done",
	},

	vid2gif: {
		id: "SYS011",
		time: "1955-02-24 00:00:00",
		desc: "Convert a video file to high-quality GIF using ffmpeg with palette optimization.",
		cmd: "ffmpeg -i <T: string> -vf \"fps=10,scale=640:-1:flags=lanczos,palettegen\" -y palette.png ; ffmpeg -i <T: string> -i palette.png -filter_complex \"fps=10,scale=640:-1[x];[x][1:v]paletteuse\" -y output.gif ; rm palette.png",
	},

	sshexec: {
		id: "SYS012",
		time: "1955-02-24 00:00:00",
		desc: "Execute a command on a remote host via SSH without opening a full shell.",
		cmd: "ssh <T: string> '<T: string>'",
	},

	serve: {
		id: "SYS013",
		time: "1955-02-24 00:00:00",
		desc: "Start a Python HTTP server on the specified port to serve current directory.",
		cmd: "python3 -m http.server <T: number>",
	},

	chmodr: {
		id: "SYS014",
		time: "1955-02-24 00:00:00",
		desc: "Change permissions recursively for a given path, asking for confirmation first.",
		cmd: "chmod -R <T: string> <T: string>",
	},

	rgs: {
		id: "SYS015",
		time: "1955-02-24 00:00:00",
		desc: "Search for a given string in files, showing line numbers.",
		cmd: "rg -t <T: string> <T: string>",
	},

	pack: {
		id: "SYS016",
		time: "1955-02-24 00:00:00",
		desc: "Search for a given string in files, showing line numbers.",
		cmd: "bun build --compile ./launcher.ts --bundle --outfile=./.ribbon/launcher.exe && bun build --target=bun --compile --bundle --target=bun ./src/logics/index.ts --outfile=./.ribbon/ribbon.exe && mkdir \"./.ribbon/commands/\" -Force && copy \"./commands\" \"./.ribbon/commands/\"",
	},
	"zip": {
		"id": "SYS016",
		"time": "1955-02-24 00:00:00",
		"desc": "Search for a given string in files, showing line numbers.",
		"cmd": "Compress-Archive -Path \"./.ribbon\" -DestinationPath \"./ribbon.zip\" -Force",
	}

};