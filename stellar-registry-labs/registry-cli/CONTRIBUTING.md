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

1. Fork this repo
2. `npm install`
3. Create a branch and make your changes
4. Run `npm test`
5. Open a PR

## Code Style

- Use ESM imports (`import` not `require`)
- Add JSDoc comments to new functions
- Keep commands consistent — use chalk for colors, ora for spinners
