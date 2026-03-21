import { mock } from "bun:test"
import { storeRustdocJson, toResponse } from "../fixtures.ts"

const createFetchMock = () =>
	mock(async (_input: string | URL | Request, _init?: RequestInit) =>
		toResponse(JSON.stringify(storeRustdocJson))
	)

export { createFetchMock }
