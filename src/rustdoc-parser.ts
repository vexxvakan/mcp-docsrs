import { ErrorLogger, RustdocParseError } from "./errors.js"
import type { RustdocItem, RustdocJson } from "./types.js"

// Helper functions
const getFirstLine = (docs: string): string => {
	const firstLine = docs.split("\n")[0].trim()
	return firstLine.length > 100 ? `${firstLine.substring(0, 97)}...` : firstLine
}

const getItemKind = (item: RustdocItem): string => {
	if (!item.inner) return "Unknown"

	if (item.inner.struct) return "Struct"
	if (item.inner.enum) return "Enum"
	if (item.inner.function) return "Function"
	if (item.inner.trait) return "Trait"
	if (item.inner.module) return "Module"
	if (item.inner.typedef) return "Type Alias"
	if (item.inner.impl) return "Implementation"

	return "Unknown"
}

// Extract modules from a parent item
const extractModules = (json: RustdocJson, parentId: string): string[] => {
	const modules: string[] = []
	const parentItem = json.index[parentId]

	if (parentItem?.inner?.module?.items) {
		for (const itemId of parentItem.inner.module.items) {
			const item = json.index[itemId]
			if (item?.inner?.module && item.visibility === "public") {
				const desc = item.docs ? `: ${getFirstLine(item.docs)}` : ""
				modules.push(`- **${item.name}**${desc}`)
			}
		}
	}

	return modules
}

// Extract types (structs, enums, traits) from a parent item
const extractTypes = (
	json: RustdocJson,
	parentId: string
): {
	structs: string[]
	enums: string[]
	traits: string[]
} => {
	const result = {
		structs: [] as string[],
		enums: [] as string[],
		traits: [] as string[]
	}

	const parentItem = json.index[parentId]
	const items = parentItem?.inner?.module?.items || []

	for (const itemId of items) {
		const item = json.index[itemId]
		if (!item || item.visibility !== "public") continue

		const desc = item.docs ? `: ${getFirstLine(item.docs)}` : ""
		const entry = `- **${item.name}**${desc}`

		if (item.inner?.struct) {
			result.structs.push(entry)
		} else if (item.inner?.enum) {
			result.enums.push(entry)
		} else if (item.inner?.trait) {
			result.traits.push(entry)
		}
	}

	return result
}

// Extract functions from a parent item
const extractFunctions = (json: RustdocJson, parentId: string): string[] => {
	const functions: string[] = []
	const parentItem = json.index[parentId]
	const items = parentItem?.inner?.module?.items || []

	for (const itemId of items) {
		const item = json.index[itemId]
		if (item?.inner?.function && item.visibility === "public") {
			const desc = item.docs ? `: ${getFirstLine(item.docs)}` : ""
			functions.push(`- **${item.name}**${desc}`)
		}
	}

	return functions
}

// Format struct details
const formatStruct = (struct: any): string[] => {
	const sections: string[] = []
	sections.push(`\n**Struct Type:** ${struct.struct_type}`)

	if (struct.fields && struct.fields.length > 0) {
		sections.push("\n**Fields:** (field IDs available, would need to resolve)")
	}

	if (struct.impls && struct.impls.length > 0) {
		sections.push(`\n**Implementations:** ${struct.impls.length} impl block(s)`)
	}

	return sections
}

// Format enum details
const formatEnum = (enumData: any): string[] => {
	const sections: string[] = []

	if (enumData.variants && enumData.variants.length > 0) {
		sections.push(`\n**Variants:** ${enumData.variants.length} variant(s)`)
	}

	if (enumData.impls && enumData.impls.length > 0) {
		sections.push(`\n**Implementations:** ${enumData.impls.length} impl block(s)`)
	}

	return sections
}

// Format function details
const formatFunction = (func: any): string[] => {
	const sections: string[] = []

	if (func.header) {
		const attrs: string[] = []
		if (func.header.const) attrs.push("const")
		if (func.header.async) attrs.push("async")
		if (func.header.unsafe) attrs.push("unsafe")

		if (attrs.length > 0) {
			sections.push(`\n**Attributes:** ${attrs.join(", ")}`)
		}
	}

	return sections
}

// Format trait details
const formatTrait = (trait: any): string[] => {
	const sections: string[] = []
	const attrs: string[] = []
	if (trait.is_auto) attrs.push("auto")
	if (trait.is_unsafe) attrs.push("unsafe")

	if (attrs.length > 0) {
		sections.push(`\n**Attributes:** ${attrs.join(", ")}`)
	}

	if (trait.items && trait.items.length > 0) {
		sections.push(`\n**Items:** ${trait.items.length} associated item(s)`)
	}

	return sections
}

