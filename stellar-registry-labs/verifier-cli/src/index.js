#!/usr/bin/env node
/**
 * verifier-cli — CLI for the Soroban Contract Verifier
 *
 * Commands:
 *   verifier submit   — Submit a contract for verification
 *   verifier check    — Check if a contract is verified
 *   verifier hash     — Compute the SHA-256 hash of a .wasm file
 *   verifier list     — List all verified contracts
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  Networks, SorobanRpc, TransactionBuilder, Contract,
  Keypair, nativeToScVal, scValToNative, BASE_FEE,
} from "@stellar/stellar-sdk";

function loadConfig() {
  try {
    const env = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    env.split("\n").forEach(line => {
      const [key, ...val] = line.split("=");
      if (key && val) process.env[key.trim()] = val.join("=").trim();
    });
  } catch {}
  return {
    contractId: process.env.VERIFIER_CONTRACT_ID || "",
    secretKey: process.env.STELLAR_SECRET_KEY || "",
    rpcUrl: process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org",
    networkPassphrase: Networks.TESTNET,
  };
}

const SIM_ACCOUNT = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";

async function readContract(method, args = []) {
  const { contractId, rpcUrl, networkPassphrase } = loadConfig();
  const server = new SorobanRpc.Server(rpcUrl);
  const contract = new Contract(contractId);
  const account = await server.getAccount(SIM_ACCOUNT);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(contract.call(method, ...args)).setTimeout(30).build();
  const result = await server.simulateTransaction(tx);
  if (result.error) throw new Error(result.error);
  return scValToNative(result.result.retval);
}

const program = new Command();
program.name("verifier").description("Soroban Contract Verifier CLI").version("0.1.0");

// ── hash ──────────────────────────────────────
program
  .command("hash")
  .description("Compute SHA-256 hash of a file (use on your .wasm or source zip)")
  .requiredOption("--file <path>", "Path to the file")
  .action((opts) => {
    const data = readFileSync(resolve(process.cwd(), opts.file));
    const hash = createHash("sha256").update(data).digest("hex");
    console.log(chalk.blue("\nSHA-256 Hash:"));
    console.log(chalk.bold(hash));
    console.log(chalk.gray("\nUse this when submitting your contract for verification.\n"));
  });

// ── check ─────────────────────────────────────
program
  .command("check")
  .description("Check whether a contract address is verified")
  .requiredOption("--address <addr>", "Contract address to check")
  .action(async (opts) => {
    const spinner = ora("Checking verification status...").start();
    try {
      const isVerified = await readContract("is_verified", [
        nativeToScVal(opts.address, { type: "string" }),
      ]);
      spinner.stop();
      if (isVerified) {
        console.log(chalk.green(`\n✅ VERIFIED — ${opts.address} matches its published source code.\n`));
      } else {
        console.log(chalk.yellow(`\n⚠️  NOT VERIFIED — ${opts.address} has not been confirmed yet.\n`));
      }
    } catch {
      spinner.fail("Could not check — contract may not be in the verifier.");
    }
  });

// ── list ──────────────────────────────────────
program
  .command("list")
  .description("List all verified contracts")
  .action(async () => {
    const spinner = ora("Fetching verified contracts...").start();
    const addresses = await readContract("get_all_verified");
    spinner.stop();
    if (!addresses?.length) {
      console.log(chalk.yellow("\nNo verified contracts yet.\n"));
      return;
    }
    console.log(chalk.green(`\n✅ ${addresses.length} verified contracts:\n`));
    addresses.forEach((addr, i) => console.log(chalk.gray(`${i + 1}.`), addr));
    console.log();
  });

program.parse();
