import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

const DEFAULT_APP_VERSION = "dev"
const REF_PREFIX = "ref: "
const TAGS_PREFIX = "refs/tags/"
const GIT_DIR_PREFIX = "gitdir: "
const SHORT_HASH_LENGTH = 6

const normalizeVersion = (value: string) => (value.startsWith("v") ? value.slice(1) : value)

const readText = (path: string) => {
	try {
		return readFileSync(path, "utf8").trim()
	} catch {
		return
	}
}

const findGitEntry = (start: string) => {
	let current = resolve(start)

	while (true) {
		const gitPath = join(current, ".git")
		if (existsSync(gitPath)) {
			return gitPath
		}

		const parent = dirname(current)
		if (parent === current) {
			return
		}

		current = parent
	}
}

const resolveGitDir = (start: string) => {
	const gitEntry = findGitEntry(start)
	if (!gitEntry) {
		return
	}

	const gitDirFile = readText(gitEntry)
	if (!gitDirFile?.startsWith(GIT_DIR_PREFIX)) {
		return gitEntry
	}

	return resolve(dirname(gitEntry), gitDirFile.slice(GIT_DIR_PREFIX.length))
}

const readPackedRefs = (gitDir: string) => {
	const packedRefs = new Map<string, string>()
	const packedTags = new Map<string, string>()
	const contents = readText(join(gitDir, "packed-refs"))
	if (!contents) {
		return {
			packedRefs,
			packedTags
		}
	}

	let previousRef: string | undefined
	for (const line of contents.split("\n")) {
		if (line.length === 0 || line.startsWith("#")) {
			continue
		}

		if (line.startsWith("^")) {
			if (previousRef?.startsWith(TAGS_PREFIX)) {
				packedTags.set(previousRef, line.slice(1))
			}
			continue
		}

		const [hash, ref] = line.split(" ", 2)
		if (!(hash && ref)) {
			continue
		}

		packedRefs.set(ref, hash)
		previousRef = ref
	}

	return {
		packedRefs,
		packedTags
	}
}

const readRefHash = (gitDir: string, ref: string, packedRefs: Map<string, string>) =>
	readText(join(gitDir, ref)) ?? packedRefs.get(ref)

const readHeadHash = (gitDir: string, packedRefs: Map<string, string>) => {
	const head = readText(join(gitDir, "HEAD"))
	if (!head) {
		return
	}

	if (head.startsWith(REF_PREFIX)) {
		return readRefHash(gitDir, head.slice(REF_PREFIX.length), packedRefs)
	}

	return head
}

const listLooseTags = (root: string, prefix = ""): string[] => {
	if (!existsSync(root)) {
		return []
	}

	return readdirSync(root, {
		withFileTypes: true
	}).flatMap((entry) => {
		const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
		if (entry.isDirectory()) {
			return listLooseTags(join(root, entry.name), relativePath)
		}

		return [
			relativePath
		]
	})
}

const findLooseTag = (gitDir: string, headHash: string) =>
	listLooseTags(join(gitDir, "refs", "tags")).find(
		(tag) => readText(join(gitDir, "refs", "tags", tag)) === headHash
	)

const findPackedTag = (
	headHash: string,
	packedRefs: Map<string, string>,
	packedTags: Map<string, string>
) =>
	[
		...packedRefs.entries()
	]
		.filter(([ref]) => ref.startsWith(TAGS_PREFIX))
		.find(([ref, hash]) => hash === headHash || packedTags.get(ref) === headHash)?.[0]

const resolveBuildVersion = (start: string, buildVersion?: string) => {
	if (buildVersion) {
		return normalizeVersion(buildVersion)
	}

	const gitDir = resolveGitDir(start)
	if (!gitDir) {
		return DEFAULT_APP_VERSION
	}

	const { packedRefs, packedTags } = readPackedRefs(gitDir)
	const headHash = readHeadHash(gitDir, packedRefs)
	if (!headHash) {
		return DEFAULT_APP_VERSION
	}

	const looseTag = findLooseTag(gitDir, headHash)
	if (looseTag) {
		return normalizeVersion(looseTag)
	}

	const packedTag = findPackedTag(headHash, packedRefs, packedTags)
	if (packedTag) {
		return normalizeVersion(packedTag.slice(TAGS_PREFIX.length))
	}

	return headHash.slice(0, SHORT_HASH_LENGTH)
}

export { DEFAULT_APP_VERSION, normalizeVersion, resolveBuildVersion }
