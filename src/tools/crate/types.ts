import type { ZodNumber, ZodOptional, ZodString } from "zod"

type CrateArgs = {
	crateName: string
	formatVersion?: number
	target?: string
	version?: string
}

type CrateInputSchema = {
	crateName: ZodString
	formatVersion: ZodOptional<ZodNumber>
	target: ZodOptional<ZodString>
	version: ZodOptional<ZodString>
}

export type { CrateArgs, CrateInputSchema }
