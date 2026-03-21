import { rankCrates } from "../../../../../docs/classifier/rank.ts"
import type { FormatCase } from "../../types.ts"
import { createSearchCrate, FIND_TOTAL } from "../shared.ts"

const NOW = new Date("2026-03-21T00:00:00.000Z").getTime()

const formatCases: FormatCase[] = [
	{
		crates: [],
		expectedIncludes: [
			'No crates found matching "rustdoc types"'
		],
		name: "empty",
		query: "rustdoc types",
		total: 0
	},
	{
		crates: rankCrates("rustdoc types", [
			createSearchCrate("rustdoc-types", {
				createdAt: "2021-03-21T00:00:00.000Z",
				description: "Types for rustdoc's json output",
				downloads: 3_362_770,
				maxVersion: "0.57.3",
				recentDownloads: 496_894,
				repository: "https://github.com/rust-lang/rust",
				updatedAt: "2026-02-28T00:00:00.000Z"
			}),
			createSearchCrate("pavexc_rustdoc_types", {
				description: "The slimmed down schema used by pavexc to work with rustdoc's JSON output",
				downloads: 20_199,
				maxVersion: "0.1.80",
				recentDownloads: 132
			})
		]),
		expectedIncludes: [
			'Found 547 crates matching "rustdoc types" (showing top 2):',
			"1. **rustdoc-types** v0.57.3",
			"Downloads: 3,362,770 (496,894 recent)",
			"Last Updated: 3 weeks ago",
			"Created: 5 years ago",
			"Source: https://github.com/rust-lang/rust",
			"2. **pavexc_rustdoc_types** v0.1.80"
		],
		name: "ranked",
		now: NOW,
		query: "rustdoc types",
		total: FIND_TOTAL
	},
	{
		crates: rankCrates("tokio", [
			createSearchCrate("tokio", {
				downloads: 55_000_000,
				maxVersion: "1.48.0",
				recentDownloads: 7_000_000
			})
		]),
		expectedExcludes: [
			"\n \n",
			"Scores:"
		],
		expectedIncludes: [
			"1. **tokio** v1.48.0"
		],
		name: "blank",
		query: "tokio",
		total: 1
	}
]

export { formatCases }
