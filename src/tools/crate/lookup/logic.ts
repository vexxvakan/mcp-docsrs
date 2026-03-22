import type { Crate, Item, ItemKind } from "../../../docs/rustdoc/types/items.ts"
import {
	ensureRoot,
	getItemById,
	getKindFromItem,
	KIND_LABELS,
	toIdKey
} from "../../../docs/shared.ts"
import type { CrateLookupItem, CrateLookupOutput, CrateLookupSection } from "./types.ts"

const MAX_PREVIEW_LENGTH = 100
const PREVIEW_SUFFIX = "..."
const CRATE_SECTION_ORDER: ItemKind[] = [
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
]

const getFirstLine = (docs: string) => {
	const trimmed = docs.split("\n", 1)[0]?.trim() ?? ""
	if (trimmed.length <= MAX_PREVIEW_LENGTH) {
		return trimmed
	}

	return `${trimmed.slice(0, MAX_PREVIEW_LENGTH - PREVIEW_SUFFIX.length)}${PREVIEW_SUFFIX}`
}

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

const getItemPath = (json: Crate, root: Item, item: Item): string | null => {
	const summaryPath = json.paths[toIdKey(item.id)]?.path
	if (summaryPath && summaryPath.length > 0) {
		return summaryPath.join("::")
	}

	const fallbackPath = [
		root.name,
		item.name
	].filter((segment): segment is string => Boolean(segment))
	return fallbackPath.length > 0 ? fallbackPath.join("::") : null
}

const createCrateLookupItem = (json: Crate, root: Item, item: Item): CrateLookupItem => ({
	name: item.name ?? "unknown",
	path: getItemPath(json, root, item),
	summary: item.docs ? getFirstLine(item.docs) : null
})

const collectCrateSections = (json: Crate, root: Item): CrateLookupSection[] => {
	const rootModule =
		typeof root.inner === "object" && "module" in root.inner ? root.inner.module : null
	if (!rootModule) {
		return []
	}

	const sections = new Map<ItemKind, CrateLookupItem[]>()
	for (const itemId of rootModule.items) {
		const item = getItemById(json, itemId)
		if (!item || item.visibility !== "public") {
			continue
		}

		const kind = getKindFromItem(item)
		if (!kind) {
			continue
		}

		const items = sections.get(kind) ?? []
		items.push(createCrateLookupItem(json, root, item))
		sections.set(kind, items)
	}

	return CRATE_SECTION_ORDER.flatMap((kind) => {
		const items = sections.get(kind)
		if (!items || items.length === 0) {
			return []
		}

		return [
			{
				count: items.length,
				items,
				kind,
				label: toSectionLabel(kind)
			}
		]
	})
}

const lookupCrate = (json: Crate): CrateLookupOutput => {
	const root = ensureRoot(json)
	const sections = collectCrateSections(json, root)

	return {
		crateName: root.name ?? "unknown",
		crateVersion: json.crate_version,
		formatVersion: json.format_version,
		sections,
		summary: root.docs ? getFirstLine(root.docs) : null,
		target: json.target.triple,
		totalItems: sections.reduce((total, section) => total + section.count, 0)
	}
}

export { lookupCrate }
