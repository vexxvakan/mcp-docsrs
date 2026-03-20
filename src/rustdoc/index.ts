import { ErrorLogger, RustdocParseError } from "../errors.ts"
import type { JsonObject } from "../shared/types.ts"
import type { RustdocItem, RustdocJson } from "./types.ts"

const MAX_PREVIEW_LENGTH = 100
const PREVIEW_SUFFIX_LENGTH = 3

const getFirstLine = (docs: string) => {
	const [firstLine = ""] = docs.split("\n")
	const trimmed = firstLine.trim()
	return trimmed.length > MAX_PREVIEW_LENGTH
		? `${trimmed.slice(0, MAX_PREVIEW_LENGTH - PREVIEW_SUFFIX_LENGTH)}...`
		: trimmed
}

const getItemKind = (item: RustdocItem) => {
	if (!item.inner) {
		return "Unknown"
	}
	if (item.inner.struct) {
		return "Struct"
	}
	if (item.inner.enum) {
		return "Enum"
	}
	if (item.inner.function) {
		return "Function"
	}
	if (item.inner.trait) {
		return "Trait"
	}
	if (item.inner.module) {
		return "Module"
	}
	if (item.inner.typedef) {
		return "Type Alias"
	}
	if (item.inner.impl) {
		return "Implementation"
	}

	return "Unknown"
}

const toEntry = (item: RustdocItem) =>
	`- **${item.name ?? "unknown"}**${item.docs ? `: ${getFirstLine(item.docs)}` : ""}`

const readModuleItems = (json: RustdocJson, parentId: string) =>
	json.index[parentId]?.inner?.module?.items ?? []

const extractModules = (json: RustdocJson, parentId: string) =>
	readModuleItems(json, parentId)
		.map((itemId) => json.index[itemId])
		.filter((item): item is RustdocItem =>
			Boolean(item?.inner?.module && item.visibility === "public")
		)
		.map(toEntry)

const extractTypes = (json: RustdocJson, parentId: string) => {
	const entries = readModuleItems(json, parentId)
		.map((itemId) => json.index[itemId])
		.filter((item): item is RustdocItem => Boolean(item && item.visibility === "public"))

	return {
		enums: entries.filter((item) => Boolean(item.inner?.enum)).map(toEntry),
		structs: entries.filter((item) => Boolean(item.inner?.struct)).map(toEntry),
		traits: entries.filter((item) => Boolean(item.inner?.trait)).map(toEntry)
	}
}

const extractFunctions = (json: RustdocJson, parentId: string) =>
	readModuleItems(json, parentId)
		.map((itemId) => json.index[itemId])
		.filter((item): item is RustdocItem =>
			Boolean(item?.inner?.function && item.visibility === "public")
		)
		.map(toEntry)

const formatStructDetails = (item: RustdocItem) => {
	const structData = item.inner?.struct
	if (!structData) {
		return []
	}

	const fields = structData.fields ?? []
	const impls = structData.impls ?? []

	return [
		`**Struct Type:** ${structData.struct_type}`,
		fields.length > 0 ? `**Fields:** ${fields.length}` : "",
		impls.length > 0 ? `**Implementations:** ${impls.length}` : ""
	].filter(Boolean)
}

const formatEnumDetails = (item: RustdocItem) => {
	const enumData = item.inner?.enum
	if (!enumData) {
		return []
	}

	const variants = enumData.variants ?? []
	const impls = enumData.impls ?? []

	return [
		variants.length > 0 ? `**Variants:** ${variants.length}` : "",
		impls.length > 0 ? `**Implementations:** ${impls.length}` : ""
	].filter(Boolean)
}

const hasFlag = (header: JsonObject | undefined, key: string) => header?.[key] === true

const formatFunctionDetails = (item: RustdocItem) => {
	const header = item.inner?.function?.header
	if (!header) {
		return []
	}

	const flags = [
		"const",
		"async",
		"unsafe"
	].filter((flag) => hasFlag(header, flag))
	return flags.length > 0
		? [
				`**Attributes:** ${flags.join(", ")}`
			]
		: []
}

const formatTraitDetails = (item: RustdocItem) => {
	const traitData = item.inner?.trait
	if (!traitData) {
		return []
	}

	const flags = [
		traitData.is_auto ? "auto" : "",
		traitData.is_unsafe ? "unsafe" : ""
	].filter(Boolean)

	return [
		flags.length > 0 ? `**Attributes:** ${flags.join(", ")}` : "",
		traitData.items.length > 0 ? `**Items:** ${traitData.items.length}` : ""
	].filter(Boolean)
}

const formatItem = (item: RustdocItem, kind = getItemKind(item)) => {
	const sections = [
		item.name ? `# ${item.name}` : "",
		kind ? `**Type:** ${kind}` : "",
		item.visibility === "public" ? "" : `**Visibility:** ${item.visibility}`,
		item.docs ? `## Documentation\n${item.docs}` : "",
		item.deprecation ? "**Deprecated:** yes" : "",
		...formatStructDetails(item),
		...formatEnumDetails(item),
		...formatFunctionDetails(item),
		...formatTraitDetails(item)
	].filter(Boolean)

	return sections.join("\n\n")
}

const ensureRustdocJson = (json: RustdocJson) => {
	if (!(json.root && json.index)) {
		throw new RustdocParseError("Invalid rustdoc JSON structure: missing root or index")
	}

	const rootItem = json.index[json.root]
	if (!rootItem) {
		throw new RustdocParseError(`Root item '${json.root}' not found in index`)
	}

	return rootItem
}

const parseCrateInfo = (json: RustdocJson) => {
	try {
		const rootItem = ensureRustdocJson(json)
		const modules = extractModules(json, json.root)
		const types = extractTypes(json, json.root)
		const functions = extractFunctions(json, json.root)
		return [
			rootItem.name
				? `# Crate: ${rootItem.name}${json.crate_version ? ` v${json.crate_version}` : ""}`
				: "",
			rootItem.docs ? `## Documentation\n${rootItem.docs}` : "",
			modules.length > 0 ? `## Modules\n${modules.join("\n")}` : "",
			types.structs.length > 0 ? `## Structs\n${types.structs.join("\n")}` : "",
			types.enums.length > 0 ? `## Enums\n${types.enums.join("\n")}` : "",
			types.traits.length > 0 ? `## Traits\n${types.traits.join("\n")}` : "",
			functions.length > 0 ? `## Functions\n${functions.join("\n")}` : ""
		]
			.filter(Boolean)
			.join("\n\n")
	} catch (error) {
		ErrorLogger.log(error)
		throw error instanceof RustdocParseError
			? error
			: new RustdocParseError((error as Error).message)
	}
}

const findItem = (json: RustdocJson, itemPath: string) => {
	try {
		ensureRustdocJson(json)

		for (const [id, pathInfo] of Object.entries(json.paths)) {
			const fullPath = pathInfo.path.join("::")
			const lastSegment = pathInfo.path.at(-1)
			if (fullPath.endsWith(itemPath) || lastSegment === itemPath) {
				const item = json.index[id]
				if (item) {
					return formatItem(item, pathInfo.kind)
				}
			}
		}

		const searchName = itemPath.split(".").pop() ?? itemPath
		for (const item of Object.values(json.index)) {
			if (item.name === searchName) {
				return formatItem(item)
			}
		}

		return null
	} catch (error) {
		ErrorLogger.log(error)
		throw error instanceof RustdocParseError
			? error
			: new RustdocParseError(`Failed to find item '${itemPath}': ${(error as Error).message}`)
	}
}

export { findItem, parseCrateInfo }
