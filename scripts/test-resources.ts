#!/usr/bin/env bun

import { createDocsFetcher } from "../src/docs-fetcher.js"
import type { ServerConfig } from "../src/types.js"

// Test configuration - use in-memory database
const config: ServerConfig = {
	cacheTtl: 3600000,
	maxCacheSize: 100,
	requestTimeout: 30000,
	dbPath: ":memory:"
}

async function testResources() {
	console.log("🧪 Testing MCP Rust Docs Server Caching Behavior...")

	const fetcher = createDocsFetcher(config)

	// Test how crate and item lookups use the cache
	console.log("\n=== Testing Crate & Item Caching ===")

	// 1. First fetch a small crate to demonstrate caching
	console.log("\n1. Fetching entire crate (first time - cache miss)...")
	try {
		const start1 = Date.now()
		const result1 = await fetcher.fetchCrateJson("tinc")
		const time1 = Date.now() - start1
		console.log(`✅ Fetched tinc crate (fromCache: ${result1.fromCache}, time: ${time1}ms)`)

		// 2. Fetch same crate again (should hit cache)
		console.log("\n2. Fetching same crate again (cache hit)...")
		const start2 = Date.now()
		const result2 = await fetcher.fetchCrateJson("tinc")
		const time2 = Date.now() - start2
		console.log(`✅ Fetched tinc crate (fromCache: ${result2.fromCache}, time: ${time2}ms)`)
		console.log(`⚡ Cache speedup: ${Math.round(time1 / time2)}x faster`)

		// 3. Show what's in the cache
		console.log("\n3. Inspecting cache contents...")
		const cacheKey = "https://docs.rs/crate/tinc/latest/json"
		const entries = fetcher.queryCacheDb(
			`SELECT key, LENGTH(data) as size FROM cache WHERE key = '${cacheKey}'`
		)
		console.log("📦 Cache entry:", entries[0])

		// 4. Demonstrate that items use the same cached crate data
		console.log("\n4. Item lookups use the same cached crate data...")
		console.log("   (No separate cache entries for individual items)")

		// Show all cache entries
		const allEntries = fetcher.queryCacheDb("SELECT key, LENGTH(data) as size FROM cache")
		console.log("\n📋 All cache entries:")
		allEntries.forEach((entry) => {
			console.log(`   - ${entry.key} (${entry.size} bytes)`)
		})
	} catch (error) {
		console.log("⚠️  Error during caching test:", error.message)
	}

	// Demonstrate cache key structure
	console.log("\n=== Cache Key Structure ===")
	console.log("Cache keys are the full docs.rs JSON URLs:")
	console.log("- Default: https://docs.rs/crate/{crate}/latest/json")
	console.log("- With version: https://docs.rs/crate/{crate}/{version}/json")
	console.log("- With target: https://docs.rs/crate/{crate}/{version}/{target}/json")
	console.log("- With format: https://docs.rs/crate/{crate}/{version}/json/{format}")

	// Test different cache keys
	console.log("\n5. Testing different cache key variations...")
	try {
		// Fetch with different parameters to show different cache keys
		await fetcher.fetchCrateJson("tinc") // Uses "latest"
		await fetcher.fetchCrateJson("tinc", "0.1.5") // Different version
		await fetcher.fetchCrateJson("tinc", "0.1.5", "x86_64-pc-windows-msvc") // With target

		const allKeys = fetcher.queryCacheDb("SELECT key FROM cache ORDER BY key")
		console.log("\n📦 All cached URLs:")
		allKeys.forEach((entry) => {
			console.log(`   - ${entry.key}`)
		})
	} catch (error) {
		console.log("⚠️  Error:", error.message)
	}

	// Test cache stats
	console.log("\n1. Testing cache stats...")
	try {
		const stats = fetcher.getCacheStats()
		console.log("✅ Cache stats:", stats)
	} catch (error) {
		console.error("❌ Error getting cache stats:", error)
	}

	// Test cache entries
	console.log("\n2. Testing cache entries...")
	try {
		const entries = fetcher.getCacheEntries(10, 0)
		console.log("✅ Cache entries:", entries)
	} catch (error) {
		console.error("❌ Error getting cache entries:", error)
	}

	// Test cache query
	console.log("\n3. Testing cache query...")
	try {
		const sql = "SELECT name FROM sqlite_master WHERE type='table'"
		const result = fetcher.queryCacheDb(sql)
		console.log("✅ Query result:", result)
	} catch (error) {
		console.error("❌ Error executing query:", error)
	}

	// Test with invalid query (should fail)
	console.log("\n4. Testing invalid query (should fail)...")
	try {
		const sql = "DELETE FROM cache"
		fetcher.queryCacheDb(sql)
		console.log("❌ Should have failed but succeeded")
	} catch (error) {
		console.log("✅ Correctly rejected non-SELECT query:", error.message)
	}

	// Test SELECT query on cache table
	console.log("\n5. Testing SELECT query on cache table...")
	try {
		const sql = "SELECT key, LENGTH(data) as size FROM cache LIMIT 5"
		const result = fetcher.queryCacheDb(sql)
		console.log("✅ Cache data query result:", result)
	} catch (error) {
		console.error("❌ Error executing cache query:", error)
	}

	// Clean up
	fetcher.close()
	console.log("\n✨ Resource testing complete!")
}

// Run the tests
testResources().catch(console.error)
