// biome-ignore-all lint/style/useNamingConvention: rustdoc kind aliases follow upstream snake_case naming

import type { Crate, Item, ItemKind } from "@mcp-docsrs/docs/rustdoc/types/items.ts"
import { ensureRoot, getItemById, getKindFromItem, toIdKey } from "@mcp-docsrs/docs/shared.ts"
import type { DocsSymbolRequest } from "@mcp-docsrs/docs/types.ts"
import type { CandidateScoreInput, DocsSymbolQuery, SymbolMatch } from "./types.ts"

const MAX_PREVIEW_LENGTH = 100
const PREVIEW_SUFFIX = "..."
const KIND_MATCH_SCORE = 10
const NAME_MATCH_SCORE = 10
const INDEX_PATH_MATCH_SCORE = 100
const SUMMARY_PATH_MATCH_SCORE = 50
const SUMMARY_KIND_MATCH_SCORE = 1

const KIND_ALIASES: Record<string, ItemKind> = {
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
}

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

const parseSymbolQuery = (input: DocsSymbolRequest): DocsSymbolQuery => {
	const normalizedType = input.symbolType.trim().toLowerCase()
	const kind = KIND_ALIASES[normalizedType as keyof typeof KIND_ALIASES]
	const pathText = input.symbolname.trim()
	const segments = pathText.split("::").filter(Boolean)
	const name = segments.at(-1) ?? pathText.split(".").at(-1) ?? pathText

	return {
		kind,
		name,
		segments
	}
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

const scoreCandidate = ({ indexPaths, item, json, key, kind, query }: CandidateScoreInput) => {
	if (item.name !== query.name) {
		return -1
	}
	if (!query.kind || kind !== query.kind) {
		return -1
	}

	let score = NAME_MATCH_SCORE + KIND_MATCH_SCORE

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

export { findSymbol, getFirstLine, getVisibility }
