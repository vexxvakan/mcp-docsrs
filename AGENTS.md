# Agents Guidelines

We are running multiple agents on the same code base so you can expect changes in the active commit not authored by you. Do not reset or otherwise touch them and stay only at your edited files scope for your session.

## Workflow

1. Research code base, documentation and node_modules for information on the given task
2. Convert the given task into an actionable plan using `update_plan` aggressively.
3. Read the plan back often and mark done steps immediatly after completion.

## Documentation

1. Use the available Bun documentation inside node_modules/bun-types/docs/ when you are working with Bun to get CONCRETE information. Research the available direct types thoroughly as well.

## Code Style

- Do not care for backwards compatibility at all.
- APIs can and should break, we are in active development.
- Do not create too many files in one directory. If the directory is larger than 5 files you need to create a sub directory with its own types.ts
- Prefer functional design patterns, convert existing class-based structure into functional style as well and keep public method and variable names concise (maximum two words, exceptions exist).
- Keep concerns seperated in well-structured directories and files. Massive monolith files are terrible design. No file can be longer than 300 lines.
- Remove functions entirely when they are clean to remove. Do not keep artifacts for API confirmness. Clean up types after function removal as well.
- Do not clutter or break project structure:
  - Types belong in each directory's local `types.ts` file.
  - Types should be implemented as Type not Interface.
- Always keep test files in sync with code changes. When updating code ALWAYS check if the respective test needs updating too.

## Task Completion

- `bun check` and `bun lint:fix` have to be entirely green for the touched files in this session.
- Test your updated or changed functionality by running direct tests of the touched files: Change in `src/docs` -> `bun test src/docs`
