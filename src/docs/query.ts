import { RustdocParseError } from "../errors.ts"
import type {
	CrateBuckets,
	DocsSymbolQuery,
	RustdocItem,
	RustdocItemKind,
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
} as const satisfies Record<string, RustdocItemKind>

const KIND_LABELS = {
	enum: "Enum",
	function: "Function",
	impl: "Implementation",
	module: "Module",
	struct: "Struct",
	trait: "Trait",
	typedef: "Type Alias"
} as const satisfies Partial<Record<RustdocItemKind, string>>

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

const toSummaryLine = (item: RustdocItem) =>
	`- **${item.name ?? "unknown"}**${item.docs ? `: ${getFirstLine(item.docs)}` : ""}`

const ensureRoot = (json: RustdocJson) => {
	if (!(json.root && json.index && json.paths)) {
		throw new RustdocParseError("Invalid rustdoc JSON structure: missing root, index, or paths")
	}

	const root = json.index[json.root]
	if (!root) {
		throw new RustdocParseError(`Root item '${json.root}' not found in index`)
	}

	return root
}

const getKindFromItem = (item: RustdocItem): RustdocItemKind | undefined => {
	if (!item.inner) {
		return
	}
	if (item.inner.module) {
		return "module"
	}
	if (item.inner.struct) {
		return "struct"
	}
	if (item.inner.enum) {
		return "enum"
	}
	if (item.inner.function) {
		return "function"
	}
	if (item.inner.trait) {
		return "trait"
	}
	if (item.inner.typedef) {
		return "typedef"
	}
	if (item.inner.impl) {
		return "impl"
	}

	return
}

const getKindLabel = (kind: RustdocItemKind | undefined) => {
	switch (kind) {
		case "enum":
		case "function":
		case "impl":
		case "module":
		case "struct":
		case "trait":
		case "typedef":
			return KIND_LABELS[kind]
		default:
			return
	}
}

const toKindLabel = (kind: RustdocItemKind | undefined, item: RustdocItem) =>
	getKindLabel(kind) ?? getKindLabel(getKindFromItem(item)) ?? "Unknown"

const formatFunctionDetails = (item: RustdocItem) => {
	const header = item.inner?.function?.header
	if (!header) {
		return []
	}

	const flags = [
		header.const === true ? "const" : "",
		header.async === true ? "async" : "",
		header.unsafe === true ? "unsafe" : ""
	].filter(Boolean)

	return flags.length > 0
		? [
				`**Attributes:** ${flags.join(", ")}`
			]
		: []
}

const formatStructDetails = (item: RustdocItem) => {
	const details = item.inner?.struct
	if (!details) {
		return []
	}
	const fieldCount = details.fields?.length ?? 0
	const implCount = details.impls?.length ?? 0

	return [
		`**Struct Type:** ${details.struct_type}`,
		fieldCount > 0 ? `**Fields:** ${fieldCount}` : "",
		implCount > 0 ? `**Implementations:** ${implCount}` : ""
	].filter(Boolean)
}

const formatEnumDetails = (item: RustdocItem) => {
	const details = item.inner?.enum
	if (!details) {
		return []
	}
	const variantCount = details.variants?.length ?? 0
	const implCount = details.impls?.length ?? 0

	return [
		variantCount > 0 ? `**Variants:** ${variantCount}` : "",
		implCount > 0 ? `**Implementations:** ${implCount}` : ""
	].filter(Boolean)
}

const formatTraitDetails = (item: RustdocItem) => {
	const details = item.inner?.trait
	if (!details) {
		return []
	}

	const flags = [
		details.is_auto ? "auto" : "",
		details.is_unsafe ? "unsafe" : ""
	].filter(Boolean)
	return [
		flags.length > 0 ? `**Attributes:** ${flags.join(", ")}` : "",
		details.items.length > 0 ? `**Items:** ${details.items.length}` : ""
	].filter(Boolean)
}

const formatItem = (item: RustdocItem, kind?: RustdocItemKind) =>
	[
		item.name ? `# ${item.name}` : "",
		`**Type:** ${toKindLabel(kind, item)}`,
		item.visibility === "public" ? "" : `**Visibility:** ${item.visibility}`,
		item.docs ? `## Documentation\n${item.docs}` : "",
		item.deprecation ? "**Deprecated:** yes" : "",
		...formatStructDetails(item),
		...formatEnumDetails(item),
		...formatFunctionDetails(item),
		...formatTraitDetails(item)
	]
		.filter(Boolean)
		.join("\n\n")

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

const createBuckets = (): CrateBuckets => ({
	enums: [],
	functions: [],
	modules: [],
	structs: [],
	traits: []
})

const addSummaryLine = (buckets: CrateBuckets, item: RustdocItem) => {
	const line = toSummaryLine(item)
	if (item.inner?.module) {
		buckets.modules.push(line)
		return
	}
	if (item.inner?.struct) {
		buckets.structs.push(line)
		return
	}
	if (item.inner?.enum) {
		buckets.enums.push(line)
		return
	}
	if (item.inner?.trait) {
		buckets.traits.push(line)
		return
	}
	if (item.inner?.function) {
		buckets.functions.push(line)
	}
}

const collectCrateBuckets = (json: RustdocJson, root: RustdocItem) => {
	const buckets = createBuckets()

	for (const itemId of root.inner?.module?.items ?? []) {
		const item = json.index[itemId]
		if (!item || item.visibility !== "public") {
			continue
		}

		addSummaryLine(buckets, item)
	}

	return buckets
}

const formatCrate = (json: RustdocJson) => {
	const root = ensureRoot(json)
	const buckets = collectCrateBuckets(json, root)

	return [
		root.name ? `# Crate: ${root.name}${json.crate_version ? ` v${json.crate_version}` : ""}` : "",
		root.docs ? `## Documentation\n${root.docs}` : "",
		buckets.modules.length > 0 ? `## Modules\n${buckets.modules.join("\n")}` : "",
		buckets.structs.length > 0 ? `## Structs\n${buckets.structs.join("\n")}` : "",
		buckets.enums.length > 0 ? `## Enums\n${buckets.enums.join("\n")}` : "",
		buckets.traits.length > 0 ? `## Traits\n${buckets.traits.join("\n")}` : "",
		buckets.functions.length > 0 ? `## Functions\n${buckets.functions.join("\n")}` : ""
	]
		.filter(Boolean)
		.join("\n\n")
}

export { formatCrate, lookupItem }
