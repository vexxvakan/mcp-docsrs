// biome-ignore-all lint/style/useNamingConvention: rustdoc crate section keys mirror upstream snake_case kinds

import type { RankedCrate } from "../classifier/types.ts"
import type { Crate, Item, ItemKind } from "../rustdoc/types/items.ts"
import { KIND_LABELS } from "../shared.ts"
import type { CrateBuckets } from "../types.ts"
import { formatRelativeDate } from "./time.ts"

const CRATE_SECTION_ORDER = [
	"module",
	"struct",
	"enum",
	"trait",
	"function",
	"macro",
	"proc_attribute",
	"proc_derive",
	"primitive",
	"constant",
	"static",
	"union",
	"variant",
	"type_alias",
	"trait_alias",
	"assoc_type",
	"assoc_const",
	"struct_field",
	"use",
	"impl",
	"extern_crate",
	"extern_type",
	"attribute",
	"keyword"
] as const satisfies ItemKind[]

const pluralizeWord = (word: string) => {
	if (word.endsWith("y")) {
		return `${word.slice(0, -1)}ies`
	}

	if (word.endsWith("s")) {
		return `${word}es`
	}

	return `${word}s`
}

const toSectionLabel = (kind: ItemKind) => {
	const words = KIND_LABELS[kind].split(" ")
	const tail = words.pop()
	if (!tail) {
		return KIND_LABELS[kind]
	}

	return [
		...words,
		pluralizeWord(tail)
	].join(" ")
}

const createCrateBuckets = (): CrateBuckets =>
	CRATE_SECTION_ORDER.reduce((buckets, kind) => {
		buckets[kind] = []
		return buckets
	}, {} as CrateBuckets)

const formatCrateDocs = (root: Item) => root.docs ?? "No crate-level documentation available."

const withValue = (label: string, value: string | null) => (value ? `${label}: ${value}` : "")

const formatDownloads = (downloads: number, recentDownloads: number) =>
	`Downloads: ${downloads.toLocaleString()} (${recentDownloads.toLocaleString()} recent)`

const formatCrateSearchEntry = (crate: RankedCrate["crate"], index: number, now: Date | number) =>
	[
		`${index + 1}. **${crate.name}** v${crate.maxVersion}`,
		crate.description ? ` ${crate.description}` : "",
		formatDownloads(crate.downloads, crate.recentDownloads),
		withValue(
			"Last Updated",
			crate.updatedAt
				? formatRelativeDate(crate.updatedAt, {
						now
					})
				: null
		),
		withValue(
			"Created",
			crate.createdAt
				? formatRelativeDate(crate.createdAt, {
						now
					})
				: null
		),
		withValue("Source", crate.repository)
	]
		.filter(Boolean)
		.join("\n")

const formatCrateFindResults = (
	query: string,
	total: number,
	crates: RankedCrate[],
	now: Date | number = Date.now()
) => {
	if (crates.length === 0) {
		return `No crates found matching "${query}"`
	}

	const lines = crates.map(({ crate }, index) => formatCrateSearchEntry(crate, index, now))
	return `Found ${total} crates matching "${query}" (showing top ${crates.length}):\n\n${lines.join("\n\n")}`
}

const formatCrate = (json: Crate, root: Item, buckets: CrateBuckets) =>
	[
		root.name ? `# Crate: ${root.name}${json.crate_version ? ` v${json.crate_version}` : ""}` : "",
		...CRATE_SECTION_ORDER.map((kind) =>
			buckets[kind].length > 0 ? `## ${toSectionLabel(kind)}\n${buckets[kind].join("\n")}` : ""
		)
	]
		.filter(Boolean)
		.join("\n\n")

export { createCrateBuckets, formatCrate, formatCrateDocs, formatCrateFindResults }
