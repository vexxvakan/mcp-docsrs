import { afterEach, describe, expect, test } from "bun:test"
import { parseCliFlags, readEnvConfig, renderHelp, resolveConfig, validateConfig } from "./index.ts"

const previousEnv = {
	bunEnv: Bun.env.BUN_ENV,
	cacheTtl: Bun.env.CACHE_TTL,
	dbPath: Bun.env.DB_PATH,
	maxCacheSize: Bun.env.MAX_CACHE_SIZE,
	requestTimeout: Bun.env.REQUEST_TIMEOUT
}

const restoreEnv = (key: keyof typeof previousEnv, name: string) => {
	const value = previousEnv[key]
	if (value === undefined) {
		Reflect.deleteProperty(Bun.env, name)
		return
	}

	Bun.env[name] = value
}

afterEach(() => {
	restoreEnv("bunEnv", "BUN_ENV")
	restoreEnv("cacheTtl", "CACHE_TTL")
	restoreEnv("dbPath", "DB_PATH")
	restoreEnv("maxCacheSize", "MAX_CACHE_SIZE")
	restoreEnv("requestTimeout", "REQUEST_TIMEOUT")
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
		Reflect.deleteProperty(Bun.env, "CACHE_TTL")
		Reflect.deleteProperty(Bun.env, "DB_PATH")
		Reflect.deleteProperty(Bun.env, "MAX_CACHE_SIZE")
		Reflect.deleteProperty(Bun.env, "REQUEST_TIMEOUT")

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
