// biome-ignore-all lint/style/useNamingConvention: crates.io API fixtures use snake_case keys
import type { SimilarCase } from "../../types.ts"
import { createApiCrate } from "../shared.ts"

const similarCases: SimilarCase[] = [
	{
		expectedNames: [
			"tokio",
			"tokio-util"
		],
		limit: 2,
		name: "success",
		query: "tokio",
		response: {
			body: {
				crates: [
					createApiCrate("tokio-util", {
						description: "Tokio utilities",
						downloads: 3_000_000,
						recent_downloads: 100_000
					}),
					createApiCrate("tokio", {
						description: "An event-driven, non-blocking I/O platform",
						downloads: 55_000_000,
						max_version: "1.48.0",
						recent_downloads: 7_000_000
					})
				],
				meta: {
					total: 2
				}
			},
			kind: "success"
		}
	},
	{
		expectedNames: [],
		limit: 2,
		name: "throw Error",
		query: "tokio",
		response: {
			error: new Error("socket closed"),
			kind: "reject"
		}
	}
]

export { similarCases }
