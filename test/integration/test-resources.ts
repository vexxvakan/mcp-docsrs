#!/usr/bin/env bun
import {
	assertContains,
	assertError,
	callTool,
	listResources,
	readResource,
	type TestOptions,
	withMCPServer,
	withTempDir
} from "./utils"

const testResources = async (options: TestOptions): Promise<void> => {
	console.log("\n🗂️  Testing MCP resources functionality...")

	await withTempDir("mcp-docsrs-resources-test-", async (tempDir) => {
		const cacheDbPath = `${tempDir}/test-cache.db`

		await withMCPServer(
			options.executable,
			async (server) => {
				// Test 1: List resources when cache is empty
				console.log("\n📋 Test 1: List resources with empty cache...")
				const emptyResources = await listResources(server)

				// Should have cache statistics and cache entries resources
				const expectedResourceNames = ["cache-statistics", "cache-entries"]
				for (const name of expectedResourceNames) {
					if (!emptyResources.some((r: any) => r.name === name)) {
						throw new Error(`Missing expected resource: ${name}`)
					}
				}
				console.log(`✅ Found ${emptyResources.length} resources with empty cache`)

				// Test 2: Add some data to cache
				console.log("\n🔄 Test 2: Populate cache with test data...")
				await callTool(server, "lookup_crate_docs", { crateName: "serde" }, 3)
				console.log("✅ Added serde to cache")

				// Test 3: Read cache statistics
				console.log("\n📊 Test 3: Read cache statistics...")
				const statsContent = await readResource(server, "cache://statistics", 4)

				// Parse statistics
				const stats = JSON.parse(statsContent)
				if (stats.totalEntries !== 1) {
					throw new Error(`Expected 1 cache entry, got ${stats.totalEntries}`)
				}
				console.log(
					`✅ Cache statistics: ${stats.totalEntries} entries, ${(stats.totalSize / 1024).toFixed(2)}KB`
				)

				// Test 4: Read cache entries
				console.log("\n📚 Test 4: Read cache entries...")
				const entriesContent = await readResource(server, "cache://entries?limit=10", 5)

				const entries = JSON.parse(entriesContent)
				if (entries.entries.length !== 1) {
					throw new Error(`Expected 1 cache entry, got ${entries.entries.length}`)
				}

				const entry = entries.entries[0]
				assertContains(entry.url, "serde", "Cache entry should contain 'serde'")
				console.log(`✅ Found cache entry for ${entry.url}`)

				// Test 5: Test pagination
				console.log("\n📄 Test 5: Test cache entries pagination...")

				// Add more crates to test pagination
				const crateNames = ["tokio", "async-trait", "futures"]
				let reqId = 10
				for (const crateName of crateNames) {
					await callTool(server, "lookup_crate_docs", { crateName }, reqId++)
				}
				console.log(`✅ Added ${crateNames.length} more crates to cache`)

				// Test pagination with limit
				const paginatedContent = await readResource(
					server,
					"cache://entries?limit=2&offset=1",
					20
				)
				const paginatedEntries = JSON.parse(paginatedContent)

				if (paginatedEntries.entries.length !== 2) {
					throw new Error(
						`Expected 2 entries with pagination, got ${paginatedEntries.entries.length}`
					)
				}
				console.log("✅ Pagination working correctly")

				// Test 6: SQL query execution
				console.log("\n🔍 Test 6: SQL query execution...")
				const sqlContent = await readResource(
					server,
					"cache://query?sql=SELECT COUNT(*) as count FROM cache_entries",
					30
				)
				const sqlResult = JSON.parse(sqlContent)

				if (!sqlResult.rows || sqlResult.rows[0].count !== 4) {
					throw new Error(`Expected 4 cache entries, got ${sqlResult.rows?.[0]?.count}`)
				}
				console.log("✅ SQL query executed successfully")

				// Test 7: Security - reject non-SELECT queries
				console.log("\n🔒 Test 7: Security - reject non-SELECT queries...")
				const dangerousResponse = await server.sendRequest({
					jsonrpc: "2.0",
					id: 40,
					method: "resources/read",
					params: {
						uri: "cache://query?sql=DELETE FROM cache_entries"
					}
				})

				assertError(dangerousResponse, "Should have rejected DELETE query")
				console.log("✅ Correctly rejected non-SELECT query")

				console.log("\n✅ All resources tests passed")
			},
			{ DB_PATH: cacheDbPath }
		)
	})
}

export const runResourcesTests = async (options: TestOptions): Promise<void> => {
	await testResources(options)
}

// Main execution
if (import.meta.main) {
	const args = process.argv.slice(2)

	if (args.length < 2) {
		console.error("Usage: bun test/integration/test-resources.ts <executable> <target>")
		process.exit(1)
	}

	const [executable, target] = args
	const options: TestOptions = { executable, target }

	try {
		await runResourcesTests(options)
	} catch (error) {
		console.error(`\n❌ Resources tests failed: ${error}`)
		process.exit(1)
	}
}
