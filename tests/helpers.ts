import fs from "node:fs";
import path from "node:path";

export type TestCredentials = {
  customerEmail: string;
  customerPassword: string;
  adminEmail: string;
  adminPassword: string;
};

export function readCredentials(): TestCredentials {
  const file = path.join(__dirname, ".auth", "credentials.json");
  if (!fs.existsSync(file)) {
    throw new Error(
      "tests/.auth/credentials.json not found — did global setup run? " +
        "Run tests via `npm run test:e2e`, not by calling playwright directly " +
        "against a single file without the config."
    );
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

export function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@example.com`;
}
