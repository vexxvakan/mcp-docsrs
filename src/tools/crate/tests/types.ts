// biome-ignore-all lint/style/useNamingConvention: crates.io API fixtures use snake_case keys
import type { RankedCrate, SearchCrate } from "../../../docs/classifier/types.ts"
import type { FindCratesArgs } from "../types.ts"

type TestCase = {
	name: string
}

type TestCratesIoCrate = {
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

type FetchResponseCase =
	| {
			body: {
				crates: TestCratesIoCrate[]
				meta: {
					total: number
				}
			}
			kind: "success"
	  }
	| {
			error: Error
			kind: "reject"
	  }
	| {
			body: string
			kind: "invalid_json"
	  }
	| {
			kind: "http_error"
			status: number
			statusText: string
	  }

type FetchCase = TestCase & {
	expected: {
		errorMessage?: string
		errorName?: string
		total?: number
	}
	limit: number
	query: string
	response: FetchResponseCase
}

type RankCase = TestCase & {
	crates: SearchCrate[]
	expectedNames: string[]
	expectedTier?: RankedCrate["scores"]["tier"]
	query: string
}

type FormatCase = TestCase & {
	crates: RankedCrate[]
	expectedExcludes?: string[]
	expectedIncludes: string[]
	now?: number
	query: string
	total: number
}

type HandlerCase = TestCase & {
	args: FindCratesArgs
	expected: {
		isError: boolean
		text: string
		url?: string
	}
	response: FetchResponseCase
}

type SimilarCase = TestCase & {
	expectedNames: string[]
	limit: number
	query: string
	response: FetchResponseCase
}

export type {
	FetchCase,
	FetchResponseCase,
	FormatCase,
	HandlerCase,
	RankCase,
	SimilarCase,
	TestCase,
	TestCratesIoCrate
}
