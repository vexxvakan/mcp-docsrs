import { ErrorLogger } from "../../errors.ts"
import type { JsonObject, JsonValue } from "../rustdoc/types/system.ts"

const toObject = (value: JsonValue) =>
	typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as JsonObject)
		: null

const getArrayCount = (value: JsonValue, key: string) => {
	const object = toObject(value)
	const entries = object?.[key]
	return Array.isArray(entries) ? entries.length : 0
}

const formatScalarValue = (value: JsonValue | null) => {
	if (value === null) {
		return "none"
	}
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
		return String(value)
	}
	if (Array.isArray(value)) {
		return value.length > 0 ? value.map((entry) => formatInlineValue(entry)).join(", ") : "[]"
	}

	return null
}

const formatPathLikeObject = (object: JsonObject) => {
	if (typeof object.path === "string") {
		return object.path
	}
	if (typeof object.primitive === "string") {
		return object.primitive
	}
	if (typeof object.generic === "string") {
		return object.generic
	}
	if (typeof object.expr === "string") {
		return object.expr
	}

	return null
}

const formatReferenceObject = (object: JsonObject) => {
	if ("resolved_path" in object) {
		return formatInlineValue(object.resolved_path as JsonValue)
	}
	if ("borrowed_ref" in object) {
		const reference = toObject(object.borrowed_ref as JsonValue)
		const inner = reference
			? formatInlineValue((reference.type ?? null) as JsonValue | null)
			: "unknown"
		return `${reference?.is_mutable === true ? "&mut " : "&"}${inner}`
	}
	if ("raw_pointer" in object) {
		const pointer = toObject(object.raw_pointer as JsonValue)
		const inner = pointer
			? formatInlineValue((pointer.type ?? null) as JsonValue | null)
			: "unknown"
		return `${pointer?.is_mutable === true ? "*mut " : "*const "}${inner}`
	}

	return null
}

const formatCollectionObject = (object: JsonObject) => {
	if ("tuple" in object) {
		const entries = Array.isArray(object.tuple) ? object.tuple : []
		return `(${entries.map((entry) => formatInlineValue(entry)).join(", ")})`
	}
	if ("slice" in object) {
		return `[${formatInlineValue(object.slice as JsonValue)}]`
	}
	if ("array" in object) {
		const array = toObject(object.array as JsonValue)
		const itemType = formatInlineValue((array?.type ?? null) as JsonValue | null)
		return `[${itemType}; ${array?.len ?? "?"}]`
	}

	return null
}

const warnUnsupportedValue = (value: JsonValue | null, context?: Record<string, unknown>) => {
	ErrorLogger.logWarning("Ignoring unsupported rustdoc formatter value", {
		...context,
		value
	})
}

const formatInlineValue = (
	value: JsonValue | null,
	context?: Record<string, unknown>
): string | null => {
	const scalar = formatScalarValue(value)
	if (scalar !== null) {
		return scalar
	}

	const object = toObject(value)
	if (!object) {
		warnUnsupportedValue(value, context)
		return null
	}

	const formatted =
		formatPathLikeObject(object) ?? formatReferenceObject(object) ?? formatCollectionObject(object)
	if (formatted !== null) {
		return formatted
	}

	warnUnsupportedValue(value, context)
	return null
}

const formatGenericDetails = (generics: JsonValue) => {
	const genericParams = getArrayCount(generics, "params")
	const whereClauses = getArrayCount(generics, "where_predicates")

	return [
		genericParams > 0 ? `**Generic Params:** ${genericParams}` : "",
		whereClauses > 0 ? `**Where Clauses:** ${whereClauses}` : ""
	].filter(Boolean)
}

export { formatGenericDetails, formatInlineValue, getArrayCount, toObject }
