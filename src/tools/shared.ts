import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { isCrateNotFoundError, isJsonParseError, isMcpDocsrsError } from "../errors.ts"

const createTextResult = (text: string): CallToolResult => ({
	content: [
		{
			text,
			type: "text"
		}
	]
})

const createErrorResult = (message: string): CallToolResult => ({
	...createTextResult(message),
	isError: true
})

const toErrorMessage = (error: unknown) => {
	if (isJsonParseError(error)) {
		return "Failed to parse JSON from docs.rs. The response may not be valid rustdoc JSON."
	}
	if (isCrateNotFoundError(error) || isMcpDocsrsError(error)) {
		return error.message
	}
	if (error instanceof Error) {
		return error.message
	}

	return "Unknown error occurred"
}

export { createErrorResult, createTextResult, toErrorMessage }
