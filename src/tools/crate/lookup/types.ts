import type { ItemKind } from "../../../docs/rustdoc/types/items.ts"

type CrateLookupInput = {
	crateName: string
	formatVersion?: number
	target?: string
	version?: string
}

type CrateLookupOutput = {
	crateName: string
	crateVersion: string | null
	formatVersion: number
	sections: CrateLookupSection[]
	summary: string | null
	target: string
	totalItems: number
}

type CrateLookupItem = {
	name: string
	path: string | null
	summary: string | null
}

type CrateLookupSection = {
	count: number
	items: CrateLookupItem[]
	kind: ItemKind
	label: string
}

export type { CrateLookupInput, CrateLookupItem, CrateLookupOutput, CrateLookupSection }
