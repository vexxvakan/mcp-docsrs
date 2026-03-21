import { getKindFromItem } from "./shared.ts"
import type { CrateBuckets, RustdocItem, RustdocItemKind, RustdocJson } from "./types.ts"

const KIND_LABELS = {
	enum: "Enum",
	function: "Function",
	impl: "Implementation",
	module: "Module",
	struct: "Struct",
	trait: "Trait",
	typedef: "Type Alias"
} as const satisfies Partial<Record<RustdocItemKind, string>>

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

const formatCrate = (json: RustdocJson, root: RustdocItem, buckets: CrateBuckets) =>
	[
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

export { formatCrate, formatItem }
