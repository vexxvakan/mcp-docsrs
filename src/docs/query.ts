// biome-ignore-all lint/style/useNamingConvention: rustdoc kind aliases follow upstream snake_case naming

import type {
	CrateLookupItem,
	CrateLookupOutput,
	CrateLookupSection
} from "../tools/crate/lookup/types.ts"
import type { SymbolLookupOutput } from "../tools/symbol/lookup/types.ts"
import type { Crate, Item, ItemKind } from "./rustdoc/types/items.ts"
import { ensureRoot, getItemById, getKindFromItem, KIND_LABELS, toIdKey } from "./shared.ts"
import type { DocsSymbolQuery, DocsSymbolRequest } from "./types.ts"

const MAX_PREVIEW_LENGTH = 100
const PREVIEW_SUFFIX = "..."
const KIND_MATCH_SCORE = 10
const NAME_MATCH_SCORE = 10
const INDEX_PATH_MATCH_SCORE = 100
const SUMMARY_PATH_MATCH_SCORE = 50
const SUMMARY_KIND_MATCH_SCORE = 1
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

const KIND_ALIASES = {
	assoc_const: "assoc_const",
	assoc_type: "assoc_type",
	attr: "proc_attribute",
	attribute: "attribute",
	const: "constant",
	constant: "constant",
	enum: "enum",
	extern_crate: "extern_crate",
	extern_type: "extern_type",
	fn: "function",
	function: "function",
	impl: "impl",
	keyword: "keyword",
	macro: "macro",
	mod: "module",
	module: "module",
	primitive: "primitive",
	proc_attribute: "proc_attribute",
	proc_derive: "proc_derive",
	static: "static",
	struct: "struct",
	struct_field: "struct_field",
	trait: "trait",
	trait_alias: "trait_alias",
	type: "type_alias",
	type_alias: "type_alias",
	union: "union",
	use: "use",
	variant: "variant"
} as const satisfies Record<string, ItemKind>

const hasPathSuffix = (path: string[], suffix: string[]) => {
	if (suffix.length > path.length) {
		return false
	}

	for (let index = 1; index <= suffix.length; index += 1) {
		if (path.at(-index) !== suffix.at(-index)) {
			return false
		}
	}

	return true
}

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

const parseSymbolQuery = (input: DocsSymbolRequest) => {
	const normalizedType = input.symbolType.trim().toLowerCase()
	const kind = KIND_ALIASES[normalizedType as keyof typeof KIND_ALIASES]
	const pathText = input.symbolname.trim()
	const segments = pathText.split("::").filter(Boolean)
	const name = segments.at(-1) ?? pathText.split(".").at(-1) ?? pathText

	return {
		kind,
		name,
		segments
	} satisfies DocsSymbolQuery
}

const buildIndexPaths = (json: Crate) => {
	const root = ensureRoot(json)
	const paths: Record<string, string[]> = {}
	const visited = new Set<string>()

	const visit = (item: Item, prefix: string[]) => {
		const key = toIdKey(item.id)
		const nextPath = item.name
			? [
					...prefix,
					item.name
				]
			: prefix
		paths[key] = nextPath

		const module =
			typeof item.inner === "object" && "module" in item.inner ? item.inner.module : null
		if (!module || visited.has(key)) {
			return
		}

		visited.add(key)
		for (const childId of module.items) {
			const child = getItemById(json, childId)
			if (child) {
				visit(child, nextPath)
			}
		}
	}

	visit(root, [])
	return paths
}

type CandidateScoreInput = {
	indexPaths: Record<string, string[]>
	item: Item
	json: Crate
	key: string
	kind?: ItemKind
	query: DocsSymbolQuery
}

type SymbolMatch = {
	item: Item
	key: string
	kind: ItemKind
	path: string | null
}

const scoreCandidate = ({ indexPaths, item, json, key, kind, query }: CandidateScoreInput) => {
	if (item.name !== query.name) {
		return -1
	}
	if (!query.kind || kind !== query.kind) {
		return -1
	}

	let score = NAME_MATCH_SCORE
	score += KIND_MATCH_SCORE

	const derivedPath = indexPaths[key]
	if (query.segments.length > 1 && derivedPath && hasPathSuffix(derivedPath, query.segments)) {
		score += INDEX_PATH_MATCH_SCORE
	}

	const summaryPath = json.paths[key]
	if (query.segments.length > 1 && summaryPath && hasPathSuffix(summaryPath.path, query.segments)) {
		score += SUMMARY_PATH_MATCH_SCORE
	}
	if (summaryPath?.kind === kind) {
		score += SUMMARY_KIND_MATCH_SCORE
	}

	return score
}

const getVisibility = (item: Item) =>
	typeof item.visibility === "string" ? item.visibility : "restricted"

const findSymbol = (json: Crate, input: DocsSymbolRequest): SymbolMatch | null => {
	ensureRoot(json)
	const indexPaths = buildIndexPaths(json)
	const query = parseSymbolQuery(input)

	type ScoredCandidate = {
		item: Item
		key: string
		kind?: ItemKind
		score: number
	}

	const best = Object.entries(json.index)
		.map(([key, item]): ScoredCandidate => {
			const kind = getKindFromItem(item)

			return {
				item,
				key,
				kind,
				score: scoreCandidate({
					indexPaths,
					item,
					json,
					key,
					kind,
					query
				})
			}
		})
		.filter(
			(
				candidate
			): candidate is ScoredCandidate & {
				kind: ItemKind
			} => candidate.score >= 0 && candidate.kind !== undefined
		)
		.sort((left, right) => right.score - left.score)[0]

	if (!best) {
		return null
	}

	const summaryPath = json.paths[best.key]?.path
	const derivedPath = indexPaths[best.key]
	return {
		item: best.item,
		key: best.key,
		kind: best.kind,
		path: summaryPath?.join("::") ?? derivedPath?.join("::") ?? null
	}
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

const lookupCrateDocs = (json: Crate) => {
	const root = ensureRoot(json)
	return root.docs ?? "No crate-level documentation available."
}

const lookupSymbol = (json: Crate, input: DocsSymbolRequest): SymbolLookupOutput | null => {
	const root = ensureRoot(json)
	const match = findSymbol(json, input)
	if (!match) {
		return null
	}

	return {
		crateName: root.name ?? "unknown",
		crateVersion: json.crate_version,
		formatVersion: json.format_version,
		symbol: {
			deprecated: Boolean(match.item.deprecation),
			hasDocs: Boolean(match.item.docs),
			kind: match.kind,
			label: KIND_LABELS[match.kind],
			name: match.item.name ?? "unknown",
			path: match.path,
			summary: match.item.docs ? getFirstLine(match.item.docs) : null,
			visibility: getVisibility(match.item)
		},
		target: json.target.triple
	}
}

const lookupSymbolDocs = (json: Crate, input: DocsSymbolRequest) => {
	const match = findSymbol(json, input)
	return match ? (match.item.docs ?? "No symbol documentation available.") : null
}

export { lookupCrate, lookupCrateDocs, lookupSymbol, lookupSymbolDocs }
