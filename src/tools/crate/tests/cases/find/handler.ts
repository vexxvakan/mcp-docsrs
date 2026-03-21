// biome-ignore-all lint/style/useNamingConvention: crates.io API fixtures use snake_case keys
import type { HandlerCase } from "../../types.ts"
import { CRATES_IO_URL, createApiCrate, FIND_FETCH_LIMIT, FIND_TOTAL } from "../shared.ts"

const handlerCases: HandlerCase[] = [
	{
		args: {
			limit: 5,
			query: "rustdoc types"
		},
		expected: {
			isError: false,
			text: "Source: https://github.com/rust-lang/rust",
			url: `${CRATES_IO_URL}?q=rustdoc%20types&per_page=${FIND_FETCH_LIMIT}`
		},
		name: "success",
		response: {
			body: {
				crates: [
					createApiCrate("pavexc_rustdoc_types", {
						description:
							"The slimmed down schema used by pavexc to work with rustdoc's JSON output",
						downloads: 20_199,
						max_version: "0.1.80",
						recent_downloads: 132
					}),
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
		args: {
			query: "rustdoc"
		},
		expected: {
			isError: true,
			text: "Error finding crates: Request timed out while searching crates.io"
		},
		name: "throw AbortError",
		response: {
			error: (() => {
				const error = new Error("aborted")
				error.name = "AbortError"
				return error
			})(),
			kind: "reject"
		}
	},
	{
		args: {
			query: "rustdoc"
		},
		expected: {
			isError: true,
			text: "Error finding crates: socket closed"
		},
		name: "throw Error",
		response: {
			error: new Error("socket closed"),
			kind: "reject"
		}
	}
]

export { handlerCases }
