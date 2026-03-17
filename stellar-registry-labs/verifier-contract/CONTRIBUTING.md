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

1. Fork and `cargo test`
2. Make changes with tests
3. Open a PR
