# Contributing to registry-contract

Thank you for your interest! This project is part of the **Stellar Wave Program** — contributions are rewarded by the Stellar Development Foundation.

## Open Issues (Stellar Wave)

Label your picked issue with `stellar-wave` to participate in rewards.

| Issue | Complexity | Description |
|---|---|---|
| Add pagination to `get_all()` | Medium | Accept `offset` and `limit` params |
| Add `get_by_owner()` function | Medium | Return all entries registered by a specific address |
| Add event emission on register/update | High | Emit Soroban events for indexers to consume |
| Write fuzz tests | High | Use property-based testing to find edge cases |
| Add `search_by_name()` function | Medium | Case-insensitive name search |
| Add batch registration | High | Register multiple contracts in one transaction |

## How to Contribute

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup): `cargo install --locked soroban-cli`

### Local Setup

```bash
git clone https://github.com/<your-fork>/stellar-registry-labs.git
cd stellar-registry-labs/registry-contract
cargo build --release --target wasm32-unknown-unknown
cargo test
```

### Submitting a PR

```bash
git checkout -b feat/your-feature
# make your changes with tests
cargo test
git push origin feat/your-feature
```

Then open a Pull Request against `main` with a clear description of what changed.

## Code Style

- Comment your functions — this is a beginner-friendly project
- Every new function must have at least one test
- Use `panic_with_error!` for all error cases

## Questions?

Open a GitHub Discussion or ping us on the Stellar Discord.
