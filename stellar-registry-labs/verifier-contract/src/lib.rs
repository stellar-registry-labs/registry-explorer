#![no_std]
//! # Soroban Contract Verifier
//!
//! Stores source code hashes on-chain so anyone can verify that a deployed
//! Soroban contract matches its published source code.
//!
//! ## How it works:
//! 1. Developer compiles their contract → gets a WASM hash
//! 2. Developer submits that hash to this verifier contract
//! 3. Anyone can check: "does this deployed contract match the submitted hash?"
//! 4. If yes → the contract is verified ✅

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, String, Vec,
    log, panic_with_error,
};

// ─────────────────────────────────────────────
// DATA STRUCTURES
// ─────────────────────────────────────────────

/// A single verification record
#[contracttype]
#[derive(Clone)]
pub struct VerificationEntry {
    pub contract_address: String,   // The deployed contract address
    pub wasm_hash: String,          // SHA-256 of the compiled .wasm file
    pub source_hash: String,        // SHA-256 of the source code zip
    pub source_url: String,         // Where to find the source
    pub build_instructions: String, // How to reproduce the build
    pub submitter: Address,         // Who submitted this verification
    pub submitted_at: u64,          // When it was submitted
    pub is_verified: bool,          // Admin-confirmed match
}

/// Storage keys
#[contracttype]
pub enum DataKey {
    Verification(String),  // contract address → VerificationEntry
    AllVerified,           // Vec of all verified contract addresses
    Admin,
}

/// Error codes
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum VerifierError {
    AlreadySubmitted = 1,
    NotFound = 2,
    Unauthorized = 3,
    InvalidInput = 4,
}

// ─────────────────────────────────────────────
// CONTRACT
// ─────────────────────────────────────────────

#[contract]
pub struct VerifierContract;

#[contractimpl]
impl VerifierContract {

    /// Initialize the verifier. Call once after deployment.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, VerifierError::AlreadySubmitted);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        let empty: Vec<String> = Vec::new(&env);
        env.storage().persistent().set(&DataKey::AllVerified, &empty);
        log!(&env, "Verifier initialized");
    }

    /// Submit a contract for verification.
    ///
    /// The submitter provides hashes that others can use to independently
    /// verify the deployed contract matches the source code.
    pub fn submit(
        env: Env,
        submitter: Address,
        contract_address: String,
        wasm_hash: String,       // sha256 of the compiled wasm
        source_hash: String,     // sha256 of the source zip
        source_url: String,      // where to download the source
        build_instructions: String, // how to reproduce the build
    ) {
        submitter.require_auth();

        if wasm_hash.len() == 0 || source_hash.len() == 0 {
            panic_with_error!(&env, VerifierError::InvalidInput);
        }

        if env.storage().persistent().has(&DataKey::Verification(contract_address.clone())) {
            panic_with_error!(&env, VerifierError::AlreadySubmitted);
        }

        let entry = VerificationEntry {
            contract_address: contract_address.clone(),
            wasm_hash,
            source_hash,
            source_url,
            build_instructions,
            submitter,
            submitted_at: env.ledger().timestamp(),
            is_verified: false, // starts unverified — admin must confirm
        };

        env.storage().persistent().set(
            &DataKey::Verification(contract_address.clone()), &entry
        );

        log!(&env, "Verification submitted for: {}", contract_address);
    }

    /// Admin confirms that the hashes match the deployed contract.
    /// This is the "stamp of approval" — only the admin can call this.
    pub fn confirm_verified(env: Env, admin: Address, contract_address: String) {
        admin.require_auth();

        // Make sure caller is actually the admin
        let stored_admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, VerifierError::Unauthorized));

        if stored_admin != admin {
            panic_with_error!(&env, VerifierError::Unauthorized);
        }

        let mut entry: VerificationEntry = env.storage().persistent()
            .get(&DataKey::Verification(contract_address.clone()))
            .unwrap_or_else(|| panic_with_error!(&env, VerifierError::NotFound));

        entry.is_verified = true;
        env.storage().persistent().set(
            &DataKey::Verification(contract_address.clone()), &entry
        );

        // Add to the verified list
        let mut all: Vec<String> = env.storage().persistent()
            .get(&DataKey::AllVerified)
            .unwrap_or(Vec::new(&env));
        all.push_back(contract_address.clone());
        env.storage().persistent().set(&DataKey::AllVerified, &all);

        log!(&env, "Contract verified: {}", contract_address);
    }

    // ── READ ─────────────────────────────────

    /// Get the verification record for a contract address.
    pub fn get_verification(env: Env, contract_address: String) -> VerificationEntry {
        env.storage().persistent()
            .get(&DataKey::Verification(contract_address))
            .unwrap_or_else(|| panic_with_error!(&env, VerifierError::NotFound))
    }

    /// Quick check: is this contract verified?
    pub fn is_verified(env: Env, contract_address: String) -> bool {
        if let Some(entry) = env.storage().persistent()
            .get::<DataKey, VerificationEntry>(&DataKey::Verification(contract_address))
        {
            entry.is_verified
        } else {
            false
        }
    }

    /// Get all verified contract addresses.
    pub fn get_all_verified(env: Env) -> Vec<String> {
        env.storage().persistent()
            .get(&DataKey::AllVerified)
            .unwrap_or(Vec::new(&env))
    }
}

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{Address, Env, String};

    fn setup() -> (Env, Address, VerifierContractClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, VerifierContract);
        let client = VerifierContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.initialize(&admin);
        (env, admin, client)
    }

    #[test]
    fn test_submit_and_verify() {
        let (env, admin, client) = setup();
        let addr = String::from_str(&env, "CVERIFY123");

        client.submit(
            &admin, &addr,
            &String::from_str(&env, "wasm_hash_abc"),
            &String::from_str(&env, "source_hash_xyz"),
            &String::from_str(&env, "https://github.com/example/contract"),
            &String::from_str(&env, "cargo build --release"),
        );

        assert!(!client.is_verified(&addr));
        client.confirm_verified(&admin, &addr);
        assert!(client.is_verified(&addr));
    }

    #[test]
    fn test_all_verified_list() {
        let (env, admin, client) = setup();
        let addr = String::from_str(&env, "CVERIFY456");

        client.submit(
            &admin, &addr,
            &String::from_str(&env, "hash1"),
            &String::from_str(&env, "hash2"),
            &String::from_str(&env, "https://github.com/example"),
            &String::from_str(&env, "cargo build"),
        );

        client.confirm_verified(&admin, &addr);
        let verified = client.get_all_verified();
        assert_eq!(verified.len(), 1);
    }
}
