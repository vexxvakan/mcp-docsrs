// biome-ignore-all lint/style/useNamingConvention: crates.io fixtures use upstream snake_case keys
const CRATES_IO_URL = "https://crates.io/api/v1/crates"
const FIND_TOTAL = 547

const createCrate = (name: string, extra: Record<string, unknown> = {}) => ({
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

const createCratesIoResponse = (
	crates: ReturnType<typeof createCrate>[],
	total = crates.length
) => ({
	crates,
	meta: {
		total
	}
})

export { CRATES_IO_URL, createCrate, createCratesIoResponse, FIND_TOTAL }
