import { afterEach, describe, expect, test } from "bun:test"
import { parseCliFlags, readEnvConfig, renderHelp, resolveConfig, validateConfig } from "./index.ts"

const previousEnv = {
	BUN_ENV: Bun.env.BUN_ENV,
	CACHE_TTL: Bun.env.CACHE_TTL,
	DB_PATH: Bun.env.DB_PATH,
	MAX_CACHE_SIZE: Bun.env.MAX_CACHE_SIZE,
	REQUEST_TIMEOUT: Bun.env.REQUEST_TIMEOUT
}

afterEach(() => {
	if (previousEnv.BUN_ENV === undefined) {
		delete Bun.env.BUN_ENV
	} else {
		Bun.env.BUN_ENV = previousEnv.BUN_ENV
	}
	if (previousEnv.CACHE_TTL === undefined) {
		delete Bun.env.CACHE_TTL
	} else {
		Bun.env.CACHE_TTL = previousEnv.CACHE_TTL
	}
	if (previousEnv.DB_PATH === undefined) {
		delete Bun.env.DB_PATH
	} else {
		Bun.env.DB_PATH = previousEnv.DB_PATH
	}
	if (previousEnv.MAX_CACHE_SIZE === undefined) {
		delete Bun.env.MAX_CACHE_SIZE
	} else {
		Bun.env.MAX_CACHE_SIZE = previousEnv.MAX_CACHE_SIZE
	}
	if (previousEnv.REQUEST_TIMEOUT === undefined) {
		delete Bun.env.REQUEST_TIMEOUT
	} else {
		Bun.env.REQUEST_TIMEOUT = previousEnv.REQUEST_TIMEOUT
	}
})

describe("config helpers", () => {
	test("parses CLI flags in both inline and positional forms", () => {
		const flags = parseCliFlags([
			"--cache-ttl=1500",
			"--db-path",
			"cache.sqlite",
			"--max-cache-size=25"
		])

		expect(flags).toEqual({
			overrides: {
				cacheTtl: 1500,
				dbPath: "cache.sqlite",
				maxCacheSize: 25,
				requestTimeout: undefined
			},
			showHelp: false,
			showVersion: false
		})
	})

	test("parses short flags and missing values without crashing", () => {
		const flags = parseCliFlags([
			"-h",
			"-v",
			"--cache-ttl=abc",
			"--db-path"
		])

		expect(flags).toEqual({
			overrides: {
				cacheTtl: undefined,
				dbPath: undefined,
				maxCacheSize: undefined,
				requestTimeout: undefined
			},
			showHelp: true,
			showVersion: true
		})
	})

	test("reads configuration from Bun env", () => {
		Bun.env.CACHE_TTL = "9000"
		Bun.env.DB_PATH = "env-cache.sqlite"
		Bun.env.MAX_CACHE_SIZE = "12"
		Bun.env.REQUEST_TIMEOUT = "33"

		expect(readEnvConfig()).toEqual({
			cacheTtl: 9000,
			dbPath: "env-cache.sqlite",
			maxCacheSize: 12,
			requestTimeout: 33
		})
	})

	test("resolves defaults and validates positive config", () => {
		expect(resolveConfig()).toEqual({
			cacheTtl: 3_600_000,
			dbPath: undefined,
			maxCacheSize: 100,
			requestTimeout: 30_000
		})
		expect(
			validateConfig({
				cacheTtl: 1,
				dbPath: "cache.db",
				maxCacheSize: 2,
				requestTimeout: 3
			})
		).toEqual({
			cacheTtl: 1,
			dbPath: "cache.db",
			maxCacheSize: 2,
			requestTimeout: 3
		})
		expect(renderHelp()).toContain("Usage: mcp-docsrs [options]")
	})

	test("reads empty env config as undefined overrides", () => {
		delete Bun.env.CACHE_TTL
		delete Bun.env.DB_PATH
		delete Bun.env.MAX_CACHE_SIZE
		delete Bun.env.REQUEST_TIMEOUT

		expect(readEnvConfig()).toEqual({
			cacheTtl: undefined,
			dbPath: undefined,
			maxCacheSize: undefined,
			requestTimeout: undefined
		})
	})

	test("rejects non-positive config values", () => {
		expect(() =>
			validateConfig({
				cacheTtl: 0,
				dbPath: undefined,
				maxCacheSize: 1,
				requestTimeout: 1
			})
		).toThrow("cacheTtl must be a positive integer")
	})
})
