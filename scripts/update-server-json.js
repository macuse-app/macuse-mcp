#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

function sha256OfFile(path) {
  const buf = readFileSync(path);
  return createHash("sha256").update(buf).digest("hex");
}

try {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const file =
    readdirSync(".").find((f) => f.endsWith(".mcpb")) || "macuse.mcpb";
  const hash = sha256OfFile(file);

  const server = existsSync("server.json")
    ? JSON.parse(readFileSync("server.json", "utf8"))
    : {};

  // Update version and package information
  server.version = pkg.version;

  // Update the first package entry
  if (server.packages && server.packages.length > 0) {
    server.packages[0].version = pkg.version;
    server.packages[0].identifier = `https://github.com/macuse-app/macuse-mcp/releases/download/v${pkg.version}/macuse-${pkg.version}.mcpb`;
    server.packages[0].file_sha256 = hash;
    server.packages[0].transport = {
      type: "stdio",
    };
  }

  writeFileSync("server.json", `${JSON.stringify(server, null, 2)}\n`);
  console.log("server.json updated:", {
    version: pkg.version,
    package_identifier: server.packages?.[0]?.identifier,
    file_sha256: hash,
  });
} catch (err) {
  console.error("Failed to update server.json:", err.message);
  process.exit(1);
}
