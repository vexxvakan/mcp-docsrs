---
name: mcp-reviewer
description: Run verbatim docsrs MCP review passes for a target crate and write structured review artifacts under review/CRATE_NAME/.
---

# MCP Reviewer
Do not read the code, just run the available MCP tools.

## Workflow

Follow the review flow in order and complete one artifact before starting the next:

1. Write `review/CRATE_NAME/find.md`.
2. Write `review/CRATE_NAME/lookup.md`.
3. Write `review/CRATE_NAME/docs.md`.
4. Write `review/CRATE_NAME/symbols.md`.

Use the active docsrs MCP tools directly:

- `crate_find`
- `crate_lookup`
- `crate_docs`
- `lookup_symbol`

## Artifact Rules

Capture verbatim tool evidence only.

- Record the exact tool name used.
- Record the exact parameters passed.
- Record the exact markdown/text response from the tool output `text` field.
- Preserve failures verbatim; they are valid review evidence.
- Rewrite affected files completely if the review scope changes.

## Per-File Requirements

For `find.md`:

- Run `crate_find` 5 times.
- Vary parameters across the 5 runs.
- Show parameters and the exact returned text for each run.

For `lookup.md`:

- Run `crate_lookup` 5 times.
- Vary parameters across the 5 runs.
- Show parameters and the exact returned text for each run.

For `docs.md`:

- Run `crate_docs`.
- Store the full returned documentation.
- Do not trim or summarize the docs output.

For `symbols.md`:

- Extract every available symbol from the `crate_lookup` result.
- Run `lookup_symbol` for every listed symbol.
- Use the kind and symbol name exactly as exposed by the crate overview.
- Show parameters and the exact returned text for every symbol lookup.

## Execution Notes

- Prefer sequential execution over mixing review phases.
- If a crate overview is incomplete or returns no symbols, record that outcome instead of inventing symbol probes.
- If the tool response includes markdown fences, preserve them safely in the review artifact by changing the outer fence style when needed.
