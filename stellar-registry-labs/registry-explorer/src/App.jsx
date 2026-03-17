/**
 * Soroban Contract Registry — Web Explorer
 *
 * A React app that reads from the on-chain registry contract
 * and lets users browse, search, and view contract details.
 *
 * TODO for contributors:
 * - Add pagination for large registries
 * - Add category/tag filtering
 * - Add a "Register Contract" form
 * - Add dark/light mode toggle
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Networks,
  SorobanRpc,
  TransactionBuilder,
  Contract,
  nativeToScVal,
  scValToNative,
  BASE_FEE,
} from "@stellar/stellar-sdk";

// ─────────────────────────────────────────────
// CONFIG — update these for your deployment
// ─────────────────────────────────────────────

const CONFIG = {
  contractId: import.meta.env.VITE_REGISTRY_CONTRACT_ID || "",
  rpcUrl: import.meta.env.VITE_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org",
  networkPassphrase: Networks.TESTNET,
};

// ─────────────────────────────────────────────
// STELLAR HELPERS
// ─────────────────────────────────────────────

// Fee-only public key for read simulations (no signing needed)
const SIM_ACCOUNT = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";

async function readContract(method, args = []) {
  const server = new SorobanRpc.Server(CONFIG.rpcUrl);
  const contract = new Contract(CONFIG.contractId);
  const account = await server.getAccount(SIM_ACCOUNT);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: CONFIG.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx);
  if (result.error) throw new Error(result.error);
  return scValToNative(result.result.retval);
}

// ─────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────

/** Badge showing active/inactive status */
function StatusBadge({ isActive }) {
  return (
    <span style={{
      padding: "2px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      background: isActive ? "#14532d" : "#450a0a",
      color: isActive ? "#86efac" : "#fca5a5",
    }}>
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

/** A card showing one contract entry */
function ContractCard({ entry, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 12,
        padding: 20,
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#6366f1"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#334155"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>{entry.name}</h3>
        <StatusBadge isActive={entry.is_active} />
      </div>
      <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 12 }}>{entry.description}</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#6366f1", background: "#1e1b4b", padding: "2px 8px", borderRadius: 6 }}>
          v{entry.version}
        </span>
        {entry.source_url && (
          <a
            href={entry.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 12, color: "#38bdf8" }}
          >
            View Source ↗
          </a>
        )}
      </div>
    </div>
  );
}

/** Detail modal for a single contract */
function ContractModal({ entry, onClose }) {
  if (!entry) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: "#1e293b", borderRadius: 16, padding: 32, maxWidth: 600, width: "100%", border: "1px solid #334155" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>{entry.name}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 24, cursor: "pointer" }}>✕</button>
        </div>
        {[
          ["Version", entry.version],
          ["Description", entry.description],
          ["Source URL", entry.source_url],
          ["ABI Hash", entry.abi_hash],
          ["Owner", entry.owner],
          ["Registered At", new Date(entry.registered_at * 1000).toLocaleString()],
        ].map(([label, value]) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 14, color: "#e2e8f0", wordBreak: "break-all" }}>{value}</div>
          </div>
        ))}
        <div style={{ marginTop: 16 }}>
          <StatusBadge isActive={entry.is_active} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────

export default function App() {
  const [addresses, setAddresses] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  // Load all contract addresses, then fetch each entry
  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        const addrs = await readContract("get_all");
        setAddresses(addrs);

        // Fetch each entry in parallel
        const fetched = await Promise.all(
          addrs.map(addr =>
            readContract("get_entry", [nativeToScVal(addr, { type: "string" })])
              .then(e => ({ ...e, address: addr }))
              .catch(() => null)
          )
        );

        setEntries(fetched.filter(Boolean));
      } catch (err) {
        setError("Could not connect to the registry. Check your .env config.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // Filter entries by search query
  const filtered = entries.filter(e =>
    !search ||
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #1e293b", padding: "20px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>⭐ Soroban Contract Registry</h1>
          <p style={{ fontSize: 14, color: "#64748b" }}>Discover verified smart contracts on the Stellar network</p>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 14, color: "#6366f1", fontWeight: 600 }}>
          {entries.length} contracts
        </div>
      </header>

      {/* Search */}
      <div style={{ padding: "24px 32px 0" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or description..."
          style={{
            width: "100%", maxWidth: 480, padding: "10px 16px",
            background: "#1e293b", border: "1px solid #334155",
            borderRadius: 8, color: "#f1f5f9", fontSize: 14, outline: "none",
          }}
        />
      </div>

      {/* Content */}
      <main style={{ padding: 32 }}>
        {loading && (
          <div style={{ textAlign: "center", color: "#64748b", marginTop: 60 }}>
            Loading registry...
          </div>
        )}
        {error && (
          <div style={{ background: "#450a0a", border: "1px solid #991b1b", borderRadius: 8, padding: 16, color: "#fca5a5" }}>
            {error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#64748b", marginTop: 60 }}>
            {search ? "No contracts match your search." : "No contracts registered yet."}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filtered.map((entry, i) => (
            <ContractCard key={i} entry={entry} onClick={() => setSelected(entry)} />
          ))}
        </div>
      </main>

      {/* Detail modal */}
      <ContractModal entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
