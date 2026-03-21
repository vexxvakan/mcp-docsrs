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

export { createPromptResult }
