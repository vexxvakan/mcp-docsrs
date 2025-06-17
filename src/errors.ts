/**
 * Custom error classes for the mcp-docsrs-rustdoc MCP server
 * All errors are fully typed with detailed context information
 */

/**
 * Base error class for all mcp-docsrs errors
 */
export abstract class MCPDocsRsError extends Error {
	readonly timestamp: Date
	readonly context?: Record<string, unknown>

	constructor(message: string, context?: Record<string, unknown>) {
		super(message)
		this.name = this.constructor.name
		this.timestamp = new Date()
		this.context = context
		Error.captureStackTrace(this, this.constructor)
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			timestamp: this.timestamp,
			context: this.context,
			stack: this.stack
		}
	}
}

/**
 * Error thrown when JSON parsing fails
 */
export class JSONParseError extends MCPDocsRsError {
	readonly rawData: string
	readonly parseError: Error

	constructor(rawData: string, parseError: Error, url?: string) {
		const preview = rawData.length > 200 ? `${rawData.substring(0, 200)}...` : rawData
		const message = `Failed to parse JSON: ${parseError.message}`

		super(message, {
			url,
			dataLength: rawData.length,
			dataPreview: preview,
			contentType: typeof rawData,
			parseErrorName: parseError.name
		})

		this.rawData = rawData
		this.parseError = parseError
	}
}

/**
 * Error thrown when network requests fail
 */
export class NetworkError extends MCPDocsRsError {
	readonly statusCode?: number
	readonly statusText?: string
	readonly url: string

	constructor(url: string, statusCode?: number, statusText?: string, details?: string) {
		const message = statusCode
			? `Network request failed: HTTP ${statusCode} ${statusText || ""}${details ? ` - ${details}` : ""}`
			: `Network request failed: ${details || "Unknown error"}`

		super(message, {
			url,
			statusCode,
			statusText,
			details
		})

		this.url = url
		this.statusCode = statusCode
		this.statusText = statusText
	}
}

/**
 * Error thrown when a crate is not found
 */
export class CrateNotFoundError extends MCPDocsRsError {
	readonly crateName: string
	readonly version?: string

	constructor(crateName: string, version?: string, details?: string) {
		const versionStr = version ? ` version ${version}` : ""
		const message = `Crate '${crateName}'${versionStr} not found. ${details || "Note: docs.rs started building rustdoc JSON on 2023-05-23, so older releases may not have JSON available yet."}`

		super(message, {
			crateName,
			version,
			details
		})

		this.crateName = crateName
		this.version = version
	}
}

/**
 * Error thrown when rustdoc JSON is not available
 */
export class RustdocNotAvailableError extends MCPDocsRsError {
	readonly crateName: string
	readonly version?: string
	readonly reason?: string

	constructor(crateName: string, version?: string, reason?: string) {
		const versionStr = version ? ` version ${version}` : ""
		const message = `Rustdoc JSON not available for crate '${crateName}'${versionStr}. ${reason || "The crate may not have been built with rustdoc JSON support."}`

		super(message, {
			crateName,
			version,
			reason
		})

		this.crateName = crateName
		this.version = version
		this.reason = reason
	}
}

/**
 * Error thrown when request times out
 */
export class TimeoutError extends MCPDocsRsError {
	readonly url: string
	readonly timeoutMs: number

	constructor(url: string, timeoutMs: number) {
		const message = `Request timeout after ${timeoutMs}ms`

		super(message, {
			url,
			timeoutMs
		})

		this.url = url
		this.timeoutMs = timeoutMs
	}
}

/**
 * Error thrown when decompression fails
 */
export class DecompressionError extends MCPDocsRsError {
	readonly encoding: string
	readonly url: string

	constructor(url: string, encoding: string, details?: string) {
		const message = `Failed to decompress ${encoding} content: ${details || "Unknown error"}`

		super(message, {
			url,
			encoding,
			details
		})

		this.url = url
		this.encoding = encoding
	}
}

/**
 * Error thrown when cache operations fail
 */
export class CacheError extends MCPDocsRsError {
	readonly operation: "get" | "set" | "delete" | "clear" | "close"

