# Vision Sync

Vision Sync is a deterministic frontend API integration engine for React and Next.js projects. It generates isolated TypeScript types, fetch clients, hooks, and optional modules from OpenAPI schemas while keeping developer-owned UI immutable by default.

## Commands

```bash
npx vision-sync init
npx vision-sync sync
npx vision-sync sync --schema ./openapi.json --preview
npx vision-sync history
npx vision-sync rollback
```

## Safety Model

- Safe mode, dry-run previews, backups, and rollback snapshots are enabled by default.
- Generated files are isolated under `src/generated/vision` unless configured otherwise.
- Existing files are only overwritten when they contain Vision generated markers.
- AST transforms are disabled by default and are limited to explicit generated regions when enabled.
- All writes go through diff analysis, ownership checks, snapshots, atomic writes, and checksum validation.

## Integration Levels

| Level | Behavior |
| --- | --- |
| 1 | Generate types, client, and hooks when TanStack Query is detected |
| 2 | Generate isolated modules in addition to Level 1 output |
| 3 | Enable AST-assisted integration previews only |
| 4 | Preview-only advanced integration planning |

## Configuration

`vision.config.ts` is created by `vision-sync init`.

```ts
import { defineConfig } from "vision-sync";

export default defineConfig({
  schema: {
    type: "file",
    path: "./openapi.json"
  },
  output: {
    baseDir: "src/generated/vision"
  },
  safety: {
    safeMode: true,
    previewMode: true,
    dryRunByDefault: true,
    rollback: true
  },
  integration: {
    level: 1,
    mode: "conservative",
    astEnabled: false
  }
});
```

## Local Smoke Test

```bash
npm run build
node dist/cli/bin.js sync --schema examples/openapi.json --preview
```
