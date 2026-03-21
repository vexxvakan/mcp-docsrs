// biome-ignore-all lint/style/useNamingConvention: rustdoc item kind labels use upstream snake_case tags
import { ErrorLogger } from "../../errors.ts"
import { getKindFromItem } from "../shared.ts"
import type { RustdocItem, RustdocItemKind } from "../types.ts"
import {
	formatAliasDetails,
	formatCompositeDetails,
	formatEnumDetails,
	formatFunctionDetails,
	formatImplDetails,
	formatImportDetails,
	formatProcMacroDetails,
	formatStructDetails,
	formatTraitDetails,
	formatValueDetails
} from "./details.ts"

const KIND_LABELS = {
	assoc_const: "Associated Constant",
	assoc_type: "Associated Type",
	attribute: "Attribute",
	constant: "Constant",
	enum: "Enum",
	extern_crate: "Extern Crate",
	extern_type: "Extern Type",
	function: "Function",
	impl: "Implementation",
	keyword: "Keyword",
	macro: "Macro",
	module: "Module",
	primitive: "Primitive",
	proc_attribute: "Proc Attribute",
	proc_derive: "Proc Derive",
	static: "Static",
	struct: "Struct",
	struct_field: "Struct Field",
	trait: "Trait",
	trait_alias: "Trait Alias",
	type_alias: "Type Alias",
	union: "Union",
	use: "Use",
	variant: "Variant"
} as const satisfies Record<RustdocItemKind, string>

const toKindLabel = (kind: RustdocItemKind | undefined, item: RustdocItem) => {
	const resolvedKind = kind ?? getKindFromItem(item)
	if (resolvedKind) {
		return KIND_LABELS[resolvedKind]
	}

	ErrorLogger.logWarning("Ignoring unsupported rustdoc item kind", {
		itemId: item.id,
		itemName: item.name
	})
	return null
}

const formatItem = (item: RustdocItem, kind?: RustdocItemKind) =>
	(() => {
		const kindLabel = toKindLabel(kind, item)

		return [
			item.name ? `# ${item.name}` : "",
			kindLabel ? `**Type:** ${kindLabel}` : "",
			item.visibility === "public"
				? ""
				: `**Visibility:** ${typeof item.visibility === "string" ? item.visibility : "restricted"}`,
			item.docs ? `## Documentation\n${item.docs}` : "",
			item.deprecation ? "**Deprecated:** yes" : "",
			...formatStructDetails(item),
			...formatEnumDetails(item),
			...formatFunctionDetails(item),
			...formatTraitDetails(item),
			...formatAliasDetails(item),
			...formatImplDetails(item),
			...formatImportDetails(item),
			...formatValueDetails(item),
			...formatProcMacroDetails(item),
			...formatCompositeDetails(item)
		]
			.filter(Boolean)
			.join("\n\n")
	})()

export { formatItem }