	constructor(operation: "get" | "set" | "delete" | "clear" | "close", details?: string) {
		const message = `Cache operation '${operation}' failed: ${details || "Unknown error"}`

		super(message, {
			operation,
			details
		})

		this.operation = operation
	}
}

/**
 * Error thrown when parsing rustdoc data structures fails
 */
export class RustdocParseError extends MCPDocsRsError {
	readonly itemPath?: string
	readonly expectedType?: string

	constructor(message: string, itemPath?: string, expectedType?: string) {
		super(message, {
			itemPath,
			expectedType
		})

		this.itemPath = itemPath
		this.expectedType = expectedType
	}
}

/**
 * Error thrown when an item is not found in rustdoc
 */
export class ItemNotFoundError extends MCPDocsRsError {
	readonly crateName: string
	readonly itemPath: string

	constructor(crateName: string, itemPath: string) {
		const message = `Item '${itemPath}' not found in crate '${crateName}'`

		super(message, {
			crateName,
			itemPath
		})

		this.crateName = crateName
		this.itemPath = itemPath
	}
}

/**
 * Error logger utility functions
 */
const formatError = (error: Error): string => {
	if (error instanceof MCPDocsRsError) {
		const lines = [`[${error.timestamp.toISOString()}] ${error.name}: ${error.message}`]

		if (error.context && Object.keys(error.context).length > 0) {
			lines.push("Context:")
			for (const [key, value] of Object.entries(error.context)) {
				lines.push(`  ${key}: ${JSON.stringify(value)}`)
			}
		}

		if (error.stack) {
			lines.push("Stack trace:")
			lines.push(error.stack)
		}

		return lines.join("\n")
	}

	return `[${new Date().toISOString()}] ${error.name || "Error"}: ${error.message}\n${error.stack || ""}`
}

export const ErrorLogger = {
	log(error: Error): void {
		// During tests, check if this is an expected error
		if (process.env.NODE_ENV === "test" || process.env.BUN_ENV === "test") {
			// In test environment, use a different format for expected errors
			if (
				error instanceof CrateNotFoundError ||
				error instanceof TimeoutError ||
				error instanceof RustdocParseError ||
				error.name === "AbortError" || // For timeout tests
				error.message === "Test interception" // For URL validation tests
			) {
				// Show a brief indicator that the expected error was caught
				if (process.env.LOG_EXPECTED_ERRORS === "true") {
					// Full logging if explicitly requested
					console.log(`\x1b[32m[EXPECTED ERROR] ${error.name}: ${error.message}\x1b[0m`)
				} else {
					// Brief indicator in green to show test is working correctly
					console.log(`\x1b[32m✓ Expected ${error.name} thrown\x1b[0m`)
				}
				return
			}
		}
		console.error(formatError(error))
	},

	logWarning(message: string, context?: Record<string, unknown>): void {
		const timestamp = new Date().toISOString()
		const contextStr = context ? ` - Context: ${JSON.stringify(context)}` : ""
		console.warn(`[${timestamp}] WARNING: ${message}${contextStr}`)
	},

	logInfo(message: string, context?: Record<string, unknown>): void {
		const timestamp = new Date().toISOString()
		const contextStr = context ? ` - Context: ${JSON.stringify(context)}` : ""
		console.info(`[${timestamp}] INFO: ${message}${contextStr}`)
	}
}

/**
 * Type guard to check if an error is an MCPDocsRsError
 */
export function isMCPDocsRsError(error: unknown): error is MCPDocsRsError {
	return error instanceof MCPDocsRsError
}

/**
 * Type guard for specific error types
 */
export function isNetworkError(error: unknown): error is NetworkError {
	return error instanceof NetworkError
}

export function isJSONParseError(error: unknown): error is JSONParseError {
	return error instanceof JSONParseError
}

export function isCrateNotFoundError(error: unknown): error is CrateNotFoundError {
	return error instanceof CrateNotFoundError
}

export function isTimeoutError(error: unknown): error is TimeoutError {
	return error instanceof TimeoutError
}
