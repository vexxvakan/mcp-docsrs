#!/usr/bin/env bun

console.log("=== Debug Arguments ===")
console.log("process.argv:", process.argv)
console.log("process.argv.slice(2):", process.argv.slice(2))
console.log("\n=== Environment Variables ===")
console.log("CACHE_TTL:", process.env.CACHE_TTL)
console.log("MAX_CACHE_SIZE:", process.env.MAX_CACHE_SIZE)
console.log("REQUEST_TIMEOUT:", process.env.REQUEST_TIMEOUT)
console.log("DB_PATH:", process.env.DB_PATH)

// Test the getArgValue function
const args = process.argv.slice(2)
const getArgValue = (argName: string): string | undefined => {
	const index = args.findIndex((arg) => arg === argName)
	if (index !== -1 && index + 1 < args.length) {
		return args[index + 1]
	}
	return undefined
}

console.log("\n=== Parsed Arguments ===")
console.log("--cache-ttl:", getArgValue("--cache-ttl"))
console.log("--max-cache-size:", getArgValue("--max-cache-size"))
console.log("--request-timeout:", getArgValue("--request-timeout"))
console.log("--db-path:", getArgValue("--db-path"))

// Show the final config that would be created
const cacheTtl = Number.parseInt(getArgValue("--cache-ttl") || process.env.CACHE_TTL || "3600000")
const maxCacheSize = Number.parseInt(
	getArgValue("--max-cache-size") || process.env.MAX_CACHE_SIZE || "100"
)
const requestTimeout = Number.parseInt(
	getArgValue("--request-timeout") || process.env.REQUEST_TIMEOUT || "30000"
)
const dbPath = getArgValue("--db-path") || process.env.DB_PATH

console.log("\n=== Final Config ===")
console.log({
	cacheTtl,
	maxCacheSize,
	requestTimeout,
	dbPath
})