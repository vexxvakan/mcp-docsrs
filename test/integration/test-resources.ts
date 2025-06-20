#!/usr/bin/env bun
import {
	assertContains,
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
		const cacheDbPath = tempDir

		await withMCPServer(
			options.executable,
			async (server) => {
				// Test 1: List resources when cache is empty
				console.log("\n📋 Test 1: List resources with empty cache...")
				const emptyResources = await listResources(server)

				// Should have cache statistics and cache entries resources
				const expectedResourceNames = ["Cache Statistics", "Cache Entries"]
				for (const name of expectedResourceNames) {
					if (!emptyResources.some((r: any) => r.name === name)) {
						throw new Error(`Missing expected resource: ${name}`)
					}
				}
				console.log(`✅ Found ${emptyResources.length} resources with empty cache`)

				// Test 2: Add some data to cache
				console.log("\n🔄 Test 2: Populate cache with test data...")
				const addResult = await callTool(
					server,
					"lookup_crate_docs",
					{ crateName: "tinc", version: "0.1.6" },
					3
				)
				if (addResult.result?.isError) {
					throw new Error(`Failed to add tinc to cache: ${addResult.result.content[0].text}`)
				}
				console.log("✅ Added tinc to cache")

				// Small delay to ensure cache write completes
				await new Promise((resolve) => setTimeout(resolve, 100))

				// Test 3: Read cache statistics
				console.log("\n📊 Test 3: Read cache statistics...")
				const statsContent = await readResource(server, "cache://stats", 4)

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
				const entriesContent = await readResource(
					server,
					"cache://entries?limit=10&offset=0",
					5
				)

				if (!entriesContent) {
					throw new Error("No content returned from cache entries resource")
				}

				let entries: any
				try {
					entries = JSON.parse(entriesContent)
				} catch (e) {
					console.error("Failed to parse entries content:", JSON.stringify(entriesContent))
					console.error("Content length:", entriesContent.length)
					console.error("First 100 chars:", entriesContent.substring(0, 100))
					throw e
				}
				if (entries.entries.length !== 1) {
					throw new Error(`Expected 1 cache entry, got ${entries.entries.length}`)
				}

				const entry = entries.entries[0]
				assertContains(entry.key, "tinc", "Cache entry should contain 'tinc'")
				console.log(`✅ Found cache entry for ${entry.key}`)

				// Test 5: Test pagination
				console.log("\n📄 Test 5: Test cache entries pagination...")

				// Add more crates to test pagination
				const crateNames = ["clap", "anyhow", "thiserror"]
				let reqId = 10
				let successCount = 0
				for (const crateName of crateNames) {
					const result = await callTool(server, "lookup_crate_docs", { crateName }, reqId++)
					if (!result.result?.isError) {
						successCount++
					}
				}
				console.log(`✅ Added ${successCount} more crates to cache`)

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
					"cache://query?sql=SELECT COUNT(*) as count FROM cache",
					30
				)
				const sqlResult = JSON.parse(sqlContent)

				const expectedCount = 1 + successCount // 1 from tinc + successCount from pagination test
				if (
					!Array.isArray(sqlResult) ||
					sqlResult.length === 0 ||
					sqlResult[0].count !== expectedCount
				) {
					throw new Error(
						`Expected ${expectedCount} cache entries, got ${sqlResult?.[0]?.count}`
					)
				}
				console.log("✅ SQL query executed successfully")

				// Test 7: Security - reject non-SELECT queries
				console.log("\n🔒 Test 7: Security - reject non-SELECT queries...")
				const dangerousResponse = await server.sendRequest({
					jsonrpc: "2.0",
					id: 40,
					method: "resources/read",
					params: {
						uri: "cache://query?sql=DELETE FROM cache"
					}
				})

				// The server returns a successful response with an error message in the content
				const dangerousContent = dangerousResponse.result?.contents?.[0]?.text || ""
				assertContains(
					dangerousContent,
					"Only SELECT queries are allowed",
					"Should reject non-SELECT query"
				)
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
