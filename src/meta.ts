const APP_NAME = "mcp-docsrs"
const DEFAULT_APP_VERSION = "dev"

declare const appBuildVersion: string | undefined

const resolveAppVersion = (buildVersion?: string) => buildVersion ?? DEFAULT_APP_VERSION

const APP_VERSION = resolveAppVersion(
	typeof appBuildVersion === "string" ? appBuildVersion : undefined
)
const APP_USER_AGENT = `${APP_NAME}/${APP_VERSION}`

export { APP_NAME, APP_USER_AGENT, APP_VERSION, resolveAppVersion }
