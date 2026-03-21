import type { RankCase } from "../../types.ts"
import { createSearchCrate } from "../shared.ts"

const rankCases: RankCase[] = [
	{
		crates: [
			createSearchCrate("pavexc_rustdoc_types", {
				description: "The slimmed down schema used by pavexc to work with rustdoc's JSON output",
				downloads: 20_199,
				recentDownloads: 132
			}),
			createSearchCrate("rustdoc-types", {
				description: "Types for rustdoc's json output",
				downloads: 3_362_770,
				recentDownloads: 496_894
			}),
			createSearchCrate("txt", {
				description: "cargo doc for coding agents",
				downloads: 125,
				recentDownloads: 125
			})
		],
		expectedNames: [
			"rustdoc-types",
			"pavexc_rustdoc_types"
		],
		expectedTier: "exact_name",
		name: "exact",
		query: "rustdoc types"
	},
	{
		crates: [
			createSearchCrate("rustdoc-text", {
				downloads: 1872,
				recentDownloads: 160
			}),
			createSearchCrate("rustdoc-json", {
				downloads: 915_988,
				recentDownloads: 152_971
			}),
			createSearchCrate("rustdoc-markdown", {
				downloads: 60,
				recentDownloads: 60
			})
		],
		expectedNames: [
			"rustdoc-json",
			"rustdoc-text",
			"rustdoc-markdown"
		],
		expectedTier: "name_prefix",
		name: "downloads",
		query: "rustdoc"
	},
	{
		crates: [
			createSearchCrate("types-rust", {
				downloads: 9_999_999,
				recentDownloads: 250_000
			}),
			createSearchCrate("rust-types", {
				downloads: 100,
				recentDownloads: 10
			})
		],
		expectedNames: [
			"rust-types",
			"types-rust"
		],
		expectedTier: "name_prefix",
		name: "ordered",
		query: "rust typ"
	},
	{
		crates: [
			createSearchCrate("rustdoc-index", {
				description: "A fast manual for rustdoc",
				downloads: 19_876,
				recentDownloads: 54
			}),
			createSearchCrate("guidebook", {
				description: "Rustdoc reference manual",
				downloads: 999_999,
				recentDownloads: 50_000
			})
		],
		expectedNames: [
			"rustdoc-index"
		],
		expectedTier: "text_tokens",
		name: "description",
		query: "rustdoc manual"
	},
	{
		crates: [
			createSearchCrate("txt", {
				description: "cargo doc for coding agents",
				downloads: 125,
				recentDownloads: 125
			})
		],
		expectedNames: [],
		name: "discard",
		query: "rustdoc types"
	}
]

export { rankCases }
