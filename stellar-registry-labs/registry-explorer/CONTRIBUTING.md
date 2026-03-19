# Contributing to registry-explorer

## Open Issues (Stellar Wave)

| Issue | Complexity | Description |
|---|---|---|
| Add pagination (10 items per page) | Medium | Add Previous/Next buttons to the grid |
| Add dark/light mode toggle | Trivial | CSS variable swap with localStorage |
| Add "Register Contract" form | High | Form that calls the registry contract |
| Add copy-to-clipboard for addresses | Trivial | Click address to copy |
| Add loading skeleton cards | Trivial | Pulse animation while fetching |
| Add category tags/filter | High | Allow filtering by contract type |

## How to Contribute

### Prerequisites
- Node.js v18+
- npm

### Local Setup

```bash
git clone https://github.com/<your-fork>/stellar-registry-labs.git
cd stellar-registry-labs/registry-explorer
npm install
cp .env.example .env
# Add VITE_REGISTRY_CONTRACT_ID to .env
npm run dev
```

Open http://localhost:5173

### Submitting a PR

```bash
git checkout -b feat/your-feature
# make your changes
git push origin feat/your-feature
```

Open a Pull Request against `main`. Include a screenshot for any UI changes.
