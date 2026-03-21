// biome-ignore-all lint/style/useNamingConvention: rustdoc item kind tags use upstream snake_case
import { RustdocParseError } from "../errors.ts"
import type {
	RustdocId,
	RustdocItem,
	RustdocItemInner,
	RustdocItemKind,
	RustdocJson
} from "./types.ts"

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
	Exclude<RustdocItemKind, "attribute" | "keyword" | "proc_attribute" | "proc_derive">,
	RustdocItemKind
>

const toIdKey = (id: RustdocId) => String(id)

const getItemById = (json: RustdocJson, id: RustdocId) => json.index[toIdKey(id)]

const ensureRoot = (json: RustdocJson) => {
	if (json.root === undefined || !json.index || !json.paths) {
		throw new RustdocParseError("Invalid rustdoc JSON structure: missing root, index, or paths")
	}

	const root = getItemById(json, json.root)
	if (!root) {
		throw new RustdocParseError(`Root item '${json.root}' not found in index`)
	}

	return root
}

const getItemInnerTag = (inner: RustdocItemInner): string | undefined => {
	if (typeof inner === "string") {
		return inner
	}

	return Object.keys(inner)[0]
}

const getKindFromItem = (item: RustdocItem): RustdocItemKind | undefined => {
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

export { ensureRoot, getItemById, getItemInnerTag, getKindFromItem, toIdKey }
