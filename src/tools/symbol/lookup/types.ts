type SymbolLookupInput = {
	crateName: string
	expandDocs: boolean
	symbolType: string
	symbolname: string
	target?: string
	version?: string
}

export type { SymbolLookupInput }
