import { describe, expect, test } from "bun:test"
import {
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
	ShutdownError,
	StartupError,
	TimeoutError,
	toAppError,
	tryAsync,
	trySync
} from "@mcp-docsrs/errors"
import { APP_NAME } from "../meta.ts"

const HTTP_NOT_FOUND = 404
const OK_VALUE = 42
const ASYNC_VALUE = 7
const TIMEOUT_MS = 1000

const withStderr = async (run: () => void | Promise<void>) => {
	const writes: string[] = []
	const originalWrite = process.stderr.write

	process.stderr.write = ((chunk: string | Uint8Array) => {
		writes.push(String(chunk))
		return true
	}) as typeof process.stderr.write

	try {
		await run()
	} finally {
		process.stderr.write = originalWrite
	}

	return writes.join("")
}

const withEnv = async <T>(
	values: Record<string, string | undefined>,
	run: () => T | Promise<T>
) => {
	const originals = Object.fromEntries(
		Object.keys(values).map((key) => [
			key,
			Bun.env[key]
		])
	) as Record<string, string | undefined>

	for (const [key, value] of Object.entries(values)) {
		if (value === undefined) {
			delete Bun.env[key]
			continue
		}

		Bun.env[key] = value
	}

	try {
		return await run()
	} finally {
		for (const [key, value] of Object.entries(originals)) {
			if (value === undefined) {
				delete Bun.env[key]
				continue
			}

			Bun.env[key] = value
		}
	}
}

describe("errors", () => {
	test("covers constructors and guards", () => {
		const parseError = new JsonParseError(new Error("bad json"), "https://docs.rs")
		const networkError = new NetworkError("https://docs.rs", HTTP_NOT_FOUND, "Not Found", "missing")
		const crateError = new CrateNotFoundError("serde", "1.0.0")
		const timeoutError = new TimeoutError("https://docs.rs", TIMEOUT_MS)
		const decompressionError = new DecompressionError("https://docs.rs", "zstd", "boom")
		const cacheError = new CacheError("set", "locked")
		const rustdocError = new RustdocParseError("bad item", "crate::Item")
		const itemError = new ItemNotFoundError("serde", "crate::Item")
		const startupError = new StartupError("start the server", new Error("connect failed"))
		const shutdownError = new ShutdownError("close the server", "close failed")

		expect(parseError.context?.url).toBe("https://docs.rs")
		expect(networkError.message).toContain("HTTP 404")
		expect(crateError.message).toContain("serde")
		expect(timeoutError.context?.timeoutMs).toBe(TIMEOUT_MS)
		expect(decompressionError.context?.encoding).toBe("zstd")
		expect(cacheError.context?.operation).toBe("set")
		expect(rustdocError.context?.itemPath).toBe("crate::Item")
		expect(itemError.context?.crateName).toBe("serde")
		expect(startupError.message).toContain("connect failed")
		expect(shutdownError.message).toContain("close failed")
		expect(isMcpDocsrsError(startupError)).toBe(true)
		expect(isMcpDocsrsError(new Error("plain"))).toBe(false)
		expect(isJsonParseError(parseError)).toBe(true)
		expect(isJsonParseError(networkError)).toBe(false)
		expect(isCrateNotFoundError(crateError)).toBe(true)
		expect(isCrateNotFoundError(timeoutError)).toBe(false)
		expect(
			toAppError({
				boom: true
			})
		).toBeInstanceOf(Error)
		expect(startupError).toBeInstanceOf(McpDocsrsError)
	})

	test("wraps sync and async failures into results", async () => {
		const okResult = trySync(
			() => OK_VALUE,
			(error) => new StartupError("sync", error)
		)
		const errResult = trySync(
			() => {
				throw new Error("sync failed")
			},
			(error) => new StartupError("sync", error)
		)
		const asyncOk = await tryAsync(
			async () => await Promise.resolve(ASYNC_VALUE),
			(error) => new ShutdownError("async", error)
		)
		const asyncErr = await tryAsync(
			async () => await Promise.reject(new Error("async failed")),
			(error) => new ShutdownError("async", error)
		)

		expect(okResult._unsafeUnwrap()).toBe(OK_VALUE)
		expect(errResult._unsafeUnwrapErr()).toBeInstanceOf(StartupError)
		expect(asyncOk._unsafeUnwrap()).toBe(ASYNC_VALUE)
		expect(asyncErr._unsafeUnwrapErr()).toBeInstanceOf(ShutdownError)
	})

	test("logs errors and honors test-mode suppression rules", async () => {
		const regularLog = await withEnv(
			Object.fromEntries([
				[
					"MCP_TEST",
					undefined
				],
				[
					"SILENT_LOGS",
					undefined
				]
			]) as Record<string, string | undefined>,
			() =>
				withStderr(() => {
					ErrorLogger.log(new Error("boom"))
				})
		)
		const crateLog = await withStderr(() => {
			ErrorLogger.log(new CrateNotFoundError("serde"))
		})

		expect(regularLog).toContain(APP_NAME)
		expect(regularLog).toContain("boom")
		expect(crateLog).toBe("")
	})

	test("logs info and warnings outside test mode", async () => {
		const env = Object.fromEntries([
			[
				"BUN_ENV",
				"development"
			],
			[
				"MCP_TEST",
				undefined
			],
			[
				"NODE_ENV",
				"development"
			],
			[
				"SILENT_LOGS",
				undefined
			]
		]) as Record<string, string | undefined>
		const output = await withEnv(env, () =>
			withStderr(() => {
				ErrorLogger.logInfo("info", {
					ok: true
				})
				ErrorLogger.logWarning("warn", {
					ok: false
				})
			})
		)

		expect(output).toContain("info")
		expect(output).toContain("Warning: warn")
	})
})
