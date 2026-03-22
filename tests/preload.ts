import { afterEach, mock } from "bun:test"
import "./fixtures/crates.ts"
import "./fixtures/docs.ts"
import "./mocks/cache.ts"
import "./mocks/fetch.ts"

// biome-ignore lint/style/noProcessEnv: test preload sets test-only env defaults before modules read them
process.env.NODE_ENV ??= "test"
// biome-ignore lint/style/noProcessEnv: test preload sets test-only env defaults before modules read them
process.env.SILENT_LOGS ??= "true"

afterEach(() => {
	mock.restore()
	mock.clearAllMocks()
})
