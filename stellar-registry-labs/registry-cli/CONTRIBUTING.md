# Contributing to registry-cli

## Open Issues (Stellar Wave)

| Issue | Complexity | Description |
|---|---|---|
| Add `--output json` flag to all commands | Trivial | Print results as JSON for scripting |
| Add `registry update` command | Medium | Call the update function on the contract |
| Add input validation before submitting | Trivial | Validate address format, semver, URL |
| Add `registry search --name` command | Medium | Filter list by name substring |
| Write Jest unit tests for helpers | Medium | Test config loader and hash helpers |
| Add progress bar for batch operations | High | Show progress when listing many contracts |

## How to Contribute

### Prerequisites
- Node.js v18+
- npm

### Local Setup

```bash
git clone https://github.com/<your-fork>/stellar-registry-labs.git
cd stellar-registry-labs/registry-cli
npm install
cp .env.example .env
# Edit .env with your contract ID and secret key
```

### Submitting a PR

```bash
git checkout -b feat/your-feature
# make your changes
npm test
git push origin feat/your-feature
```

Then open a Pull Request against `main` with a short description of what you changed and why.

## Code Style

- Use ESM imports (`import` not `require`)
- Add JSDoc comments to new functions
- Keep commands consistent — use chalk for colors, ora for spinners
