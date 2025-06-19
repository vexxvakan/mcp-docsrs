import { vi } from "bun:test"

/**
 * Mock fetch responses for testing
 */
export const mockFetchResponses = new Map<string, any>()

/**
 * Mock fetch implementation
 */
export const mockFetch = vi.fn((url: string | URL, _init?: RequestInit) => {
	const urlString = url.toString()

	// Check if we have a mock response
	const mockResponse = mockFetchResponses.get(urlString)
	if (mockResponse) {
		if (mockResponse.error) {
			throw mockResponse.error
		}

		return {
			ok: mockResponse.ok ?? true,
			status: mockResponse.status ?? 200,
			statusText: mockResponse.statusText ?? "OK",
			headers: new Headers(
				mockResponse.headers || {
					"content-type": mockResponse.contentType || "application/json"
				}
			),
			json: async () => mockResponse.json,
			text: async () => mockResponse.text || JSON.stringify(mockResponse.json),
			arrayBuffer: async () => mockResponse.arrayBuffer || new ArrayBuffer(0)
		} as Response
	}

	// Default 404 response
	return {
		ok: false,
		status: 404,
		statusText: "Not Found",
		headers: new Headers(),
		json: () => {
			throw new Error("Not Found")
		},
		text: async () => "Not Found"
	} as Response
})

/**
 * Reset all mocks
 */
export const resetMocks = () => {
	mockFetchResponses.clear()
	mockFetch.mockClear()
}

/**
 * Mock SQLite cache for testing
 */
export const createMockCache = <T>() => {
	const store = new Map<string, { value: T; expires: number }>()

	return {
		get: (key: string): T | null => {
			const entry = store.get(key)
			if (!entry) return null
			if (entry.expires < Date.now()) {
				store.delete(key)
				return null
			}
			return entry.value
		},
		set: (key: string, value: T, ttl: number) => {
			store.set(key, {
				value,
				expires: Date.now() + ttl
			})
		},
		delete: (key: string) => {
			store.delete(key)
		},
		clear: () => {
			store.clear()
		},
		close: () => {
			// No-op for mock
		}
	}
}

/**
 * Mock rustdoc JSON response
 */
export const mockRustdocJson = {
	format_version: 30,
	root: "0:0",
	crate: {
		name: "test_crate",
		version: "1.0.0"
	},
	index: {
		"0:0": {
			name: "test_crate",
			kind: "module",
			inner: {
				module: {
					items: ["0:1", "0:2"]
				}
			}
		},
		"0:1": {
			name: "TestStruct",
			kind: "struct",
			inner: {
				struct: {
					kind: "plain",
					fields: []
				}
			}
		},
		"0:2": {
			name: "test_function",
			kind: "function",
			inner: {
				function: {
					decl: {
						inputs: [],
						output: null
					}
				}
			}
		}
	},
	paths: {
		"0:0": {
			crate_id: 0,
			path: ["test_crate"]
		},
		"0:1": {
			crate_id: 0,
			path: ["test_crate", "TestStruct"]
		},
		"0:2": {
			crate_id: 0,
			path: ["test_crate", "test_function"]
		}
	}
}

/**
 * Mock crates.io search response
 */
export const mockCratesSearchResponse = (query: string, crates: any[] = []) => ({
	crates:
		crates.length > 0
			? crates
			: [
					{
						name: query,
						description: `A mock crate matching ${query}`,
						downloads: 1000000,
						recent_downloads: 50000,
						max_stable_version: "1.0.0"
					}
				],
	meta: {
		total: crates.length || 1
	}
})
