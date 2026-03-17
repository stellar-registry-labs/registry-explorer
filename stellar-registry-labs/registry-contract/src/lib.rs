#![no_std]
//! # Soroban Contract Registry
//!
//! Lets developers register metadata about their deployed Soroban contracts
//! so others can discover, verify, and build on top of them.

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, String, Vec,
    log, panic_with_error,
};

// ─────────────────────────────────────────────
// DATA STRUCTURES
// ─────────────────────────────────────────────

/// All the info stored for one registered contract
#[contracttype]
#[derive(Clone)]
pub struct ContractEntry {
    pub name: String,           // Human-readable name e.g. "MyDEX"
    pub version: String,        // Semantic version e.g. "1.0.0"
    pub description: String,    // What does this contract do?
    pub source_url: String,     // Link to GitHub / source code
    pub abi_hash: String,       // SHA-256 of the ABI for verification
    pub owner: Address,         // Stellar address of whoever registered this
    pub registered_at: u64,     // Ledger timestamp at registration time
    pub is_active: bool,        // false = deprecated (but data still exists)
}

/// Keys used to read/write from contract storage
#[contracttype]
pub enum DataKey {
    Entry(String),   // Maps a contract address string → ContractEntry
    AllEntries,      // Stores the full Vec of registered addresses
    Admin,           // Stores the admin Address
}

/// Error codes — returned when something goes wrong
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RegistryError {
    AlreadyRegistered = 1,  // That address is already in the registry
    NotFound = 2,           // No entry exists for that address
    Unauthorized = 3,       // You are not the owner of this entry
    InvalidInput = 4,       // Missing required fields
}

// ─────────────────────────────────────────────
// CONTRACT IMPLEMENTATION
// ─────────────────────────────────────────────

#[contract]
pub struct RegistryContract;

#[contractimpl]
impl RegistryContract {

    // ── SETUP ────────────────────────────────────────────────────────────────

    /// Initialize the registry. Must be called once right after deployment.
    /// Sets the admin and creates an empty entries list.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, RegistryError::AlreadyRegistered);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        let empty: Vec<String> = Vec::new(&env);
        env.storage().persistent().set(&DataKey::AllEntries, &empty);
        log!(&env, "Registry initialized");
    }

    // ── WRITE ────────────────────────────────────────────────────────────────

    /// Register a new contract in the registry.
    ///
    /// The caller must sign this transaction — this proves they own
    /// the Stellar account and authorizes the registration.
    pub fn register(
        env: Env,
        caller: Address,         // Who is registering
        contract_address: String, // The deployed contract's address
        name: String,
        version: String,
        description: String,
        source_url: String,
        abi_hash: String,
    ) {
        // 1. Verify the caller signed this transaction
        caller.require_auth();

        // 2. Reject empty required fields
        if name.len() == 0 || version.len() == 0 {
            panic_with_error!(&env, RegistryError::InvalidInput);
        }

        // 3. Reject duplicate registrations
        if env.storage().persistent().has(&DataKey::Entry(contract_address.clone())) {
            panic_with_error!(&env, RegistryError::AlreadyRegistered);
        }

        // 4. Build and store the entry
        let entry = ContractEntry {
            name,
            version,
            description,
            source_url,
            abi_hash,
            owner: caller,
            registered_at: env.ledger().timestamp(),
            is_active: true,
        };

        env.storage().persistent().set(
            &DataKey::Entry(contract_address.clone()), &entry
        );

        // 5. Add address to the master list
        let mut all: Vec<String> = env.storage().persistent()
            .get(&DataKey::AllEntries)
            .unwrap_or(Vec::new(&env));
        all.push_back(contract_address.clone());
        env.storage().persistent().set(&DataKey::AllEntries, &all);

        log!(&env, "Registered: {}", contract_address);
    }

    /// Update an existing entry. Only the original owner can do this.
    pub fn update(
        env: Env,
        caller: Address,
        contract_address: String,
        name: String,
        version: String,
        description: String,
        source_url: String,
        abi_hash: String,
    ) {
        caller.require_auth();

        let mut entry: ContractEntry = env.storage().persistent()
            .get(&DataKey::Entry(contract_address.clone()))
            .unwrap_or_else(|| panic_with_error!(&env, RegistryError::NotFound));

        if entry.owner != caller {
            panic_with_error!(&env, RegistryError::Unauthorized);
        }

        entry.name = name;
        entry.version = version;
        entry.description = description;
        entry.source_url = source_url;
        entry.abi_hash = abi_hash;

        env.storage().persistent().set(&DataKey::Entry(contract_address), &entry);
    }

    /// Deactivate a contract entry (marks it as deprecated without deleting).
    pub fn deactivate(env: Env, caller: Address, contract_address: String) {
        caller.require_auth();

        let mut entry: ContractEntry = env.storage().persistent()
            .get(&DataKey::Entry(contract_address.clone()))
            .unwrap_or_else(|| panic_with_error!(&env, RegistryError::NotFound));

        if entry.owner != caller {
            panic_with_error!(&env, RegistryError::Unauthorized);
        }

        entry.is_active = false;
        env.storage().persistent().set(&DataKey::Entry(contract_address), &entry);
    }

    // ── READ ─────────────────────────────────────────────────────────────────

    /// Fetch a single entry by contract address string.
    pub fn get_entry(env: Env, contract_address: String) -> ContractEntry {
        env.storage().persistent()
            .get(&DataKey::Entry(contract_address))
            .unwrap_or_else(|| panic_with_error!(&env, RegistryError::NotFound))
    }

    /// Returns true if the given contract address is registered.
    pub fn is_registered(env: Env, contract_address: String) -> bool {
        env.storage().persistent().has(&DataKey::Entry(contract_address))
    }

    /// Returns the list of all registered contract addresses.
    pub fn get_all(env: Env) -> Vec<String> {
        env.storage().persistent()
            .get(&DataKey::AllEntries)
            .unwrap_or(Vec::new(&env))
    }

    /// Returns the total number of registered contracts.
    pub fn count(env: Env) -> u32 {
        let all: Vec<String> = env.storage().persistent()
            .get(&DataKey::AllEntries)
            .unwrap_or(Vec::new(&env));
        all.len()
    }
}

