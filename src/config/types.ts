type ServerConfig = {
	cacheTtl: number
	dbPath: string | undefined
	maxCacheSize: number
	requestTimeout: number
}

type ServerConfigInput = Partial<ServerConfig>

type CliFlags = {
	overrides: ServerConfigInput
	showHelp: boolean
	showVersion: boolean
}

export type { CliFlags, ServerConfig, ServerConfigInput }
