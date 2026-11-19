// Leonida Trophy Guide, handed in for gta6-trophy-guide-01 (Node 22, standard
// library only). The guide itself is app/: plain static files, index.html at
// its root, a tracker that saves to localStorage and reads its two data files
// (data/trophies.json with the 55 official trophies and our own guides, and
// data/roadmap.json with the six phases to the platinum). It loads nothing
// over the network, so it works with the network off.
//
// This program is the hand-in: it takes app/ and screenshots/ from beside
// this file, copies them into the output directory, and writes
// dossier.json there with make.fun's vendored library
// (vendor/makefun-frontend.ts, the kit's copy, untouched). The scorer
// rebuilds the dossier from the same files with its own copy and expects
// byte-identical output, so this program adds nothing of its own.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for
// /output, for example:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Run it twice into two directories and the bytes must match exactly.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The repository root is the folder this file sits in; the output folder is
// /output inside the grader, or MAKEFUN_OUTPUT_DIR when set.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn(folder, out) {
  mkdirSync(out, { recursive: true });
  cpSync(join(repoRoot, folder), join(out, folder), { recursive: true });
}

handIn('app', outputDir);
if (existsSync(join(repoRoot, 'screenshots'))) handIn('screenshots', outputDir);

// Caps from the scorer: at most 4 screenshots of 256 KiB each, app/ at most
// 993 files and directories and 48 MiB, and the dossier text at most
// 160 KiB (163840 bytes). buildDossier refuses anything past them.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
