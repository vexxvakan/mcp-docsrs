import type { RustdocItem, RustdocStructKind, RustdocVariantKind } from "../types.ts"
import { formatGenericDetails, formatInlineValue } from "./render.ts"

const withLabel = (label: string, value: string | null) => (value ? `**${label}:** ${value}` : "")

const getStructShape = (kind: RustdocStructKind) => {
	if (kind === "unit") {
		return {
			fieldCount: 0,
			label: "unit"
		}
	}
	if ("tuple" in kind) {
		return {
			fieldCount: kind.tuple.length,
			label: "tuple"
		}
	}

	return {
		fieldCount: kind.plain.fields.length,
		label: "plain"
	}
}

const getVariantShape = (kind: RustdocVariantKind) => {
	if (kind === "plain") {
		return {
			fieldCount: 0,
			label: "plain"
		}
	}
	if ("tuple" in kind) {
		return {
			fieldCount: kind.tuple.length,
			label: "tuple"
		}
	}

	return {
		fieldCount: kind.struct.fields.length,
		label: "struct"
	}
}

const formatFunctionDetails = (item: RustdocItem) => {
	const details =
		typeof item.inner === "object" && "function" in item.inner ? item.inner.function : null
	if (!details) {
		return []
	}

	const flags = [
		details.header.is_const ? "const" : "",
		details.header.is_async ? "async" : "",
		details.header.is_unsafe ? "unsafe" : ""
	].filter(Boolean)

	return [
		...formatGenericDetails(details.generics),
		flags.length > 0 ? `**Attributes:** ${flags.join(", ")}` : ""
	].filter(Boolean)
}

const formatStructDetails = (item: RustdocItem) => {
	const details =
		typeof item.inner === "object" && "struct" in item.inner ? item.inner.struct : null
	if (!details) {
		return []
	}

	const shape = getStructShape(details.kind)
	const implCount = details.impls.length

	return [
		...formatGenericDetails(details.generics),
		`**Struct Type:** ${shape.label}`,
		shape.fieldCount > 0 ? `**Fields:** ${shape.fieldCount}` : "",
		implCount > 0 ? `**Implementations:** ${implCount}` : ""
	].filter(Boolean)
}

const formatEnumDetails = (item: RustdocItem) => {
	const details = typeof item.inner === "object" && "enum" in item.inner ? item.inner.enum : null
	if (!details) {
		return []
	}

	const variantCount = details.variants.length
	const implCount = details.impls.length

	return [
		...formatGenericDetails(details.generics),
		variantCount > 0 ? `**Variants:** ${variantCount}` : "",
		implCount > 0 ? `**Implementations:** ${implCount}` : "",
		details.has_stripped_variants ? "**Stripped Variants:** yes" : ""
	].filter(Boolean)
}

const formatTraitDetails = (item: RustdocItem) => {
	const details = typeof item.inner === "object" && "trait" in item.inner ? item.inner.trait : null
	if (!details) {
		return []
	}

	const flags = [
		details.is_auto ? "auto" : "",
		details.is_unsafe ? "unsafe" : "",
		details.is_dyn_compatible ? "dyn compatible" : ""
	].filter(Boolean)

	return [
		...formatGenericDetails(details.generics),
		details.bounds.length > 0 ? `**Bounds:** ${details.bounds.length}` : "",
		flags.length > 0 ? `**Attributes:** ${flags.join(", ")}` : "",
		details.items.length > 0 ? `**Items:** ${details.items.length}` : "",
		details.implementations.length > 0
			? `**Implementations:** ${details.implementations.length}`
			: ""
	].filter(Boolean)
}

const formatAliasDetails = (item: RustdocItem) => {
	if (typeof item.inner !== "object") {
		return []
	}
	if ("type_alias" in item.inner) {
		const typeText = formatInlineValue(item.inner.type_alias.type, {
			field: "type_alias.type",
			itemId: item.id,
			itemName: item.name
		})

		return [
			...formatGenericDetails(item.inner.type_alias.generics),
			withLabel("Aliased Type", typeText)
		].filter(Boolean)
	}
	if ("assoc_type" in item.inner) {
		const typeText = item.inner.assoc_type.type
			? formatInlineValue(item.inner.assoc_type.type, {
					field: "assoc_type.type",
					itemId: item.id,
					itemName: item.name
				})
			: null

		return [
			...formatGenericDetails(item.inner.assoc_type.generics),
			item.inner.assoc_type.bounds.length > 0
				? `**Bounds:** ${item.inner.assoc_type.bounds.length}`
				: "",
			withLabel("Assigned Type", typeText)
		].filter(Boolean)
	}

	return []
}

