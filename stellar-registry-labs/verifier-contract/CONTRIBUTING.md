# Contributing to verifier-contract

## Open Issues (Stellar Wave)

| Issue | Complexity | Description |
|---|---|---|
| Add `unsubmit()` function | Medium | Let submitter retract a pending verification |
| Add multiple hash algorithms support | High | Support both SHA-256 and SHA-3 |
| Add verification expiry | High | Allow verifications to expire after N ledgers |
| Write fuzz tests | High | Edge cases for hash inputs |
| Add community upvote function | Medium | Let users signal trust in a verification |
| Emit events on verification confirmed | Trivial | Soroban event for indexers |

## How to Contribute

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup): `cargo install --locked soroban-cli`

### Local Setup

```bash
git clone https://github.com/<your-fork>/stellar-registry-labs.git
cd stellar-registry-labs/verifier-contract
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

Open a Pull Request against `main` with a description of what changed.
