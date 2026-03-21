// biome-ignore-all lint/style/useNamingConvention: crates.io API fixtures use snake_case keys
import type { SearchCrate } from "../../../../docs/classifier/types.ts"
import type { TestCratesIoCrate } from "../types.ts"

const FIND_TOTAL = 547
const CRATES_IO_URL = "https://crates.io/api/v1/crates"
const FIND_FETCH_LIMIT = 50

const createApiCrate = (name: string, extra?: Partial<TestCratesIoCrate>): TestCratesIoCrate => ({
	created_at: null,
	description: null,
	documentation: null,
	downloads: 10,
	homepage: null,
	max_version: "1.0.0",
	name,
	recent_downloads: 1,
	repository: null,
	updated_at: null,
	...extra
})

const createSearchCrate = (name: string, extra?: Partial<SearchCrate>): SearchCrate => ({
	createdAt: null,
	description: null,
	documentation: null,
	downloads: 10,
	homepage: null,
	maxVersion: "1.0.0",
	name,
	recentDownloads: 1,
	repository: null,
	updatedAt: null,
	...extra
})

export { CRATES_IO_URL, createApiCrate, createSearchCrate, FIND_FETCH_LIMIT, FIND_TOTAL }