// Format a single item
const formatItem = (item: RustdocItem, kind?: string): string => {
	const sections: string[] = []

	// Name and type
	if (item.name) {
		sections.push(`# ${item.name}`)
	}

	// Kind/Type
	const itemKind = kind || getItemKind(item)
	if (itemKind) {
		sections.push(`\n**Type:** ${itemKind}`)
	}

	// Visibility
	if (item.visibility && item.visibility !== "public") {
		sections.push(`**Visibility:** ${item.visibility}`)
	}

	// Documentation
	if (item.docs) {
		sections.push(`\n## Documentation\n${item.docs}`)
	}

	// Deprecation notice
	if (item.deprecation) {
		sections.push("\n⚠️ **Deprecated**")
	}

	// Additional details based on inner type
	if (item.inner) {
		if (item.inner.struct) {
			sections.push(...formatStruct(item.inner.struct))
		} else if (item.inner.enum) {
			sections.push(...formatEnum(item.inner.enum))
		} else if (item.inner.function) {
			sections.push(...formatFunction(item.inner.function))
		} else if (item.inner.trait) {
			sections.push(...formatTrait(item.inner.trait))
		}
	}

	return sections.join("\n")
}

// Parse the main crate information
export const parseCrateInfo = (json: RustdocJson): string => {
	try {
		if (!json || typeof json !== "object") {
			throw new RustdocParseError("Invalid rustdoc JSON structure: not an object")
		}

		if (!json.root || !json.index) {
			throw new RustdocParseError("Invalid rustdoc JSON structure: missing root or index")
		}

		const rootItem = json.index[json.root]
		if (!rootItem) {
			throw new RustdocParseError(`Root item '${json.root}' not found in index`)
		}

		const sections: string[] = []

		// Crate name and version
		if (rootItem.name) {
			let header = `# Crate: ${rootItem.name}`
			if (json.crate_version) {
				header += ` v${json.crate_version}`
			}
			sections.push(header)
		}

		// Documentation
		if (rootItem.docs) {
			sections.push(`\n## Documentation\n${rootItem.docs}`)
		}

		// Main modules
		const modules = extractModules(json, json.root)
		if (modules.length > 0) {
			sections.push(`\n## Modules\n${modules.join("\n")}`)
		}

		// Main types
		const types = extractTypes(json, json.root)
		if (types.structs.length > 0) {
			sections.push(`\n## Structs\n${types.structs.join("\n")}`)
		}
		if (types.enums.length > 0) {
			sections.push(`\n## Enums\n${types.enums.join("\n")}`)
		}
		if (types.traits.length > 0) {
			sections.push(`\n## Traits\n${types.traits.join("\n")}`)
		}

		// Main functions
		const functions = extractFunctions(json, json.root)
		if (functions.length > 0) {
			sections.push(`\n## Functions\n${functions.join("\n")}`)
		}

		return sections.join("\n")
	} catch (error) {
		ErrorLogger.log(error as Error)
		if (error instanceof RustdocParseError) {
			throw error
		}
		throw new RustdocParseError(`Failed to parse crate info: ${(error as Error).message}`)
	}
}

// Find and parse a specific item by path
export const findItem = (json: RustdocJson, itemPath: string): string | null => {
	try {
		if (!json || typeof json !== "object") {
			throw new RustdocParseError("Invalid rustdoc JSON structure: not an object")
		}

		if (!json.paths || !json.index) {
			throw new RustdocParseError("Invalid rustdoc JSON structure: missing paths or index")
		}

		// First try to find by path in the paths index
		for (const [id, pathInfo] of Object.entries(json.paths)) {
			const fullPath = pathInfo.path.join("::")
			if (fullPath.endsWith(itemPath) || pathInfo.path[pathInfo.path.length - 1] === itemPath) {
				const item = json.index[id]
				if (item) {
					return formatItem(item, pathInfo.kind)
				}
			}
		}

		// Fallback: search through all items by name
		const searchName = itemPath.split(".").pop() || itemPath
		for (const [, item] of Object.entries(json.index)) {
			if (item.name === searchName) {
				return formatItem(item)
			}
		}

		return null
	} catch (error) {
		ErrorLogger.log(error as Error)
		if (error instanceof RustdocParseError) {
			throw error
		}
		throw new RustdocParseError(
			`Failed to find item '${itemPath}': ${(error as Error).message}`,
			itemPath
		)
	}
}
