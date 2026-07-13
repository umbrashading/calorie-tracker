#!/usr/bin/env node

import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function required(name) {
  const value = process.env[name];
  if (!value) {
    fail(
      `Missing ${name}. Add it to your Cursor Cloud Environment secrets (or .env.local for local dev).`
    );
  }
  return value;
}

function getProjectRef() {
  if (process.env.SUPABASE_PROJECT_REF) {
    return process.env.SUPABASE_PROJECT_REF;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url) {
    const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (match) {
      return match[1];
    }
  }

  fail(
    "Missing SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL (e.g. https://abcdefgh.supabase.co)."
  );
}

const token = required("SUPABASE_ACCESS_TOKEN");
const projectRef = getProjectRef();
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

const env = {
  ...process.env,
  SUPABASE_ACCESS_TOKEN: token,
};

function run(command) {
  execSync(command, { cwd: root, stdio: "inherit", env });
}

console.log(`Linking Supabase project: ${projectRef}`);

try {
  if (dbPassword) {
    run(`npx supabase link --project-ref ${projectRef} --password "${dbPassword}"`);
  } else {
    run(`npx supabase link --project-ref ${projectRef}`);
  }
} catch {
  console.log("Link step skipped or already linked — continuing with db push.");
}

console.log("Applying migrations from supabase/migrations/ ...");
run("npx supabase db push");
console.log("Migrations applied successfully.");
