#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const HELP = `Usage: create-form <path-to-json> [options]

Options:
  --token <token>          Google access token (or set GOOGLE_ACCESS_TOKEN env var)
  --backend-url <url>      Backend base URL (default: http://localhost:3000)
  --dry-run                Validate only, do not create the form
  --help, -h               Show this help message`;

export function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const flags = {
    help: args.includes('--help') || args.includes('-h'),
    dryRun: args.includes('--dry-run'),
    token: '',
    backendUrl: process.env.BACKEND_URL ?? 'http://localhost:3000',
    filePath: '',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--token') flags.token = args[++i] ?? '';
    else if (args[i] === '--backend-url') flags.backendUrl = args[++i] ?? flags.backendUrl;
    else if (!args[i].startsWith('--') && !flags.filePath) flags.filePath = args[i];
  }

  if (!flags.token) flags.token = process.env.GOOGLE_ACCESS_TOKEN ?? '';
  if (!flags.filePath) flags.help = true;
  return flags;
}

export async function run(argv: string[]): Promise<void> {
  const flags = parseArgs(argv);

  if (flags.help || !flags.filePath) {
    console.log(HELP);
    return;
  }

  const resolved = path.resolve(process.cwd(), flags.filePath);

  let raw: string;
  try {
    raw = await fs.readFile(resolved, 'utf-8');
  } catch {
    console.error(`Error: cannot read file "${resolved}"`);
    process.exitCode = 1;
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    console.error('Error: file is not valid JSON');
    process.exitCode = 1;
    return;
  }

  let validateRes: Response;
  try {
    validateRes = await fetch(`${flags.backendUrl}/forms/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error(`Error: cannot reach backend at ${flags.backendUrl} — ${String(err)}`);
    process.exitCode = 1;
    return;
  }

  const validation = (await validateRes.json()) as { valid: boolean; errors: string[] };
  if (!validation.valid) {
    console.error('Validation failed:');
    for (const e of validation.errors) console.error(`  • ${e}`);
    process.exitCode = 1;
    return;
  }
  console.log('✓ Valid DSL');

  if (flags.dryRun) return;

  if (!flags.token) {
    console.error('Error: --token <token> or GOOGLE_ACCESS_TOKEN env var is required to create a form');
    process.exitCode = 1;
    return;
  }

  let createRes: Response;
  try {
    createRes = await fetch(`${flags.backendUrl}/forms/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${flags.token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error(`Error: form creation request failed — ${String(err)}`);
    process.exitCode = 1;
    return;
  }

  if (!createRes.ok) {
    const body = (await createRes.json().catch(() => ({}))) as { message?: string };
    console.error(`Error: form creation failed — ${body.message ?? createRes.statusText}`);
    process.exitCode = 1;
    return;
  }

  const result = (await createRes.json()) as { formUrl: string };
  console.log(result.formUrl);
}

if (require.main === module) {
  run(process.argv).catch((err: unknown) => {
    console.error(`Unexpected error: ${String(err)}`);
    process.exitCode = 1;
  });
}
