import { decompress } from "fzstd"
import { createCache } from "./cache.js"
import {
	CrateNotFoundError,
	DecompressionError,
	ErrorLogger,
	JSONParseError,
	NetworkError,
	TimeoutError
} from "./errors.js"
import type { ServerConfig } from "./types.js"

// Build the docs.rs JSON URL for a crate
const buildJsonUrl = (
	crateName: string,
	version?: string,
	target?: string,
	formatVersion?: number
): string => {
	let url = `https://docs.rs/crate/${crateName}`

	// Add version (latest by default)
	url += `/${version || "latest"}`

	// Add target if specified
	if (target) {
		url += `/${target}`
	}

	// Add JSON endpoint
	url += "/json"

	// Add format version if specified
	if (formatVersion) {
		url += `/${formatVersion}`
	}

	return url
}

// Create a docs fetcher with caching
export const createDocsFetcher = (config: ServerConfig = {}) => {
	const cache = createCache<any>(config.maxCacheSize || 100, config.dbPath)
	const timeout = config.requestTimeout || 30000
	const cacheTtl = config.cacheTtl || 3600000 // 1 hour default

	// Fetch rustdoc JSON for a crate with cache status
	const fetchCrateJsonWithStatus = async (
		crateName: string,
		version?: string,
		target?: string,
		formatVersion?: number
	): Promise<{ data: any; fromCache: boolean }> => {
		const url = buildJsonUrl(crateName, version, target, formatVersion)
		const cacheKey = url

		// Check cache first
		const { data: cached } = cache.getWithMetadata(cacheKey)
		if (cached) {
			ErrorLogger.logInfo("Cache hit for rustdoc JSON", { url, crateName })
			return { data: cached, fromCache: true }
		}

		ErrorLogger.logInfo("Fetching rustdoc JSON", {
			url,
			crateName,
			version,
			target,
			formatVersion
		})

		try {
			// Use Bun's native fetch with AbortController for timeout
			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), timeout)

			// Note: We remove zstd from Accept-Encoding because docs.rs always serves with zstd
			// and we need to handle decompression manually
			const response = await fetch(url, {
				signal: controller.signal,
				headers: {
					"User-Agent": "mcp-docsrs/1.0.0",
					"Accept-Encoding": "gzip, deflate, br"
				}
			})

			clearTimeout(timeoutId)

			if (response.status === 404) {
				throw new CrateNotFoundError(crateName, version)
			}

			if (!response.ok) {
				throw new NetworkError(url, response.status, response.statusText)
			}

			// Check if response needs manual decompression (shouldn't be needed with Bun's auto-decompression)
			const encoding = response.headers.get("content-encoding")
			const contentType = response.headers.get("content-type")
			let data: any

			ErrorLogger.logInfo("Response received", {
				url,
				status: response.status,
				contentType,
				encoding
			})

			if (encoding === "zstd" || encoding === "Zstd") {
				try {
					// docs.rs always serves rustdoc JSON with zstd compression
					const buffer = await response.arrayBuffer()
					ErrorLogger.logInfo("Decompressing zstd content", {
						url,
						bufferSize: buffer.byteLength
					})

					// Use fzstd which handles memory allocation better than other libraries
					// fzstd reads frame headers to determine memory requirements
					const decompressed = decompress(new Uint8Array(buffer))
					const jsonText = new TextDecoder().decode(decompressed)

					ErrorLogger.logInfo("Decompression successful", {
						url,
						decompressedSize: jsonText.length
					})

					try {
						data = JSON.parse(jsonText)
					} catch (parseError) {
						throw new JSONParseError(jsonText, parseError as Error, url)
					}
				} catch (error) {
					if (error instanceof JSONParseError) {
						throw error
					}
					throw new DecompressionError(url, "zstd", (error as Error).message)
				}
			} else {
				// Normal JSON response (Bun handles decompression automatically)
				try {
					// First get the response as text to have better error reporting
					const responseText = await response.text()

					if (!responseText || responseText.trim().length === 0) {
						throw new JSONParseError("", new Error("Empty response body"), url)
					}

					try {
						data = JSON.parse(responseText)
					} catch (parseError) {
						throw new JSONParseError(responseText, parseError as Error, url)
					}
				} catch (error) {
					if (error instanceof JSONParseError) {
						throw error
					}
					throw new Error(`Failed to read response body: ${(error as Error).message}`)
				}
			}

			// Validate that we have the expected rustdoc structure
			if (!data || typeof data !== "object") {
				throw new JSONParseError(
					JSON.stringify(data),
					new Error("Response is not a valid object"),
					url
				)
			}

			// Cache the successful response
			cache.set(cacheKey, data, cacheTtl)
			ErrorLogger.logInfo("Successfully cached rustdoc JSON", { url, cacheKey })

			return { data, fromCache: false }
		} catch (error) {
			ErrorLogger.log(error as Error)

			if (error instanceof Error) {
				if (error.name === "AbortError") {
					throw new TimeoutError(url, timeout)
				}
				// Re-throw our custom errors
				if (
					error instanceof JSONParseError ||
					error instanceof NetworkError ||
					error instanceof CrateNotFoundError ||
					error instanceof DecompressionError ||
					error instanceof TimeoutError
				) {
					throw error
				}
			}
			// Wrap unknown errors
			throw new NetworkError(url, undefined, undefined, (error as Error).message)
		}
	}

	// Clear the cache
	const clearCache = (): void => {
		cache.clear()
	}

	// Close the cache database
	const close = (): void => {
		cache.close()
	}

	// Get cache statistics
	const getCacheStats = () => {
		return cache.getStats()
	}

	// Get cache entries
	const getCacheEntries = (limit: number, offset: number) => {
		return cache.listEntries(limit, offset)
	}

	// Query cache database
	const queryCacheDb = (sql: string) => {
		// Only allow SELECT queries for safety
		if (!sql || !sql.trim().toUpperCase().startsWith("SELECT")) {
			throw new Error("Only SELECT queries are allowed for safety")
		}
		return cache.query(sql)
	}

	return {
		fetchCrateJson: fetchCrateJsonWithStatus,
		clearCache,
		close,
		getCacheStats,
		getCacheEntries,
		queryCacheDb
	}
}
