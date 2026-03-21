// biome-ignore-all lint/style/useNamingConvention: rustdoc crate section keys mirror upstream snake_case kinds

import type { Item, ItemKind, Json } from "../rustdoc/types/items.ts"
import { KIND_LABELS } from "../shared.ts"
import type { CrateBuckets } from "../types.ts"

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

const formatCrate = (json: Json, root: Item, buckets: CrateBuckets) =>
	[
		root.name ? `# Crate: ${root.name}${json.crate_version ? ` v${json.crate_version}` : ""}` : "",
		...CRATE_SECTION_ORDER.map((kind) =>
			buckets[kind].length > 0 ? `## ${toSectionLabel(kind)}\n${buckets[kind].join("\n")}` : ""
		)
	]
		.filter(Boolean)
		.join("\n\n")

export { createCrateBuckets, formatCrate, formatCrateDocs }
