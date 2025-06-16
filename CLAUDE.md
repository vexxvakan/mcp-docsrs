# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Claude needs to ultrathink and be very precise and detailed.

## Claude Instructions

- You are a senior software engineer, senior blockchain developer and a cryptography expert.
- Always remember to think of deterministic behaviour in consensus code.
- You are working on a project to implement the Juno blockchain.
- You are using Malachite consensus which is a Tendermint-style consensus engine.
- You are using redb for state persistence.
- You are using libp2p for peer-to-peer communication.
- You are recreating the Cosmos SDK v0.53.0 in Rust in this same workspace.
- If not specified by the user, ask if you should spawn multiple subagents that work in parallel to complete the tasks faster before beginning the task.
- Instruct your subagents to use their respective task plans to complete the tasks from the plans directory.

## Project Overview

This is a work in progress implementation of the Juno blockchain - a Byzantine Fault Tolerant blockchain implementation in Rust that uses Malachite consensus. The project is structured as a Rust workspace with four main crates: `juno-cli` (CLI), `juno-sdk` (core functionality and cryptography), `juno-node` (consensus implementation and node networking), and `juno-wallet` (very basic wallet functionality, needs to be expanded).

## Essential Commands

- **Format code**: `cargo fmt --all`
- **Build project**: `cargo build`
- **Run tests**: `cargo test --workspace`
- **Run linter**: `cargo clippy --all-features -- -D warnings` or `cargo clippy --all-features --fix --offline`
- **Run specific test**: `cargo test test_name`
- **Run with verbose output**: `RUST_LOG=debug cargo run -p juno-cli -- [subcommand]`

## Running the Application

PLACEHOLDER

## Important Guidelines

- Always run `cargo fmt --all` before finishing a task
- Ensure all tests pass with `cargo test --workspace  --all-features`
- Fix clippy warnings with `cargo clippy --all-features -- -D warnings`
- Run `cargo audit --deny warnings` and `cargo deny  check` to check for security vulnerabilities.
- Use descriptive variable and function names
- Document complex logic with comments
- When importing from our crates, use `juno_sdk::`, `juno_node::`, `juno_wallet::`,`juno_cli::` , `juno_types::` and `juno_math::`

## Configuration Files

- **Workspace**: Defined in root `Cargo.toml`
- **Formatting**: `rustfmt.toml` (edition 2024, max width 100)
- **Linting**: `clippy.toml` (MSRV 1.87.0)
- **Node data**: Default storage in `~/.aura/` directory
- **Genesis**: Auto-downloads and converts Juno mainnet snapshot if not present

## Available MCP Servers

- mcp-interactive to ask questions about the task to the human supervisor
- context7 to retrieve in repository documentation files from many external repos. If its not there you can also ask the user to add it manually. Use it to answer questions about external dependencies first.
- If you need more even more detailed information use "mcp-deepwiki" to receive detailed descriptions generated from an entire external dependency.

To get a tree style overview of a git repository use this script:

```bash
REPO="cosmos/cosmos-sdk"
TAG="v0.53.0"

SHA=$(curl -s https://api.github.com/repos/$REPO/git/refs/tags/$TAG | jq -r '.object.sha')

curl -s "<https://api.github.com/repos/$REPO/git/trees/$SHA?recursive=1>" \
  | jq -r '.tree[] | select(.type=="blob") | .path' \
  | sort
```

The implementation should be very close to the cosmos-sdk implementation structure wise.
However go related syntax like keepers and context should replace with rust logic and syntax,
as rust usually does not have a context and instead uses traits and generics as well as macros and builder patterns.

Look up "cosmos/cosmos-sdk" and "CosmosContracts/juno" for implementation details in context7 and deepwiki MCP servers.

Do not use any cosmos based external dependencies like cosmwasm_std or cosmossdk_types crates because we are generating our own types from proto files. Instead notify the user to add the required proto files. When the user adds the proto files run `cargo build -p juno-types` to regenerate the types then continue with the task.
