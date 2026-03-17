/**
 * Soroban Contract Verifier — Dashboard
 *
 * Shows all verified contracts with their source hashes.
 * Users can paste a contract address to instantly check its verification status.
 *
 * TODO for contributors:
 * - Add a submission form for developers to submit their contracts
 * - Add a "copy hash" button
 * - Add verification timestamp display
 * - Add link to verification details page
 */

import React, { useState, useEffect } from "react";
import { Networks, SorobanRpc, TransactionBuilder, Contract, nativeToScVal, scValToNative, BASE_FEE } from "@stellar/stellar-sdk";

const CONFIG = {
  contractId: import.meta.env.VITE_VERIFIER_CONTRACT_ID || "",
  rpcUrl: import.meta.env.VITE_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org",
  networkPassphrase: Networks.TESTNET,
};

const SIM_ACCOUNT = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";

async function readContract(method, args = []) {
  const server = new SorobanRpc.Server(CONFIG.rpcUrl);
  const contract = new Contract(CONFIG.contractId);
  const account = await server.getAccount(SIM_ACCOUNT);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: CONFIG.networkPassphrase })
    .addOperation(contract.call(method, ...args)).setTimeout(30).build();
  const result = await server.simulateTransaction(tx);
  if (result.error) throw new Error(result.error);
  return scValToNative(result.result.retval);
}

export default function App() {
  const [verified, setVerified] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkAddr, setCheckAddr] = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    readContract("get_all_verified")
      .then(setVerified)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleCheck() {
    if (!checkAddr.trim()) return;
    setChecking(true);
    setCheckResult(null);
    try {
      const result = await readContract("is_verified", [nativeToScVal(checkAddr.trim(), { type: "string" })]);
      setCheckResult(result);
    } catch {
      setCheckResult(false);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #1e293b", padding: "20px 32px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>🔍 Soroban Contract Verifier</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Check if a smart contract's source code matches its deployment</p>
      </header>

      <main style={{ padding: 32 }}>
        {/* Quick check */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 24, marginBottom: 32, maxWidth: 600 }}>
          <h2 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Quick Verification Check</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={checkAddr}
              onChange={e => setCheckAddr(e.target.value)}
              placeholder="Enter contract address..."
              style={{ flex: 1, padding: "10px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 14 }}
              onKeyDown={e => e.key === "Enter" && handleCheck()}
            />
            <button
              onClick={handleCheck}
              disabled={checking}
              style={{ padding: "10px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontWeight: 600 }}
            >
              {checking ? "..." : "Check"}
            </button>
          </div>
          {checkResult !== null && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: checkResult ? "#14532d" : "#450a0a", color: checkResult ? "#86efac" : "#fca5a5" }}>
              {checkResult ? "✅ Verified — source matches deployment" : "❌ Not verified"}
            </div>
          )}
        </div>

        {/* Verified list */}
        <h2 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
          ✅ Verified Contracts {!loading && <span style={{ color: "#6366f1" }}>({verified.length})</span>}
        </h2>
        {loading ? (
          <p style={{ color: "#64748b" }}>Loading...</p>
        ) : verified.length === 0 ? (
          <p style={{ color: "#64748b" }}>No verified contracts yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {verified.map((addr, i) => (
              <div key={i} style={{ background: "#1e293b", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "#86efac", fontSize: 16 }}>✅</span>
                <span style={{ fontFamily: "monospace", fontSize: 13, color: "#94a3b8", wordBreak: "break-all" }}>{addr}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