// ─────────────────────────────────────────────
// TESTS
// Run with: cargo test
// ─────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{Address, Env, String};

    fn setup() -> (Env, Address, RegistryContractClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, RegistryContract);
        let client = RegistryContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.initialize(&admin);
        (env, admin, client)
    }

    #[test]
    fn test_register_and_retrieve() {
        let (env, admin, client) = setup();
        let addr = String::from_str(&env, "CXXX123ABC");

        client.register(
            &admin, &addr,
            &String::from_str(&env, "MyDEX"),
            &String::from_str(&env, "1.0.0"),
            &String::from_str(&env, "A decentralised exchange on Stellar"),
            &String::from_str(&env, "https://github.com/stellar-registry-labs/mydex"),
            &String::from_str(&env, "abc123def456"),
        );

        let entry = client.get_entry(&addr);
        assert_eq!(entry.name, String::from_str(&env, "MyDEX"));
        assert!(entry.is_active);
    }

    #[test]
    fn test_count_increments() {
        let (env, admin, client) = setup();
        assert_eq!(client.count(), 0);
        client.register(
            &admin,
            &String::from_str(&env, "CAAA111"),
            &String::from_str(&env, "TokenA"),
            &String::from_str(&env, "1.0.0"),
            &String::from_str(&env, "A token contract"),
            &String::from_str(&env, "https://github.com/example/tokena"),
            &String::from_str(&env, "hash001"),
        );
        assert_eq!(client.count(), 1);
    }

    #[test]
    fn test_deactivate_marks_inactive() {
        let (env, admin, client) = setup();
        let addr = String::from_str(&env, "CDEPRECATED");
        client.register(
            &admin, &addr,
            &String::from_str(&env, "OldContract"),
            &String::from_str(&env, "0.1.0"),
            &String::from_str(&env, "No longer maintained"),
            &String::from_str(&env, "https://github.com/example/old"),
            &String::from_str(&env, "oldhash"),
        );
        client.deactivate(&admin, &addr);
        assert!(!client.get_entry(&addr).is_active);
    }

    #[test]
    fn test_is_registered() {
        let (env, admin, client) = setup();
        let addr = String::from_str(&env, "CCHECK999");
        assert!(!client.is_registered(&addr));
        client.register(
            &admin, &addr,
            &String::from_str(&env, "CheckContract"),
            &String::from_str(&env, "1.0.0"),
            &String::from_str(&env, "Test"),
            &String::from_str(&env, "https://github.com/example/check"),
            &String::from_str(&env, "checkhash"),
        );
        assert!(client.is_registered(&addr));
    }
}
