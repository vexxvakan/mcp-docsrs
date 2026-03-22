import { spyOn } from "bun:test"
import { storeRustdocJson, toResponse } from "../fixtures/docs.ts"

const mockFetchResponse = (response: Response | Promise<Response>) =>
	spyOn(globalThis, "fetch").mockImplementation((() =>
		Promise.resolve(response)) as unknown as typeof fetch)

const mockJsonFetch = (body: Record<string, unknown>, init?: ResponseInit) =>
	mockFetchResponse(
		new Response(JSON.stringify(body), {
			status: 200,
			...init
		})
	)

const mockTextFetch = (body: string | Uint8Array | null, init?: ResponseInit) =>
	mockFetchResponse(
		new Response(body, {
			status: 200,
			...init
		})
	)

const mockFetchReject = (error: Error) =>
	spyOn(globalThis, "fetch").mockImplementation((() =>
		Promise.reject(error)) as unknown as typeof fetch)

const mockRustdocFetch = async (data = storeRustdocJson) =>
	mockFetchResponse(toResponse(await Bun.zstdCompress(JSON.stringify(data)), "zstd"))

export { mockFetchReject, mockFetchResponse, mockJsonFetch, mockRustdocFetch, mockTextFetch }
