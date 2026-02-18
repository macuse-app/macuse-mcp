#!/usr/bin/env node

/**
 * Macuse MCP Proxy - Stdio Wrapper
 *
 * This is a thin wrapper that spawns `macuse mcp` and forwards stdin/stdout.
 * All MCP protocol handling, OAuth authentication, and reconnection logic
 * is handled by the Macuse CLI itself.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline";

const DEFAULT_MACUSE_BINARY = "/Applications/Macuse.app/Contents/MacOS/macuse";

const MACUSE_BINARY = process.env.MACUSE_BINARY || DEFAULT_MACUSE_BINARY;
const DEBUG = process.env.DEBUG === "true";

function log(message: string): void {
  if (DEBUG) {
    console.error(`[macuse-proxy] ${message}`);
  }
}

function openDownloadPage(): void {
  const url = "https://macuse.app/download/";
  try {
    spawn("open", [url], { stdio: "ignore", detached: true }).unref();
  } catch {
    // Ignore errors
  }
  console.error(
    `Macuse is not installed. Please download from: ${url}\nAfter installing, restart this command.`,
  );
}

function startMacuseProcess(): ChildProcess {
  log(`Starting Macuse MCP bridge: ${MACUSE_BINARY} mcp`);

  const args = ["mcp"];
  if (DEBUG) {
    args.push("--debug");
  }

  const macuseProcess = spawn(MACUSE_BINARY, args, {
    stdio: ["pipe", "pipe", "inherit"],
    env: process.env,
  });

  return macuseProcess;
}

function main(): void {
  // Check platform
  if (process.platform !== "darwin") {
    console.error(
      `Macuse supports macOS only. Current platform: ${process.platform}`,
    );
    process.exit(1);
  }

  // Check if Macuse is installed
  if (!existsSync(MACUSE_BINARY)) {
    openDownloadPage();
    process.exit(1);
  }

  const macuseProcess = startMacuseProcess();

  // Verify stdio streams are available (guaranteed by spawn config)
  if (!macuseProcess.stdin || !macuseProcess.stdout) {
    console.error("Failed to create stdio streams for Macuse process");
    process.exit(1);
  }

  // Forward stdin to macuse process (raw pipe — MCP messages are line-delimited)
  process.stdin.pipe(macuseProcess.stdin);

  // Forward macuse stdout line-by-line to ensure each JSON-RPC message
  // is written as a single atomic write(), preventing large messages
  // (e.g. base64 images) from being split across pipe buffer boundaries.
  const rl = createInterface({
    input: macuseProcess.stdout,
    crlfDelay: Infinity,
  });
  rl.on("line", (line) => {
    process.stdout.write(`${line}\n`);
  });

  // Handle process exit
  macuseProcess.on("exit", (code, signal) => {
    log(`Macuse process exited with code ${code}, signal ${signal}`);
    process.exit(code ?? (signal ? 1 : 0));
  });

  macuseProcess.on("error", (error) => {
    console.error(`Failed to start Macuse: ${error.message}`);
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      openDownloadPage();
    }
    process.exit(1);
  });

  // Handle graceful shutdown
  const shutdown = () => {
    log("Shutting down...");
    macuseProcess.kill("SIGTERM");
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Handle stdin close (client disconnected)
  process.stdin.on("end", () => {
    log("stdin closed, shutting down");
    macuseProcess.kill("SIGTERM");
  });
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

main();
