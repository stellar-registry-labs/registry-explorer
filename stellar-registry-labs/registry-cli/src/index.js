#!/usr/bin/env node
/**
 * registry-cli — Command line interface for the Soroban Contract Registry
 *
 * Usage:
 *   registry register --address CXXX --name MyDEX --version 1.0.0 ...
 *   registry get --address CXXX
 *   registry list
 *   registry count
 *
 * Make sure you have REGISTRY_CONTRACT_ID and STELLAR_SECRET_KEY set in .env
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { table } from "table";
import {
  Networks,
  SorobanRpc,
  TransactionBuilder,
  Contract,
  Keypair,
  nativeToScVal,
  scValToNative,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─────────────────────────────────────────────
// CONFIG — reads from .env file
// ─────────────────────────────────────────────

function loadConfig() {
  try {
    // Simple .env loader (no dotenv dependency needed)
    const env = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    env.split("\n").forEach((line) => {
      const [key, ...val] = line.split("=");
      if (key && val) process.env[key.trim()] = val.join("=").trim();
    });
  } catch {
    // .env not found — user must set env vars manually
  }

  const contractId = process.env.REGISTRY_CONTRACT_ID;
  const secretKey = process.env.STELLAR_SECRET_KEY;
  const rpcUrl = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
  const networkPassphrase = process.env.STELLAR_NETWORK === "mainnet"
    ? Networks.PUBLIC
    : Networks.TESTNET;

  if (!contractId) {
    console.error(chalk.red("Error: REGISTRY_CONTRACT_ID not set in .env"));
    process.exit(1);
  }

  return { contractId, secretKey, rpcUrl, networkPassphrase };
}

// ─────────────────────────────────────────────
// SOROBAN HELPERS
// ─────────────────────────────────────────────

/**
 * Call a read-only function on the registry contract.
 * These don't need a signature — they just query state.
 */
async function callReadFunction(server, contractId, networkPassphrase, method, args = []) {
  const contract = new Contract(contractId);
  const account = await server.getAccount("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"); // fee-only account

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx);
  if (result.error) throw new Error(result.error);

  return scValToNative(result.result.retval);
}

/**
 * Call a write function (register, update, deactivate).
 * These require a secret key to sign the transaction.
 */
async function callWriteFunction(server, contractId, networkPassphrase, secretKey, method, args) {
  if (!secretKey) {
    console.error(chalk.red("Error: STELLAR_SECRET_KEY not set in .env (needed for write operations)"));
    process.exit(1);
  }

  const keypair = Keypair.fromSecret(secretKey);
  const contract = new Contract(contractId);
  const account = await server.getAccount(keypair.publicKey());
  const spinner = ora("Submitting transaction to Stellar testnet...").start();

  try {
    // Build the transaction
    let tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    // Simulate first (gets footprint and fee estimate)
    const simResult = await server.simulateTransaction(tx);
    if (simResult.error) throw new Error(simResult.error);

    // Assemble with simulation results
    tx = SorobanRpc.assembleTransaction(tx, simResult).build();

    // Sign and send
    tx.sign(keypair);
    const sendResult = await server.sendTransaction(tx);

    // Wait for confirmation
    let status = sendResult;
    while (status.status === "PENDING" || status.status === "NOT_FOUND") {
      await new Promise((r) => setTimeout(r, 2000));
      status = await server.getTransaction(sendResult.hash);
    }

    spinner.succeed(chalk.green("Transaction confirmed!"));
    return status;
  } catch (err) {
    spinner.fail(chalk.red("Transaction failed"));
    throw err;
  }
}

// ─────────────────────────────────────────────
// CLI COMMANDS
// ─────────────────────────────────────────────

const program = new Command();

program
  .name("registry")
  .description("CLI for the Soroban Contract Registry on Stellar")
  .version("0.1.0");

