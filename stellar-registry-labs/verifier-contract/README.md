# verifier-contract

A Soroban smart contract that lets developers submit source code hashes for their deployed contracts, enabling trustless verification.

## How Verification Works

1. Developer compiles contract → gets a `.wasm` file
2. Developer runs `sha256 contract.wasm` to get the WASM hash
3. Developer submits hash + source URL to this contract
4. Admin confirms the hashes match the deployed bytecode
5. Contract is now publicly marked as **verified** ✅

## Functions

| Function | Description |
|---|---|
| `initialize(admin)` | Deploy once |
| `submit(submitter, address, wasm_hash, source_hash, source_url, build_instructions)` | Submit for verification |
| `confirm_verified(admin, address)` | Admin marks as verified |
| `is_verified(address)` | Quick boolean check |
| `get_verification(address)` | Full verification record |
| `get_all_verified()` | List all verified contracts |

## Getting Started

```bash
cargo build --release --target wasm32-unknown-unknown
cargo test
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)
