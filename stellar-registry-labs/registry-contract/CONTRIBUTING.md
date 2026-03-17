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

1. Fork this repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Write your code with tests
4. Run `cargo test` — all tests must pass
5. Open a Pull Request with a clear description

## Code Style

- Comment your functions — this is a beginner-friendly project
- Every new function must have at least one test
- Use `panic_with_error!` for all error cases

## Questions?

Open a GitHub Discussion or ping us on the Stellar Discord.
