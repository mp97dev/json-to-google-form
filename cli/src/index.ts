#!/usr/bin/env node

import path from 'node:path';

const args = process.argv.slice(2);

function printHelp() {
  console.log('Usage: create-form <path-to-json>');
}

function main() {
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const inputPath = args[0];
  const resolved = path.resolve(process.cwd(), inputPath);
  console.log(`CLI scaffold ready. Next phase will process file: ${resolved}`);
}

main();
