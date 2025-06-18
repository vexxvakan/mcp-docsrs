#!/usr/bin/env bun

import { createSearchCratesHandler, suggestSimilarCrates } from "../src/tools/search-crates.js"

// ANSI color codes for better output
const colors = {
	green: "\x1b[32m",
	red: "\x1b[31m",
	blue: "\x1b[34m",
	yellow: "\x1b[33m",
	reset: "\x1b[0m",
	bold: "\x1b[1m"
}

async function testCratesSearch() {
	console.log(
		`\n${colors.blue}${colors.bold}🔍 Testing Crates.io Search Functionality${colors.reset}\n`
	)

	const searchHandler = createSearchCratesHandler()

	// Test 1: Search for popular crate
	console.log(`${colors.yellow}1️⃣  Searching for "serde" crates...${colors.reset}`)
	try {
		const result1 = await searchHandler({ query: "serde", limit: 3 })
		if (result1.isError) {
			console.log(`${colors.red}   ❌ Error: ${result1.content[0].text}${colors.reset}`)
		} else {
			console.log(`${colors.green}   ✅ Found results:${colors.reset}`)
			console.log(result1.content[0].text.split("\n").slice(0, 15).join("\n"))
		}
	} catch (error) {
		console.log(`${colors.red}   ❌ Exception: ${error}${colors.reset}`)
	}

	// Test 2: Search for partial match
	console.log(`\n${colors.yellow}2️⃣  Searching for "tok" (partial match)...${colors.reset}`)
	try {
		const result2 = await searchHandler({ query: "tok", limit: 5 })
		if (result2.isError) {
			console.log(`${colors.red}   ❌ Error: ${result2.content[0].text}${colors.reset}`)
		} else {
			console.log(`${colors.green}   ✅ Found results:${colors.reset}`)
			const lines = result2.content[0].text.split("\n")
			console.log(lines[0]) // Header
			console.log(lines.slice(1, 6).join("\n")) // First result
		}
	} catch (error) {
		console.log(`${colors.red}   ❌ Exception: ${error}${colors.reset}`)
	}

	// Test 3: Search for non-existent crate
	console.log(`\n${colors.yellow}3️⃣  Searching for non-existent crate...${colors.reset}`)
	try {
		const result3 = await searchHandler({
			query: "this-definitely-does-not-exist-xyz123",
			limit: 10
		})
		if (result3.content[0].text.includes("No crates found")) {
			console.log(
				`${colors.green}   ✅ Correctly handled: ${result3.content[0].text}${colors.reset}`
			)
		} else {
			console.log(`${colors.red}   ❌ Unexpected result${colors.reset}`)
		}
	} catch (error) {
		console.log(`${colors.red}   ❌ Exception: ${error}${colors.reset}`)
	}

	// Test 4: Suggest similar crates
	console.log(`\n${colors.yellow}4️⃣  Testing crate suggestions...${colors.reset}`)

	console.log(
		`   ${colors.blue}Searching for suggestions for "servr" (typo of "server")${colors.reset}`
	)
	try {
		const suggestions1 = await suggestSimilarCrates("servr", 5)
		console.log(`   Found ${suggestions1.length} suggestions: ${suggestions1.join(", ")}`)
	} catch (error) {
		console.log(`${colors.red}   ❌ Exception: ${error}${colors.reset}`)
	}

	console.log(
		`\n   ${colors.blue}Searching for suggestions for "asyn" (typo of "async")${colors.reset}`
	)
	try {
		const suggestions2 = await suggestSimilarCrates("asyn", 5)
		console.log(`   Found ${suggestions2.length} suggestions: ${suggestions2.join(", ")}`)
	} catch (error) {
		console.log(`${colors.red}   ❌ Exception: ${error}${colors.reset}`)
	}

	// Test 5: Large result set
	console.log(`\n${colors.yellow}5️⃣  Testing with common term "test"...${colors.reset}`)
	try {
		const result5 = await searchHandler({ query: "test", limit: 2 })
		if (result5.isError) {
			console.log(`${colors.red}   ❌ Error: ${result5.content[0].text}${colors.reset}`)
		} else {
			const lines = result5.content[0].text.split("\n")
			console.log(`${colors.green}   ✅ ${lines[0]}${colors.reset}`) // Header with count
			console.log("   Showing first 2 results only...")
		}
	} catch (error) {
		console.log(`${colors.red}   ❌ Exception: ${error}${colors.reset}`)
	}

	// Test 6: Special characters
	console.log(`\n${colors.yellow}6️⃣  Testing with special characters...${colors.reset}`)
	try {
		const result6 = await searchHandler({ query: "rust-crypto", limit: 3 })
		if (result6.isError) {
			console.log(`${colors.red}   ❌ Error: ${result6.content[0].text}${colors.reset}`)
		} else {
			console.log(`${colors.green}   ✅ Successfully handled hyphenated search${colors.reset}`)
			const lines = result6.content[0].text.split("\n")
			console.log(`   ${lines[0]}`) // Header
		}
	} catch (error) {
		console.log(`${colors.red}   ❌ Exception: ${error}${colors.reset}`)
	}

	console.log(
		`\n${colors.green}${colors.bold}✅ All crates.io search tests completed!${colors.reset}\n`
	)
}

// Run the tests
testCratesSearch().catch(console.error)
