# registry-contract

A Soroban smart contract that powers the **Stellar Contract Registry** — an on-chain directory of deployed Soroban contracts.

## What it does

- Lets developers **register** their deployed contracts with metadata (name, version, description, source URL, ABI hash)
- Lets anyone **search and discover** registered contracts
- Lets owners **update** or **deactivate** their entries
- Fully on-chain — no central server, no database

## Functions

| Function | Description |
|---|---|
| `initialize(admin)` | Deploy and set admin — call once |
| `register(caller, address, name, version, ...)` | Register a new contract |
| `update(caller, address, ...)` | Update an existing entry |
| `deactivate(caller, address)` | Mark a contract as inactive |
| `get_entry(address)` | Fetch a single entry |
| `get_all()` | List all registered addresses |
| `is_registered(address)` | Boolean check |
| `count()` | Total number of registered contracts |

## Getting Started

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup)

```bash
# Install Soroban CLI
cargo install --locked soroban-cli
```

### Build

```bash
cargo build --release --target wasm32-unknown-unknown
```

### Test

```bash
cargo test
```

### Deploy to Testnet

```bash
# Get testnet XLM
soroban keys generate mykey --network testnet
soroban keys fund mykey --network testnet

# Deploy
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/registry_contract.wasm \
  --source mykey \
  --network testnet
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for open issues and how to get started.
