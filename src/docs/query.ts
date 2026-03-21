import { formatCrate, formatItem } from "./format.ts"
import { ensureRoot, getKindFromItem } from "./shared.ts"
import type {
	CrateBuckets,
	DocsSymbolQuery,
	RustdocItem,
	RustdocJson,
	RustdocPath
} from "./types.ts"

const MAX_PREVIEW_LENGTH = 100
const PREVIEW_SUFFIX = "..."
const SYMBOL_KIND_PATTERN = /^([a-z_]+)\.(.+)$/

const KIND_ALIASES = {
	enum: "enum",
	fn: "function",
	function: "function",
	impl: "impl",
	mod: "module",
	module: "module",
	struct: "struct",
	trait: "trait",
	type: "typedef",
	typedef: "typedef"
} as const

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
	const buckets: CrateBuckets = {
		enums: [],
		functions: [],
		modules: [],
		structs: [],
		traits: []
	}

	for (const itemId of root.inner?.module?.items ?? []) {
		const item = json.index[itemId]
		if (!item || item.visibility !== "public") {
			continue
		}

		const line = `- **${item.name ?? "unknown"}**${item.docs ? `: ${getFirstLine(item.docs)}` : ""}`
		switch (getKindFromItem(item)) {
			case "module":
				buckets.modules.push(line)
				break
			case "struct":
				buckets.structs.push(line)
				break
			case "enum":
				buckets.enums.push(line)
				break
			case "trait":
				buckets.traits.push(line)
				break
			case "function":
				buckets.functions.push(line)
				break
			default:
				break
		}
	}

	return buckets
}

const parseSymbolPath = (symbolPath: string) => {
	const trimmed = symbolPath.trim()
	const kindMatch = SYMBOL_KIND_PATTERN.exec(trimmed)
	const kind = kindMatch ? KIND_ALIASES[kindMatch[1] as keyof typeof KIND_ALIASES] : undefined
	const pathText = kind && kindMatch ? kindMatch[2] : trimmed
	const segments = pathText.split("::").filter(Boolean)
	const name = segments.at(-1) ?? pathText.split(".").at(-1) ?? pathText

	return {
		kind,
		name,
		segments
	} satisfies DocsSymbolQuery
}

const matchByPath = (
	entries: [
		string,
		RustdocPath
	][],
	query: DocsSymbolQuery
) => {
	let fallbackId: string | null = null

	for (const [id, path] of entries) {
		if (query.kind && path.kind !== query.kind) {
			continue
		}
		if (query.segments.length > 1 && hasPathSuffix(path.path, query.segments)) {
			return id
		}
		if (!fallbackId && path.path.at(-1) === query.name) {
			fallbackId = id
		}
	}

	return fallbackId
}

const lookupCrate = (json: RustdocJson) => {
	const root = ensureRoot(json)
	const buckets = collectCrateBuckets(json, root)

	return formatCrate(json, root, buckets)
}

const lookupItem = (json: RustdocJson, symbolPath: string) => {
	ensureRoot(json)
	const query = parseSymbolPath(symbolPath)
	const pathEntries = Object.entries(json.paths)
	const pathMatch = matchByPath(pathEntries, query)
	if (pathMatch) {
		const item = json.index[pathMatch]
		if (item) {
			return formatItem(item, json.paths[pathMatch]?.kind)
		}
	}

	for (const item of Object.values(json.index)) {
		if (item.name === query.name && (!query.kind || getKindFromItem(item) === query.kind)) {
			return formatItem(item)
		}
	}

	return null
}

export { lookupCrate, lookupItem }
