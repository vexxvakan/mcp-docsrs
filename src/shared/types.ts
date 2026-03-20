type JsonPrimitive = boolean | null | number | string
type JsonValue = JsonArray | JsonObject | JsonPrimitive
type JsonArray = JsonValue[]
type JsonObject = {
	[key: string]: JsonValue
}

export type { JsonArray, JsonObject, JsonPrimitive, JsonValue }
