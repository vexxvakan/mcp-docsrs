import type { CliFlags, ServerConfig, ServerConfigInput } from "./types.ts"

const MILLISECONDS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const DEFAULT_REQUEST_TIMEOUT_SECONDS = 30
const CACHE_TTL_DEFAULT_MS = SECONDS_PER_MINUTE * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND
const MAX_CACHE_SIZE_DEFAULT = 100
const REQUEST_TIMEOUT_DEFAULT_MS = DEFAULT_REQUEST_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND
const USER_ARG_OFFSET = 2
const VERSION_FLAGS = new Set([
	"--version",
	"-v"
])
const HELP_FLAGS = new Set([
	"--help",
	"-h"
])

const readNumber = (value: string | undefined) => {
	if (!value) {
		return
	}

	const parsed = Number.parseInt(value, 10)
	return Number.isNaN(parsed) ? undefined : parsed
}

const getArgValue = (args: string[], name: string) => {
	for (const arg of args) {
		if (arg.startsWith(`${name}=`)) {
			return arg.slice(name.length + 1)
		}
	}

	const index = args.indexOf(name)
	if (index < 0) {
		return
	}

	return args[index + 1]
}

const ensurePositive = (value: number | undefined, name: string) => {
	if (!value || value <= 0) {
		throw new Error(`${name} must be a positive integer`)
	}

	return value
}

const resolveConfig = (input: ServerConfigInput = {}): ServerConfig => ({
	cacheTtl: input.cacheTtl ?? CACHE_TTL_DEFAULT_MS,
	dbPath: input.dbPath,
	maxCacheSize: input.maxCacheSize ?? MAX_CACHE_SIZE_DEFAULT,
	requestTimeout: input.requestTimeout ?? REQUEST_TIMEOUT_DEFAULT_MS
})

const readEnvConfig = (): ServerConfigInput => ({
	cacheTtl: readNumber(Bun.env.CACHE_TTL),
	dbPath: Bun.env.DB_PATH,
	maxCacheSize: readNumber(Bun.env.MAX_CACHE_SIZE),
	requestTimeout: readNumber(Bun.env.REQUEST_TIMEOUT)
})

const parseCliFlags = (args = Bun.argv.slice(USER_ARG_OFFSET)): CliFlags => ({
	overrides: {
		cacheTtl: readNumber(getArgValue(args, "--cache-ttl")),
		dbPath: getArgValue(args, "--db-path"),
		maxCacheSize: readNumber(getArgValue(args, "--max-cache-size")),
		requestTimeout: readNumber(getArgValue(args, "--request-timeout"))
	},
	showHelp: args.some((arg) => HELP_FLAGS.has(arg)),
	showVersion: args.some((arg) => VERSION_FLAGS.has(arg))
})

const validateConfig = (config: ServerConfig) => ({
	cacheTtl: ensurePositive(config.cacheTtl, "cacheTtl"),
	dbPath: config.dbPath,
	maxCacheSize: ensurePositive(config.maxCacheSize, "maxCacheSize"),
	requestTimeout: ensurePositive(config.requestTimeout, "requestTimeout")
})

const renderHelp = () =>
	`
Usage: mcp-docsrs [options]

Options:
  --cache-ttl <ms>        Cache TTL in milliseconds
  --max-cache-size <n>    Maximum cache entries
  --request-timeout <ms>  Request timeout in milliseconds
  --db-path <path>        Cache database path or directory
  --help, -h              Show help
  --version, -v           Show version
`.trim()

export { parseCliFlags, readEnvConfig, renderHelp, resolveConfig, validateConfig }
