#!/usr/bin/env bun
import { promises as fs } from "node:fs"
import path from "node:path"
import {
	assertSuccess,
	callTool,
	createMCPServer,
	initializeServer,
	type TestOptions,
	withTempDir
} from "./utils.js"

const testPersistentCache = async (options: TestOptions): Promise<void> => {
	console.log("\n💾 Testing persistent cache functionality...")

	await withTempDir("mcp-docsrs-test-", async (tempDir) => {
		const cacheDbPath = path.join(tempDir, "test-cache.db")
		const env = { DB_PATH: cacheDbPath }

		// Test 1: First fetch (cache miss)
		console.log("\n🔍 Test 1: First fetch - cache miss...")
		const server1 = createMCPServer(options.executable, env)

		try {
			await initializeServer(server1)

			const startTime1 = Date.now()
			const response1 = await callTool(server1, "lookup_crate_docs", {
				crateName: "lazy_static",
				version: "1.4.0"
			})
			const fetchTime1 = Date.now() - startTime1

			assertSuccess(response1)
			if (!response1.result?.content?.[0]?.text) {
				throw new Error("Failed to fetch crate documentation")
			}

			console.log(`✅ First fetch completed in ${fetchTime1}ms (cache miss)`)

			// Shutdown first server
			server1.kill()
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Test 2: Second fetch with new server instance (cache hit)
			console.log("\n🚀 Test 2: Second fetch - cache hit from persistent storage...")
			const server2 = createMCPServer(options.executable, env)

			await initializeServer(server2)

			const startTime2 = Date.now()
			const response2 = await callTool(server2, "lookup_crate_docs", {
				crateName: "lazy_static",
				version: "1.4.0"
			})
			const fetchTime2 = Date.now() - startTime2

			assertSuccess(response2)
			if (!response2.result?.content?.[0]?.text) {
				throw new Error("Failed to fetch cached documentation")
			}

			console.log(`✅ Second fetch completed in ${fetchTime2}ms (cache hit)`)

			// Cache hit should be significantly faster
			if (fetchTime2 > fetchTime1 * 0.5) {
				console.warn(
					`⚠️  Cache hit (${fetchTime2}ms) wasn't significantly faster than miss (${fetchTime1}ms)`
				)
			}

			// Test 3: Verify cache database exists
			console.log("\n📁 Test 3: Verify cache database exists...")
			try {
				const stats = await fs.stat(cacheDbPath)
				if (!stats.isFile()) {
					throw new Error("Cache database is not a file")
				}
				console.log(`✅ Cache database exists: ${(stats.size / 1024).toFixed(2)}KB`)
			} catch (error) {
				throw new Error(`Cache database not found: ${error}`)
			}

			// Test 4: Multiple crates in cache
			console.log("\n📦 Test 4: Multiple crates in cache...")
			const response3 = await callTool(
				server2,
				"lookup_crate_docs",
				{
					crateName: "once_cell"
				},
				3
			)

			assertSuccess(response3)
			if (!response3.result?.content?.[0]?.text) {
				throw new Error("Failed to fetch second crate")
			}
			console.log("✅ Successfully cached multiple crates")

			// Shutdown second server
			server2.kill()
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Test 5: Verify both crates are in cache with third instance
			console.log("\n🔄 Test 5: Verify persistence across multiple restarts...")
			const server3 = createMCPServer(options.executable, env)

			await initializeServer(server3)

			// Check first crate
			const startVerify1 = Date.now()
			await callTool(server3, "lookup_crate_docs", {
				crateName: "lazy_static",
				version: "1.4.0"
			})
			const verifyTime1 = Date.now() - startVerify1
			console.log(`✅ lazy_static retrieved in ${verifyTime1}ms`)

			// Check second crate
			const startVerify2 = Date.now()
			await callTool(
				server3,
				"lookup_crate_docs",
				{
					crateName: "once_cell"
				},
				3
			)
			const verifyTime2 = Date.now() - startVerify2
			console.log(`✅ once_cell retrieved in ${verifyTime2}ms`)

			server3.kill()
			await new Promise((resolve) => setTimeout(resolve, 1000))
		} finally {
			// Ensure server1 is cleaned up in case of early failure
			try {
				server1.kill()
			} catch {
				// Ignore if already killed
			}
		}

		console.log("\n✅ All persistent cache tests passed")
	})
}

export const runPersistentCacheTests = async (options: TestOptions): Promise<void> => {
	await testPersistentCache(options)
}

// Main execution
if (import.meta.main) {
	const args = process.argv.slice(2)

	if (args.length < 2) {
		console.error("Usage: bun test/integration/test-persistent-cache.ts <executable> <target>")
		process.exit(1)
	}

	const [executable, target] = args
	const options: TestOptions = {
		executable,
		target
	}

	try {
		await runPersistentCacheTests(options)
	} catch (error) {
		console.error(`\n❌ Persistent cache tests failed: ${error}`)
		process.exit(1)
	}
}
