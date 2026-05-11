import { type t_suggestion } from "../interface.ts"
import fs from 'fs-extra'
import ux from "./user_experience.ts"

export const saveIntoFile = ({
	path,
	data
}: {
	path: string,
	data: t_suggestion
}) => {
	fs.writeJSONSync(path, data, {spaces: 2})
	ux.historyManager.saveIntoFile()
}