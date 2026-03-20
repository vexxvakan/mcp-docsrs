import { inspect } from "node:util"
import { APP_NAME } from "./meta.ts"

const ERROR_PREVIEW_LENGTH = 200
const TEST_ENV = "test"
const TRUE_VALUE = "true"

const isTestEnv = () => Bun.env.NODE_ENV === TEST_ENV || Bun.env.BUN_ENV === TEST_ENV

const isSilent = () => Bun.env.SILENT_LOGS === TRUE_VALUE || Bun.env.MCP_TEST === TRUE_VALUE

const toError = (error: unknown): Error => {
	if (error instanceof Error) {
		return error
	}

	return new Error(typeof error === "string" ? error : inspect(error))
}

const trimPreview = (value: string) => {
	if (value.length <= ERROR_PREVIEW_LENGTH) {
		return value
	}

	return `${value.slice(0, ERROR_PREVIEW_LENGTH)}...`
}

const formatContext = (context: Record<string, unknown> | undefined) => {
	if (!context || Object.keys(context).length === 0) {
		return ""
	}

	return ` ${JSON.stringify(context)}`
}

class McpDocsrsError extends Error {
	readonly context: Record<string, unknown> | undefined
	readonly timestamp: Date

	constructor(message: string, context?: Record<string, unknown>) {
		super(message)
		this.context = context
		this.name = new.target.name
		this.timestamp = new Date()
	}
}

class JsonParseError extends McpDocsrsError {
	constructor(rawData: string, parseError: Error, url?: string) {
		super(`Failed to parse JSON: ${parseError.message}`, {
			contentType: typeof rawData,
			dataLength: rawData.length,
			dataPreview: trimPreview(rawData),
			parseErrorName: parseError.name,
			url
		})
	}
}

class NetworkError extends McpDocsrsError {
	constructor(url: string, statusCode?: number, statusText?: string, details?: string) {
		super(
			statusCode
				? `Network request failed: HTTP ${statusCode} ${statusText ?? ""}${details ? ` - ${details}` : ""}`
				: `Network request failed: ${details ?? "Unknown error"}`,
			{
				details,
				statusCode,
				statusText,
				url
			}
		)
	}
}

class CrateNotFoundError extends McpDocsrsError {
	constructor(crateName: string, version?: string) {
		super(
			`Crate '${crateName}'${version ? ` version ${version}` : ""} not found. Note: docs.rs started building rustdoc JSON on 2023-05-23, so older releases may not have JSON available yet.`,
			{
				crateName,
				version
			}
		)
	}
}

class TimeoutError extends McpDocsrsError {
	constructor(url: string, timeoutMs: number) {
		super(`Request timeout after ${timeoutMs}ms`, {
			timeoutMs,
			url
		})
	}
}

class DecompressionError extends McpDocsrsError {
	constructor(url: string, encoding: string, details?: string) {
		super(`Failed to decompress ${encoding} content: ${details ?? "Unknown error"}`, {
			details,
			encoding,
			url
		})
	}
}

class CacheError extends McpDocsrsError {
	constructor(operation: string, details?: string) {
		super(`Cache operation '${operation}' failed: ${details ?? "Unknown error"}`, {
			details,
			operation
		})
	}
}

class RustdocParseError extends McpDocsrsError {
	constructor(message: string, itemPath?: string) {
		super(message, {
			itemPath
		})
	}
}

class ItemNotFoundError extends McpDocsrsError {
	constructor(crateName: string, itemPath: string) {
		super(`Item '${itemPath}' not found in crate '${crateName}'`, {
			crateName,
			itemPath
		})
	}
}

const ErrorLogger = {
	log(error: unknown) {
		if (isSilent()) {
			return
		}

		const resolved = toError(error)
		const context = resolved instanceof McpDocsrsError ? formatContext(resolved.context) : ""
		if (isTestEnv() && resolved instanceof CrateNotFoundError) {
			return
		}

		process.stderr.write(`[${APP_NAME}] ${resolved.name}: ${resolved.message}${context}\n`)
	},

	logInfo(message: string, context?: Record<string, unknown>) {
		if (isSilent() || isTestEnv()) {
			return
		}

		process.stderr.write(`[${APP_NAME}] ${message}${formatContext(context)}\n`)
	}
}

const isMcpDocsrsError = (error: unknown): error is McpDocsrsError =>
	error instanceof McpDocsrsError

const isJsonParseError = (error: unknown): error is JsonParseError =>
	error instanceof JsonParseError

const isCrateNotFoundError = (error: unknown): error is CrateNotFoundError =>
	error instanceof CrateNotFoundError

export {
	CacheError,
	CrateNotFoundError,
	DecompressionError,
	ErrorLogger,
	ItemNotFoundError,
	isCrateNotFoundError,
	isJsonParseError,
	isMcpDocsrsError,
	JsonParseError,
	McpDocsrsError,
	NetworkError,
	RustdocParseError,
	TimeoutError
}
