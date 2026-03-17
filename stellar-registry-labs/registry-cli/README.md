# registry-cli

Command-line tool for interacting with the **Soroban Contract Registry**.

## Installation

```bash
npm install
npm link   # makes `registry` available globally
```

## Setup

```bash
cp .env.example .env
# Edit .env and add your contract ID and secret key
```

## Usage

```bash
# Register a contract
registry register \
  --address CXXX123 \
  --name "MyDEX" \
  --version "1.0.0" \
  --description "A decentralised exchange" \
  --source "https://github.com/example/mydex" \
  --abi-hash "abc123def456"

# Look up a contract
registry get --address CXXX123

# List all registered contracts
registry list

# Count total registrations
registry count

# Deactivate a contract
registry deactivate --address CXXX123
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)
