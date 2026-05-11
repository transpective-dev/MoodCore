import fs from 'fs-extra'
import { history as historySchema, type t_history } from '../interface.ts';
import _path from '../../src/logics/path.ts';

import backlander from '../../src/background_console/index.ts'
import { any } from 'zod';
const bc = await backlander.backlander({ dispose: 'auto' })

class ManageHistory
{

	public history: t_history = []

	constructor()
	{

		try {

			const temp = fs.readJSONSync(_path.paths.history);


			((data = temp) =>
			{
				const safeParsed = historySchema.safeParse(data)

				if (safeParsed.success) {
					bc.log('validation passed')
					return this.history = safeParsed.data
				}

				return this.history = []

			})()

			this.sort()

			this.index = this.history.length

		} catch (error: any) {
			this.history = []
			bc.log('failed', error as string)
		}

	}

	private maxLength = 30;

	private index: number = 0;

	private getCurrent()
	{

		return this.history[this.index]

	}

	private savingBuffer: t_history[number] | null = null;

	private sort()
	{
		this.history = this.history.sort((a, b) => b.time - a.time)
	}

	private conditionCheck(): 'less' | 'much' | 'fine' | null
	{

		// return null, for lastIdx + 1 is the working line but history
		if ([this.history.length, this.maxLength].includes(this.index)) {
			return null
		}

		// handling the case of falling below 0
		if (this.index < 0) {
			this.index = 0
			return 'less'
		}

		// handling the case of exceeding max storable history length
		if (this.index >= this.maxLength) {
			this.index = this.maxLength
			return 'much'
		}

		// handling the case of exceeding current history length
		if (this.index >= this.history.length) {
			this.index = this.history.length
			return 'much'
		}

		return 'fine'

	}

	private changeIndex(status: 'u' | 'd')
	{

		switch (status) {
			case 'u': {
				this.index++
				break;
			}

			case 'd': {
				this.index--
				break;
			}
		}

		const res = this.conditionCheck()

		if (res === null) {
			return this.savingBuffer
		}

		return this.getCurrent()

	}

	// use when executed command
	public add(command: string)
	{

		if (command.length <= 0) {
			return
		}

		if (this.history.length <= this.maxLength) {

			this.history.push({
				cmd: command,
				time: Date.now()
			})

		} else {

			this.history.shift()
			this.history.push({
				cmd: command,
				time: Date.now()
			})

		}

		this.sort()

		bc.log(JSON.stringify(this.history), command)

	}

	public detector(key: string, cmd: string): string | undefined
	{

		if (this.index === this.history.length) {
			this.savingBuffer = { cmd, time: Date.now() }
		}

		if (key === '\x1b[A') {
			const res = this.changeIndex('d')?.cmd
			bc.log(this.index, res, this.savingBuffer)
			return  res
		}
		
		if (key === '\x1b[B') {
			const res = this.changeIndex('u')?.cmd
			bc.log(this.index, res, this.savingBuffer)
			return res
		}

	}

	public saveIntoFile()
	{
		fs.writeJSONSync(_path.paths.history, this.history, { spaces: 2 })
	}

}

const historyManager = new ManageHistory()

export default {
	historyManager
}