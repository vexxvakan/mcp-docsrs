// biome-ignore-all lint/style/useNamingConvention: crates.io API uses snake_case keys
import type { SearchCrate } from "@mcp-docsrs/docs/classifier/types.ts"

type FindCratesArgs = {
	limit?: number
	query: string
}

type FindCratesOutput = {
	crates: SearchCrate[]
	query: string
	returned: number
	total: number
}

type CratesIoCrate = {
	created_at: string | null
	description: string | null
	documentation: string | null
	downloads: number
	homepage: string | null
	max_version: string
	name: string
	recent_downloads: number
	repository: string | null
	updated_at: string | null
}

type CratesIoFindResponse = {
	crates: CratesIoCrate[]
	meta: {
		total: number
	}
}

export type { CratesIoCrate, CratesIoFindResponse, FindCratesArgs, FindCratesOutput }
