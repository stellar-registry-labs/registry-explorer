# Contributing to verifier-cli

## Open Issues (Stellar Wave)

| Issue | Complexity | Description |
|---|---|---|
| Add `verifier submit` command | High | Full submit flow with prompts |
| Add `verifier get` command | Medium | Show full verification record |
| Add reproducible build checker | High | Automate the build and compare hashes |
| Add `--watch` mode for `check` | Medium | Poll until verified |
| Write Jest tests | Medium | Unit tests for hash helpers |

## How to Contribute

### Prerequisites
- Node.js v18+
- npm

### Local Setup

```bash
git clone https://github.com/<your-fork>/stellar-registry-labs.git
cd stellar-registry-labs/verifier-cli
npm install
cp .env.example .env
```

### Submitting a PR

```bash
git checkout -b feat/your-feature
# make your changes
git push origin feat/your-feature
```

Open a Pull Request against `main` with a short description of what you changed.
