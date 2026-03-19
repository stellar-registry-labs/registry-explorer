# Contributing to verifier-dashboard

## Open Issues (Stellar Wave)

| Issue | Complexity | Description |
|---|---|---|
| Add submission form for developers | High | Form to submit new verifications |
| Add verification details page | High | Full page for each verified contract |
| Add copy-to-clipboard for hashes | Trivial | Click hash to copy |
| Add search/filter for verified list | Medium | Filter by address substring |
| Add "verified" badge widget | Medium | Embeddable SVG badge for projects |
| Add timestamp display | Trivial | Show when each contract was verified |

## How to Contribute

### Prerequisites
- Node.js v18+
- npm

### Local Setup

```bash
git clone https://github.com/<your-fork>/stellar-registry-labs.git
cd stellar-registry-labs/verifier-dashboard
npm install
cp .env.example .env
npm run dev
```

### Submitting a PR

```bash
git checkout -b feat/your-feature
# make your changes
git push origin feat/your-feature
```

Open a Pull Request against `main`. Include a screenshot for UI changes.
