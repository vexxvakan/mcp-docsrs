import type { ItemKind } from "@mcp-docsrs/docs/rustdoc/types/items.ts"

type SymbolLookupInput = {
	crateName: string
	symbolType: string
	symbolname: string
	target?: string
	version?: string
}

type SymbolLookupItems = {
	autoTraits?: Record<string, string>
	blankets?: Record<string, string>
	enums?: Record<string, string>
	fields?: Record<string, string>
	functions?: Record<string, string>
	modules?: Record<string, string>
	reexports?: Record<string, string>
	structs?: Record<string, string>
	traits?: Record<string, string>
	variants?: Record<string, string>
}

type SymbolLookupOutput = {
	crateName: string
	crateVersion: string | null
	formatVersion: number
	items?: SymbolLookupItems
	symbol: {
		deprecated: boolean
		hasDocs: boolean
		kind: ItemKind
		label: string
		name: string
		path: string | null
		summary: string | null
		visibility: string
	}
	target: string
}

export type { SymbolLookupInput, SymbolLookupItems, SymbolLookupOutput }
