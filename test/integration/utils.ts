import { type ChildProcess, spawn } from "node:child_process"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"

export type TestOptions = {
	executable: string
	target: string
	isMusl?: boolean
	isWindows?: boolean
}

export type MCPResponse = {
	jsonrpc: string
	id: number
	result?: any
	error?: any
}

export type MCPServer = {
	process: ChildProcess
	sendRequest: (request: any) => Promise<MCPResponse>
	kill: () => void
}

/**
 * Creates an MCP server instance with helper methods
 */
export const createMCPServer = (executable: string, env?: Record<string, string>): MCPServer => {
	const server = spawn(executable, [], {
		env: { ...process.env, MCP_TEST: "true", ...env },
		stdio: ["pipe", "pipe", "pipe"]
	})

	let _errorOutput = ""
	server.stderr.on("data", (data) => {
		_errorOutput += data.toString()
		if (process.env.DEBUG) {
			console.error("Server error:", data.toString())
		}
	})

	const sendRequest = (request: any): Promise<MCPResponse> => {
		return new Promise((resolve, reject) => {
			const requestStr = `${JSON.stringify(request)}\n`
			let response = ""
			let responseReceived = false

			const dataHandler = (data: Buffer) => {
				response += data.toString()
				const lines = response.split("\n")

				for (const line of lines) {
					if (line.trim()) {
						try {
							const parsed = JSON.parse(line)
							if (parsed.id === request.id) {
								responseReceived = true
								server.stdout.off("data", dataHandler)
								resolve(parsed)
								return
							}
						} catch {
							// Continue collecting data
						}
					}
				}
			}

			server.stdout.on("data", dataHandler)
			server.stdin.write(requestStr)

			// Timeout based on request type
			const timeout = request.method === "tools/call" ? 30000 : 10000
			setTimeout(() => {
				if (!responseReceived) {
					server.stdout.off("data", dataHandler)
					reject(new Error(`Timeout waiting for response to ${request.method}`))
				}
			}, timeout)
		})
	}

	const kill = () => {
		server.kill("SIGTERM")
	}

	return {
		process: server,
		sendRequest,
		kill
	}
}

/**
 * Initializes an MCP server
 */
export const initializeServer = async (server: MCPServer): Promise<void> => {
	const initRequest = {
		jsonrpc: "2.0",
		id: 1,
		method: "initialize",
		params: {
			protocolVersion: "2024-11-05",
			capabilities: {},
			clientInfo: {
				name: "integration-test",
				version: "1.0.0"
			}
		}
	}

	const response = await server.sendRequest(initRequest)
	if (!response.result?.protocolVersion) {
		throw new Error(`Failed to initialize MCP server: ${JSON.stringify(response)}`)
	}
}

/**
 * Creates a test with an initialized MCP server
 */
export const withMCPServer = async (
	executable: string,
	testFn: (server: MCPServer) => Promise<void>,
	env?: Record<string, string>
): Promise<void> => {
	const server = createMCPServer(executable, { DB_PATH: ":memory:", ...env })

	try {
		await initializeServer(server)
		await testFn(server)
	} finally {
		server.kill()
		await new Promise((resolve) => setTimeout(resolve, 1000))
	}
}

/**
 * Creates a temporary directory for testing
 */
export const withTempDir = async <T>(
	prefix: string,
	testFn: (tempDir: string) => Promise<T>
): Promise<T> => {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix))

	try {
		return await testFn(tempDir)
	} finally {
		try {
			await fs.rm(tempDir, { recursive: true, force: true })
		} catch {
			// Ignore cleanup errors
		}
	}
}

/**
 * Calls an MCP tool
 */
export const callTool = (
	server: MCPServer,
	toolName: string,
	args: Record<string, any>,
	requestId = 2
): Promise<MCPResponse> => {
	return server.sendRequest({
		jsonrpc: "2.0",
		id: requestId,
		method: "tools/call",
		params: {
			name: toolName,
			arguments: args
		}
	})
}

/**
 * Lists MCP tools
 */
export const listTools = async (server: MCPServer, requestId = 2): Promise<string[]> => {
	const response = await server.sendRequest({
		jsonrpc: "2.0",
		id: requestId,
		method: "tools/list",
		params: {}
	})

	return (response.result?.tools || []).map((t: any) => t.name)
}

/**
 * Lists MCP resources
 */
export const listResources = async (server: MCPServer, requestId = 2): Promise<any[]> => {
	const response = await server.sendRequest({
		jsonrpc: "2.0",
		id: requestId,
		method: "resources/list",
		params: {}
	})

	return response.result?.resources || []
}

/**
 * Reads an MCP resource
 */
export const readResource = async (
	server: MCPServer,
	uri: string,
	requestId = 2
): Promise<string> => {
	const response = await server.sendRequest({
		jsonrpc: "2.0",
		id: requestId,
		method: "resources/read",
		params: { uri }
	})

	return response.result?.contents?.[0]?.text || ""
}

/**
 * Asserts that a response contains expected text
 */
export const assertContains = (text: string, expected: string, message?: string): void => {
	if (!text.includes(expected)) {
		throw new Error(message || `Expected text to contain "${expected}"`)
	}
}

/**
 * Asserts that a response does not contain text
 */
export const assertNotContains = (text: string, unexpected: string, message?: string): void => {
	if (text.includes(unexpected)) {
		throw new Error(message || `Expected text not to contain "${unexpected}"`)
	}
}

/**
 * Asserts that an error response is received
 */
export const assertError = (response: MCPResponse, message?: string): void => {
	if (!response.error) {
		throw new Error(message || "Expected an error response")
	}
}

/**
 * Asserts that a successful response is received
 */
export const assertSuccess = (response: MCPResponse, message?: string): void => {
	if (response.error) {
		throw new Error(
			message || `Expected success but got error: ${JSON.stringify(response.error)}`
		)
	}
	if (!response.result) {
		throw new Error(message || "Expected a result in the response")
	}
}
