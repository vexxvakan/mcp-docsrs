import type { GetPromptResult } from "@modelcontextprotocol/sdk/types.js"

const createPromptResult = (text: string): GetPromptResult => ({
	messages: [
		{
			content: {
				text,
				type: "text"
			},
			role: "user"
		}
	]
})

const createTargetText = (target?: string) => (target ? ` for target ${target}` : "")

const createVersionText = (version?: string) => (version ? ` version ${version}` : "")

export { createPromptResult, createTargetText, createVersionText }
