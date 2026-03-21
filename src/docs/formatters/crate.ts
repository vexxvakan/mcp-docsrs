import type { CrateBuckets, RustdocItem, RustdocJson } from "../types.ts"

const formatCrateDocs = (root: RustdocItem) =>
	root.docs ?? "No crate-level documentation available."

const formatCrate = (json: RustdocJson, root: RustdocItem, buckets: CrateBuckets) =>
	[
		root.name ? `# Crate: ${root.name}${json.crate_version ? ` v${json.crate_version}` : ""}` : "",
		buckets.modules.length > 0 ? `## Modules\n${buckets.modules.join("\n")}` : "",
		buckets.structs.length > 0 ? `## Structs\n${buckets.structs.join("\n")}` : "",
		buckets.enums.length > 0 ? `## Enums\n${buckets.enums.join("\n")}` : "",
		buckets.traits.length > 0 ? `## Traits\n${buckets.traits.join("\n")}` : "",
		buckets.functions.length > 0 ? `## Functions\n${buckets.functions.join("\n")}` : ""
	]
		.filter(Boolean)
		.join("\n\n")

export { formatCrate, formatCrateDocs }
