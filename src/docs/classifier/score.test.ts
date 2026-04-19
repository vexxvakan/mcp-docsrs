import { describe, expect, test } from "bun:test"
import { scoreCrate } from "./score.ts"

const createSearchCrate = (
	name: string,
	description: string | null = null,
	extra: Partial<{
		downloads: number
		recentDownloads: number
	}> = {}
) => ({
	createdAt: null,
	description,
	documentation: null,
	downloads: extra.downloads ?? 10,
	homepage: null,
	maxVersion: "1.0.0",
	name,
	recentDownloads: extra.recentDownloads ?? 5,
	repository: null,
	updatedAt: null
})

describe("scoreCrate", () => {
	test.each([
		{
			crate: createSearchCrate("rustdoc types"),
			expected: "exact_name" as const,
			name: "rustdoc types",
			query: "rustdoc types"
		},
		{
			crate: createSearchCrate("rustdoc"),
			expected: "name_prefix" as const,
			name: "rustdoc",
			query: "rust"
		},
		{
			crate: createSearchCrate("rust doc"),
			expected: "name_tokens" as const,
			name: "rust doc",
			query: "doc rust"
		},
		{
			crate: createSearchCrate("rustdoc index", "Rust manual"),
			expected: "text_tokens" as const,
			name: "rustdoc index",
			query: "rust manual"
		},
		{
			crate: createSearchCrate("rustdoc"),
			expected: "partial_name" as const,
			name: "rustdoc",
			query: "doc"
		},
		{
			crate: createSearchCrate("crate"),
			expected: "discarded" as const,
			name: "crate",
			query: "missing"
		}
	])("returns %s", ({ crate, expected, query }) => {
		expect(scoreCrate(query, crate).tier).toBe(expected)
	})

	test("treats empty queries as zero coverage", () => {
		const scores = scoreCrate("   ", createSearchCrate("crate name"))

		expect(scores.nameCoverage).toBe(0)
		expect(scores.textCoverage).toBe(0)
		expect(scores.tier).toBe("name_prefix")
	})
})
