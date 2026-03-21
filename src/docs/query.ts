// biome-ignore-all lint/style/useNamingConvention: rustdoc kind aliases follow upstream snake_case naming
import { createCrateBuckets, formatCrate, formatCrateDocs } from "./formatters/crate.ts"
import { formatItem } from "./formatters/item.ts"
import { ensureRoot, getItemById, getKindFromItem, toIdKey } from "./shared.ts"
import type {
	CrateBuckets,
	DocsSymbolQuery,
	DocsSymbolRequest,
	RustdocItem,
	RustdocItemKind,
	RustdocJson
} from "./types.ts"

const MAX_PREVIEW_LENGTH = 100
const PREVIEW_SUFFIX = "..."
const KIND_MATCH_SCORE = 10
const NAME_MATCH_SCORE = 10
const INDEX_PATH_MATCH_SCORE = 100
const SUMMARY_PATH_MATCH_SCORE = 50
const SUMMARY_KIND_MATCH_SCORE = 1

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
} as const satisfies Record<string, RustdocItemKind>

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

const collectCrateBuckets = (json: RustdocJson, root: RustdocItem): CrateBuckets => {
	const buckets = createCrateBuckets()

	const rootModule =
		typeof root.inner === "object" && "module" in root.inner ? root.inner.module : null
	if (!rootModule) {
		return buckets
	}

	for (const itemId of rootModule.items) {
		const item = getItemById(json, itemId)
		if (!item || item.visibility !== "public") {
			continue
		}

		const line = `- **${item.name ?? "unknown"}**${item.docs ? `: ${getFirstLine(item.docs)}` : ""}`
		const kind = getKindFromItem(item)
		if (kind) {
			buckets[kind].push(line)
		}
	}

	return buckets
}

const parseSymbolQuery = (input: DocsSymbolRequest) => {
	const normalizedType = input.symbolType.trim().toLowerCase()
	const kind = KIND_ALIASES[normalizedType as keyof typeof KIND_ALIASES]
	const pathText = input.symbolname.trim()
	const segments = pathText.split("::").filter(Boolean)
	const name = segments.at(-1) ?? pathText.split(".").at(-1) ?? pathText

	return {
		expandDocs: input.expandDocs,
		kind,
		name,
		segments
	} satisfies DocsSymbolQuery
}

const buildIndexPaths = (json: RustdocJson) => {
	const root = ensureRoot(json)
	const paths: Record<string, string[]> = {}
	const visited = new Set<string>()

	const visit = (item: RustdocItem, prefix: string[]) => {
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
	item: RustdocItem
	json: RustdocJson
	key: string
	kind?: RustdocItemKind
	query: DocsSymbolQuery
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

const lookupCrate = (json: RustdocJson) => {
	const root = ensureRoot(json)
	const buckets = collectCrateBuckets(json, root)

	return formatCrate(json, root, buckets)
}

const lookupCrateDocs = (json: RustdocJson) => {
	const root = ensureRoot(json)
	return formatCrateDocs(root)
}

const lookupSymbol = (json: RustdocJson, input: DocsSymbolRequest) => {
	ensureRoot(json)
	const indexPaths = buildIndexPaths(json)
	const query = parseSymbolQuery(input)

	const best = Object.entries(json.index)
		.map(([key, item]) => {
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
		.filter((candidate) => candidate.score >= 0)
		.sort((left, right) => right.score - left.score)[0]

	if (!best) {
		return null
	}

	return formatItem(best.item, best.kind ?? json.paths[best.key]?.kind, query.expandDocs)
}

export { lookupCrate, lookupCrateDocs, lookupSymbol }
