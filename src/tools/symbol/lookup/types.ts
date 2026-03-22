import type { ItemKind } from "@mcp-docsrs/docs/rustdoc/types/items.ts"

type SymbolLookupInput = {
	crateName: string
	symbolType: string
	symbolname: string
	target?: string
	version?: string
}

type SymbolLookupOutput = {
	crateName: string
	crateVersion: string | null
	formatVersion: number
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

export type { SymbolLookupInput, SymbolLookupOutput }
