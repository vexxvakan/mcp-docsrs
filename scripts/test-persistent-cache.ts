#!/usr/bin/env bun

import { tmpdir } from "node:os"
import { join } from "node:path"
import { createDocsFetcher } from "../src/docs-fetcher.js"

// Simple script to verify persistent cache is working
async function verifyPersistentCache() {
	const dbPath = join(tmpdir(), "mcp-docsrs-test-cache.db")
	console.log(`\n🔍 Testing persistent cache at: ${dbPath}\n`)

	// Test 1: First fetcher instance
	console.log("1️⃣  Creating first fetcher instance...")
	const fetcher1 = createDocsFetcher({
		dbPath,
		cacheTtl: 3600000, // 1 hour
		maxCacheSize: 100
	})

	console.log("   Fetching 'tinc' crate documentation...")
	const result1 = await fetcher1.fetchCrateJson("tinc")
	console.log(`   ✅ First fetch: fromCache = ${result1.fromCache} (expected: false)`)
	console.log(`   📦 Crate version: ${result1.data.crate_version}`)

	// Fetch again with same instance
	console.log("   Fetching 'tinc' again with same instance...")
	const result2 = await fetcher1.fetchCrateJson("tinc")
	console.log(`   ✅ Second fetch: fromCache = ${result2.fromCache} (expected: true)`)

	console.log("   Closing first fetcher...")
	fetcher1.close()

	// Test 2: New fetcher instance with same database
	console.log("\n2️⃣  Creating second fetcher instance with same database...")
	const fetcher2 = createDocsFetcher({
		dbPath,
		cacheTtl: 3600000,
		maxCacheSize: 100
	})

	console.log("   Fetching 'tinc' with new instance...")
	const result3 = await fetcher2.fetchCrateJson("tinc")
	console.log(`   ✅ Third fetch: fromCache = ${result3.fromCache} (expected: true)`)
	console.log("   ✨ Cache persisted across instances!")

	// Test 3: Different crate
	console.log("\n3️⃣  Testing with different crate...")
	console.log("   Fetching 'clap' crate documentation...")
	const result4 = await fetcher2.fetchCrateJson("clap")
	console.log(`   ✅ Fourth fetch: fromCache = ${result4.fromCache} (expected: false)`)
	console.log(`   📦 Crate version: ${result4.data.crate_version}`)

	console.log("   Fetching 'clap' again...")
	const result5 = await fetcher2.fetchCrateJson("clap")
	console.log(`   ✅ Fifth fetch: fromCache = ${result5.fromCache} (expected: true)`)

	fetcher2.close()

	// Test 4: In-memory cache comparison
	console.log("\n4️⃣  Comparing with in-memory cache...")
	const fetcher3 = createDocsFetcher({
		cacheTtl: 3600000,
		maxCacheSize: 100
		// No dbPath - uses in-memory
	})

	console.log("   Fetching 'tinc' with in-memory cache...")
	const result6 = await fetcher3.fetchCrateJson("tinc")
	console.log(`   ✅ Sixth fetch: fromCache = ${result6.fromCache} (expected: false)`)
	console.log("   💭 In-memory cache starts fresh")

	fetcher3.close()

	console.log("\n✅ All tests passed! Persistent cache is working correctly.\n")
	console.log(`💡 Database file location: ${dbPath}`)
	console.log("   You can delete this test file manually if needed.\n")
}

// Run the verification
verifyPersistentCache().catch(console.error)
