// biome-ignore-all lint/style/useNamingConvention: crates.io API fixtures use snake_case keys
import type { FetchCase } from "../../types.ts"
import { createApiCrate, FIND_TOTAL } from "../shared.ts"

const fetchCases: FetchCase[] = [
	{
		expected: {
			total: FIND_TOTAL
		},
		limit: 10,
		name: "success",
		query: "rustdoc types",
		response: {
			body: {
				crates: [
					createApiCrate("rustdoc-types", {
						created_at: "2021-03-21T00:00:00.000Z",
						description: "Types for rustdoc's json output",
						downloads: 3_362_770,
						max_version: "0.57.3",
						recent_downloads: 496_894,
						repository: "https://github.com/rust-lang/rust",
						updated_at: "2026-02-28T00:00:00.000Z"
					})
				],
				meta: {
					total: FIND_TOTAL
				}
			},
			kind: "success"
		}
	},
	{
		expected: {
			errorMessage: "Network request failed: HTTP 502 Bad Gateway",
			errorName: "NetworkError"
		},
		limit: 10,
		name: "throw NetworkError",
		query: "rustdoc",
		response: {
			kind: "http_error",
			status: 502,
			statusText: "Bad Gateway"
		}
	},
	{
		expected: {
			errorName: "SyntaxError"
		},
		limit: 10,
		name: "throw SyntaxError",
		query: "rustdoc",
		response: {
			body: "{",
			kind: "invalid_json"
		}
	},
	{
		expected: {
			errorMessage: "socket closed",
			errorName: "Error"
		},
		limit: 10,
		name: "throw Error",
		query: "rustdoc",
		response: {
			error: new Error("socket closed"),
			kind: "reject"
		}
	}
]

export { fetchCases }