const formatImplDetails = (item: RustdocItem) => {
	const details = typeof item.inner === "object" && "impl" in item.inner ? item.inner.impl : null
	if (!details) {
		return []
	}

	const flags = [
		details.is_unsafe ? "unsafe" : "",
		details.is_negative ? "negative" : "",
		details.is_synthetic ? "synthetic" : ""
	].filter(Boolean)

	return [
		...formatGenericDetails(details.generics),
		withLabel(
			"Trait",
			details.trait
				? formatInlineValue(details.trait, {
						field: "impl.trait",
						itemId: item.id,
						itemName: item.name
					})
				: null
		),
		withLabel(
			"For",
			formatInlineValue(details.for, {
				field: "impl.for",
				itemId: item.id,
				itemName: item.name
			})
		),
		flags.length > 0 ? `**Attributes:** ${flags.join(", ")}` : "",
		details.items.length > 0 ? `**Items:** ${details.items.length}` : "",
		details.provided_trait_methods.length > 0
			? `**Provided Methods:** ${details.provided_trait_methods.join(", ")}`
			: "",
		withLabel(
			"Blanket Impl",
			details.blanket_impl
				? formatInlineValue(details.blanket_impl, {
						field: "impl.blanket_impl",
						itemId: item.id,
						itemName: item.name
					})
				: null
		)
	].filter(Boolean)
}

const formatImportDetails = (item: RustdocItem) => {
	if (typeof item.inner !== "object") {
		return []
	}
	if ("use" in item.inner) {
		return [
			`**Source:** ${item.inner.use.source}`,
			`**Import:** ${item.inner.use.name}`,
			item.inner.use.is_glob ? "**Glob:** yes" : "",
			item.inner.use.id === null ? "" : `**Target Id:** ${item.inner.use.id}`
		].filter(Boolean)
	}
	if ("module" in item.inner) {
		return [
			item.inner.module.items.length > 0 ? `**Items:** ${item.inner.module.items.length}` : "",
			item.inner.module.is_crate ? "**Crate Root:** yes" : "",
			item.inner.module.is_stripped ? "**Stripped:** yes" : ""
		].filter(Boolean)
	}

	return []
}

const formatValueDetails = (item: RustdocItem) => {
	if (typeof item.inner !== "object") {
		return []
	}
	if ("constant" in item.inner) {
		const typeText = formatInlineValue(item.inner.constant.type, {
			field: "constant.type",
			itemId: item.id,
			itemName: item.name
		})
		const valueText = formatInlineValue(item.inner.constant.const, {
			field: "constant.const",
			itemId: item.id,
			itemName: item.name
		})

		return [
			withLabel("Declared Type", typeText),
			withLabel("Value", valueText)
		].filter(Boolean)
	}
	if ("assoc_const" in item.inner) {
		const typeText = formatInlineValue(item.inner.assoc_const.type, {
			field: "assoc_const.type",
			itemId: item.id,
			itemName: item.name
		})

		return [
			withLabel("Declared Type", typeText),
			item.inner.assoc_const.value === null ? "" : `**Value:** ${item.inner.assoc_const.value}`
		].filter(Boolean)
	}
	if ("static" in item.inner) {
		const typeText = formatInlineValue(item.inner.static.type, {
			field: "static.type",
			itemId: item.id,
			itemName: item.name
		})
		const flags = [
			item.inner.static.is_mutable ? "mutable" : "",
			item.inner.static.is_unsafe ? "unsafe" : ""
		].filter(Boolean)

		return [
			withLabel("Declared Type", typeText),
			`**Expression:** ${item.inner.static.expr}`,
			flags.length > 0 ? `**Attributes:** ${flags.join(", ")}` : ""
		].filter(Boolean)
	}

	return []
}

const formatProcMacroDetails = (item: RustdocItem) => {
	const details =
		typeof item.inner === "object" && "proc_macro" in item.inner ? item.inner.proc_macro : null
	if (!details) {
		return []
	}

	return [
		details.helpers.length > 0 ? `**Helpers:** ${details.helpers.join(", ")}` : ""
	].filter(Boolean)
}

const formatCompositeDetails = (item: RustdocItem) => {
	if (typeof item.inner !== "object") {
		return []
	}
	if ("union" in item.inner) {
		return [
			...formatGenericDetails(item.inner.union.generics),
			item.inner.union.fields.length > 0 ? `**Fields:** ${item.inner.union.fields.length}` : "",
			item.inner.union.impls.length > 0
				? `**Implementations:** ${item.inner.union.impls.length}`
				: "",
			item.inner.union.has_stripped_fields ? "**Stripped Fields:** yes" : ""
		].filter(Boolean)
	}
	if ("variant" in item.inner) {
		const shape = getVariantShape(item.inner.variant.kind)
		return [
			`**Variant Type:** ${shape.label}`,
			shape.fieldCount > 0 ? `**Fields:** ${shape.fieldCount}` : "",
			item.inner.variant.discriminant
				? `**Discriminant:** ${item.inner.variant.discriminant.expr}`
				: ""
		].filter(Boolean)
	}
	if ("struct_field" in item.inner) {
		const fieldType = formatInlineValue(item.inner.struct_field, {
			field: "struct_field.type",
			itemId: item.id,
			itemName: item.name
		})

		return [
			withLabel("Field Type", fieldType)
		].filter(Boolean)
	}

	return []
}

export {
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
}
