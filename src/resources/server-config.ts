import type { ResourceContext } from "./types.ts"

const createJsonResult = (uri: URL, value: unknown) => ({
	contents: [
		{
			mimeType: "application/json",
			text: JSON.stringify(value, null, 2),
			uri: uri.href
		}
	]
})

const registerServerConfigResource = ({ server, config }: ResourceContext) => {
	server.registerResource(
		"server-config",
		"cache://config",
		{
			description: "Get current server configuration",
			mimeType: "application/json",
			title: "Server Configuration"
		},
		async (uri) => createJsonResult(uri, config)
	)
}

export { registerServerConfigResource }
