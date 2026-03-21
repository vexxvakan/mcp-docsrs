// biome-ignore-all lint/style/useNamingConvention: rustdoc item kind tags use upstream snake_case
import { RustdocParseError } from "../errors.ts"
import type { Id } from "./rustdoc/types/core.ts"
import type { Crate, Item, ItemEnum, ItemKind } from "./rustdoc/types/items.ts"

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
} as const satisfies Record<ItemKind, string>

const ITEM_KIND_BY_TAG = {
	assoc_const: "assoc_const",
	assoc_type: "assoc_type",
	constant: "constant",
	enum: "enum",
	extern_crate: "extern_crate",
	extern_type: "extern_type",
	function: "function",
	impl: "impl",
	macro: "macro",
	module: "module",
	primitive: "primitive",
	static: "static",
	struct: "struct",
	struct_field: "struct_field",
	trait: "trait",
	trait_alias: "trait_alias",
	type_alias: "type_alias",
	union: "union",
	use: "use",
	variant: "variant"
} as const satisfies Record<
	Exclude<ItemKind, "attribute" | "keyword" | "proc_attribute" | "proc_derive">,
	ItemKind
>

const toIdKey = (id: Id) => String(id)

const getItemById = (json: Crate, id: Id) => json.index[toIdKey(id)]

const ensureRoot = (json: Crate) => {
	if (json.root === undefined || !json.index || !json.paths) {
		throw new RustdocParseError("Invalid rustdoc JSON structure: missing root, index, or paths")
	}

	const root = getItemById(json, json.root)
	if (!root) {
		throw new RustdocParseError(`Root item '${json.root}' not found in index`)
	}

	return root
}

const getItemInnerTag = (inner: ItemEnum): string | undefined => {
	if (typeof inner === "string") {
		return inner
	}

	return Object.keys(inner)[0]
}

const getKindFromItem = (item: Item): ItemKind | undefined => {
	const tag = getItemInnerTag(item.inner)
	if (!tag) {
		return
	}

	if (tag !== "proc_macro") {
		return ITEM_KIND_BY_TAG[tag as keyof typeof ITEM_KIND_BY_TAG]
	}

	if (typeof item.inner !== "object" || !("proc_macro" in item.inner)) {
		return
	}

	switch (item.inner.proc_macro.kind) {
		case "attr":
			return "proc_attribute"
		case "derive":
			return "proc_derive"
		case "bang":
			return "macro"
		default:
			return
	}
}

export { ensureRoot, getItemById, getItemInnerTag, getKindFromItem, KIND_LABELS, toIdKey }
