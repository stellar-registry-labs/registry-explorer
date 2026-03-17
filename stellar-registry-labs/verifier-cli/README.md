# verifier-cli

CLI tool for submitting and checking contract verifications.

## Usage

```bash
# Hash your wasm file
verifier hash --file contract.wasm

# Check if a contract is verified
verifier check --address CXXX123

# List all verified contracts
verifier list
```

## Setup

```bash
npm install
cp .env.example .env
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)