// ── register ──────────────────────────────────
program
  .command("register")
  .description("Register a new contract in the registry")
  .requiredOption("--address <addr>", "Deployed contract address")
  .requiredOption("--name <name>", "Human-readable name")
  .requiredOption("--version <ver>", "Version string (e.g. 1.0.0)")
  .requiredOption("--description <desc>", "What does this contract do?")
  .requiredOption("--source <url>", "Source code URL (GitHub, etc.)")
  .requiredOption("--abi-hash <hash>", "SHA-256 hash of the ABI JSON")
  .action(async (opts) => {
    const { contractId, secretKey, rpcUrl, networkPassphrase } = loadConfig();
    const server = new SorobanRpc.Server(rpcUrl);
    const keypair = Keypair.fromSecret(secretKey);

    console.log(chalk.blue("\n📋 Registering contract:"), opts.address);

    await callWriteFunction(server, contractId, networkPassphrase, secretKey, "register", [
      nativeToScVal(keypair.publicKey(), { type: "address" }),
      nativeToScVal(opts.address, { type: "string" }),
      nativeToScVal(opts.name, { type: "string" }),
      nativeToScVal(opts.version, { type: "string" }),
      nativeToScVal(opts.description, { type: "string" }),
      nativeToScVal(opts.source, { type: "string" }),
      nativeToScVal(opts.abiHash, { type: "string" }),
    ]);

    console.log(chalk.green(`\n✅ Contract "${opts.name}" registered successfully!`));
  });

// ── get ───────────────────────────────────────
program
  .command("get")
  .description("Fetch details for a specific registered contract")
  .requiredOption("--address <addr>", "Contract address to look up")
  .action(async (opts) => {
    const { contractId, rpcUrl, networkPassphrase } = loadConfig();
    const server = new SorobanRpc.Server(rpcUrl);
    const spinner = ora("Fetching entry...").start();

    try {
      const entry = await callReadFunction(server, contractId, networkPassphrase, "get_entry", [
        nativeToScVal(opts.address, { type: "string" }),
      ]);
      spinner.stop();

      console.log("\n" + table([
        ["Field", "Value"],
        ["Name", entry.name],
        ["Version", entry.version],
        ["Description", entry.description],
        ["Source URL", entry.source_url],
        ["ABI Hash", entry.abi_hash],
        ["Owner", entry.owner],
        ["Status", entry.is_active ? chalk.green("Active") : chalk.red("Inactive")],
        ["Registered At", new Date(entry.registered_at * 1000).toISOString()],
      ]));
    } catch (e) {
      spinner.fail(chalk.red("Contract not found"));
    }
  });

// ── list ──────────────────────────────────────
program
  .command("list")
  .description("List all registered contracts")
  .action(async () => {
    const { contractId, rpcUrl, networkPassphrase } = loadConfig();
    const server = new SorobanRpc.Server(rpcUrl);
    const spinner = ora("Fetching registry...").start();

    const addresses = await callReadFunction(server, contractId, networkPassphrase, "get_all");
    spinner.stop();

    if (!addresses || addresses.length === 0) {
      console.log(chalk.yellow("No contracts registered yet."));
      return;
    }

    console.log(chalk.blue(`\nFound ${addresses.length} registered contracts:\n`));
    addresses.forEach((addr, i) => {
      console.log(chalk.gray(`${i + 1}.`), addr);
    });
  });

// ── count ─────────────────────────────────────
program
  .command("count")
  .description("Show total number of registered contracts")
  .action(async () => {
    const { contractId, rpcUrl, networkPassphrase } = loadConfig();
    const server = new SorobanRpc.Server(rpcUrl);

    const count = await callReadFunction(server, contractId, networkPassphrase, "count");
    console.log(chalk.blue(`\n📊 Total registered contracts: ${chalk.bold(count)}\n`));
  });

// ── deactivate ────────────────────────────────
program
  .command("deactivate")
  .description("Mark a contract as deprecated/inactive")
  .requiredOption("--address <addr>", "Contract address to deactivate")
  .action(async (opts) => {
    const { contractId, secretKey, rpcUrl, networkPassphrase } = loadConfig();
    const server = new SorobanRpc.Server(rpcUrl);
    const keypair = Keypair.fromSecret(secretKey);

    await callWriteFunction(server, contractId, networkPassphrase, secretKey, "deactivate", [
      nativeToScVal(keypair.publicKey(), { type: "address" }),
      nativeToScVal(opts.address, { type: "string" }),
    ]);

    console.log(chalk.yellow(`\n⚠️  Contract ${opts.address} marked as inactive.`));
  });

program.parse();
