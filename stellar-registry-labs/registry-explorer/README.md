# registry-explorer

React web app for browsing the **Soroban Contract Registry**.

## Getting Started

```bash
npm install
cp .env.example .env   # add VITE_REGISTRY_CONTRACT_ID
npm run dev
```

Open http://localhost:5173

## Features

- Browse all registered contracts
- Search by name or description
- Click any card for full details
- Links directly to source code

## Environment Variables

```
VITE_REGISTRY_CONTRACT_ID=CXXXXXXXX
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)
