# Vision Sync

> Deterministic frontend API synchronization for React and Next.js.

Vision Sync is infrastructure-grade tooling for keeping frontend API integrations aligned with OpenAPI schemas without surrendering control of your UI.

It generates lightweight TypeScript types, fetch clients, hooks, and optional integration modules inside isolated generated boundaries. Developer-owned components stay yours. AST transforms are opt-in, previewable, validated, and rollback-safe.

**Safe by default. Diffable by design. Reversible every time.**

[![npm version](https://img.shields.io/npm/v/vision-sync?color=111827&label=npm)](https://www.npmjs.com/package/vision-sync)
[![TypeScript](https://img.shields.io/badge/TypeScript-first-3178c6)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D20.11.0-339933)](https://nodejs.org/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-ready-6ba539)](https://www.openapis.org/)
[![License](https://img.shields.io/badge/license-MIT-black)](#license)

```bash
npm install vision-sync
```

---

## What Is Vision Sync?

Frontend teams spend too much time repeating the same integration work:

- translating OpenAPI schemas into frontend types
- writing fetch clients by hand
- creating query hooks
- wiring generated data into component-driven architectures
- reviewing unsafe generator diffs
- cleaning up stale API code after backend changes

Most generators solve only one part of the problem. They create code, but they often create uncertainty too.

They may overwrite files, rewrite pages, mutate component structure, ignore custom architecture, or hide too much behavior behind runtime abstractions. AST tooling can be even riskier when it edits code without clear boundaries.

Vision Sync exists to make frontend API integration feel like trusted infrastructure tooling.

It is **not** an AI code generator.  
It is **not** a CRUD scaffolder.  
It is **not** unsafe automation.

Vision Sync is a deterministic synchronization engine built for React and Next.js teams that care about safety, predictable diffs, rollback paths, and developer-owned UI.

---

## Core Philosophy

Vision Sync is designed around one principle:

> Automation is only useful when developers can trust it.

That means every change should be explainable, inspectable, diffable, and reversible.

### Deterministic Generation

The same schema and config produce the same output. No hidden prompts. No hallucinated code. No surprising rewrites.

### Safe Transformations

AST transformations are handled like compiler infrastructure. Vision Sync uses TypeScript-aware parsing, explicit permissions, generated markers, syntax validation, conflict checks, and rollback checkpoints.

### Rollback-First Architecture

Every write can create a snapshot before files are touched. Rollback is not a rescue feature. It is part of the normal generation contract.

### Developer-Owned UI

Your pages, handcrafted layouts, animations, design systems, and business logic are protected. Generated code lives in isolated zones.

### Zero-Runtime Overhead Where Possible

Vision Sync prefers compile-time generation over runtime magic. Generated output is static, tree-shakeable, and easy to inspect.

### Infrastructure-Grade Tooling

The CLI behaves like a serious build tool: preview first, validate before writing, write atomically, and fail safely.

### Transparency And Reversibility

Vision Sync shows what changed, why it changed, where code was generated, and how to undo it.

---

## Features

### 🛡 Safety Engine

| Feature | What It Does |
| --- | --- |
| 🧪 Dry-run previews | Shows diffs before files are modified |
| 🧾 Rollback snapshots | Creates restore points before write transactions |
| 🔐 Ownership boundaries | Prevents generated code from overwriting developer-owned files |
| 🚧 Protected regions | Keeps app pages, components, and protected folders immutable by default |
| ⚛ Atomic writes | Writes files safely to prevent partial corruption |
| ✅ Checksum validation | Verifies generated content after write operations |
| 🧯 Crash recovery | Restores from snapshots if a transaction fails |

### 🧠 AST-Safe Integration

| Feature | What It Does |
| --- | --- |
| 🌳 `ts-morph` transforms | Uses AST traversal instead of regex edits |
| 🎯 Deterministic targeting | Edits only explicit, approved regions |
| 🧩 Import deduplication | Adds imports without duplicating existing declarations |
| ⚠ Conflict detection | Rejects unsafe identifier collisions |
| 🧪 Compiler validation | Validates transformed TypeScript before writes |
| 👀 Preview-first automation | Advanced integration stays opt-in and reviewable |

### 🔄 API Synchronization

| Feature | What It Does |
| --- | --- |
| 📘 OpenAPI support | Reads JSON and YAML OpenAPI documents |
| 🔍 Schema validation | Validates schema shape before generation |
| 🧬 Schema diffing | Tracks added, changed, unchanged, and removed operations |
| ♻ Incremental regeneration | Regenerates affected output instead of rewriting projects |
| 📦 Cache-first architecture | Stores schema digests for future sync decisions |
| 🕰 Watch mode | Regenerates safely when a local schema changes |

### ⚡ Lightweight Runtime

| Feature | What It Does |
| --- | --- |
| 🪶 Minimal client | Generates direct fetch helpers without heavy SDK layers |
| 🌲 Tree-shakeable output | Emits modular TypeScript files |
| 🏗 Compile-time generation | Produces static source files instead of runtime reflection |
| 🧱 Static types | Pushes correctness into TypeScript |
| 🧩 Optional hooks | Generates TanStack Query hooks only when appropriate |
| 🚫 No hidden providers | Does not wrap your application |

### ✨ Smart CLI

| Feature | What It Does |
| --- | --- |
| 🧭 Guided setup | `vision-sync init` walks through safe defaults |
| 🕵 Project detection | Detects Next.js, TypeScript, TanStack Query, Tailwind, monorepos, and API folders |
| 🎨 Polished terminal UI | Uses readable tables, progress states, and human-friendly errors |
| 📋 Diff previews | Shows affected files and before/after context |
| 🧰 Simple commands | Keeps the command surface small and memorable |

---

## Installation

Install Vision Sync with your package manager.

```bash
npm install vision-sync
```

```bash
pnpm add vision-sync
```

```bash
yarn add vision-sync
```

```bash
bun add vision-sync
```

You can also run it directly:

```bash
npx vision-sync init
```

---

## Quick Start

This flow is designed for first-time users. You can copy and paste each command.

### 1. Install

```bash
npm install vision-sync
```

### 2. Initialize

```bash
npx vision-sync init
```

Vision Sync scans your project and creates a safe default `vision.config.ts`.

```text
──────────────────────────────────────
Vision Sync Setup
──────────────────────────────────────
✔ Next.js project detected
✔ App Router detected
✔ TypeScript detected
✔ Safe mode enabled
✔ Rollback snapshots enabled
```

### 3. Connect Your Schema

Use a local file:

```bash
npx vision-sync sync --schema ./openapi.json --preview
```

Or use a URL:

```bash
npx vision-sync sync --schema https://api.example.com/openapi.json --preview
```

Preview mode means no files are written.

### 4. Generate Integrations

After reviewing the preview, apply the safe write transaction:

```bash
npx vision-sync sync --schema ./openapi.json --yes
```

Vision Sync generates isolated files such as:

```text
src/generated/vision/types.ts
src/generated/vision/client.ts
src/generated/vision/hooks.ts
```

### 5. Preview Changes Anytime

```bash
npx vision-sync sync --preview
```

You will see the files that would change, why they would change, and a compact diff preview.

### 6. Roll Back If Needed

```bash
npx vision-sync history
npx vision-sync rollback
```

Rollback restores the latest snapshot created before a write transaction.

---

## CLI Experience

Vision Sync is designed to feel like modern infrastructure tooling.

```text
──────────────────────────────────────
Vision Sync
──────────────────────────────────────

✔ Next.js detected
✔ App Router detected
✔ TypeScript detected
✔ TanStack Query detected
✔ Component-driven architecture detected

? What would you like to generate?
❯ Hooks + Types
  Generated Modules
  Safe Integration Preview

? Enter your OpenAPI URL:
❯ https://api.example.com/openapi.json

✔ Schema validated successfully
✔ 42 endpoints discovered
✔ 18 reusable entities detected
✔ Safe mode enabled
✔ Rollback snapshots enabled

Generating integration preview...
```

Before files are modified, Vision Sync shows the planned changes:

```text
──────────────────────────────────────
Files To Modify
──────────────────────────────────────

✔ src/generated/vision/types.ts
✔ src/generated/vision/client.ts
✔ src/generated/vision/hooks.ts

Snapshot:
vs_20260508_0012

? Apply these changes with rollback protection?
❯ Yes
```

---

## Commands

| Command | Description |
| --- | --- |
| `vision-sync init` | Create a guided `vision.config.ts` with safe defaults |
| `vision-sync sync` | Generate a preview and optionally apply safe writes |
| `vision-sync sync --preview` | Preview generated changes without writing files |
| `vision-sync watch` | Watch a local OpenAPI schema and regenerate safely |
| `vision-sync rollback` | Restore the latest rollback snapshot |
| `vision-sync rollback <snapshot>` | Restore a specific snapshot |
| `vision-sync history` | List rollback snapshots |
| `vision-sync restore <snapshot>` | Alias for restoring a snapshot |

Common flags:

| Flag | Description |
| --- | --- |
| `--schema <url\|file>` | Override the configured OpenAPI source |
| `--config <file>` | Use a custom config path |
| `--preview` | Never write files |
| `--yes` | Apply safe writes without an interactive confirmation |
| `--output <dir>` | Set output directory during init |
| `--level <1\|2\|3\|4>` | Select integration level during init |

---

## Safe Integration System

Vision Sync treats source code as an asset that must be protected.

It never assumes that generated code owns your project. Instead, it separates ownership into explicit boundaries.

### Generated Regions

Generated regions are marked and inspectable:

```ts
// @vision-generated-start
export interface Property {
  readonly id: string;
  readonly title: string;
  readonly price?: number;
}
// @vision-generated-end
```

When AST integration is enabled, Vision Sync targets only approved generated regions:

```ts
// @vision-generated-start property-list
const propertiesQuery = useListProperties({ query: { page: 1 } });
// @vision-generated-end property-list
```

Everything outside those markers is treated as developer-owned.

### Protected Regions

By default, folders such as `app`, `pages`, `components`, `src/app`, `src/pages`, and `src/components` are protected.

Vision Sync will not rewrite your pages, layouts, animation systems, or handcrafted UI.

### Immutable UI

Generated API code is additive. Your UI architecture remains unchanged unless you explicitly opt into AST-assisted previews.

### AST-Safe Transforms

When enabled, AST transforms are:

- powered by `ts-morph`
- permission-gated
- syntax-validated
- conflict-checked
- limited to generated markers
- rejected on unsafe collisions
- passed through the same rollback-first write queue

### Ownership Boundaries

Recommended boundaries:

```text
developer-owned/     # Your product code
generated/           # Vision-owned output
temporary/           # Disposable intermediate files
protected/           # Never edited by tooling
```

Vision Sync works best when generated code lives under:

```text
src/generated/vision
```

---

## Folder Structure

A production Next.js project can use Vision Sync like this:

```text
my-app/
├─ app/
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ sections/
│  └─ ui/
├─ lib/
│  ├─ api/
│  └─ utils/
├─ src/
│  └─ generated/
│     └─ vision/
│        ├─ types.ts
│        ├─ client.ts
│        ├─ hooks.ts
│        └─ modules/
├─ .vision/
│  ├─ cache/
│  └─ snapshots/
├─ openapi.json
├─ vision.config.ts
├─ package.json
└─ tsconfig.json
```

Generated code is isolated. Snapshots and cache data are kept under `.vision`.

---

## Example Generated Output

Generated code should feel like something a senior frontend engineer would write by hand: small, typed, direct, and easy to delete.

### Generated Types

```ts
export interface Property {
  readonly id: string;
  readonly title: string;
  readonly price?: number;
}

export interface ListPropertiesParams {
  readonly query?: {
    readonly page?: number;
  };
}

export type ListPropertiesResponse = ReadonlyArray<Property>;
```

### Generated API Client

```ts
export async function listProperties(
  params: ListPropertiesParams = {},
  options: VisionRequestOptions = {}
): Promise<ListPropertiesResponse> {
  return visionFetch<ListPropertiesResponse>({
    method: "GET",
    path: "/properties",
    query: params.query
  }, options);
}
```

### Generated Hooks

```ts
export const listPropertiesQueryKey = (
  params?: ListPropertiesParams
) => ["listProperties", params] as const;

export function useListProperties(
  params: ListPropertiesParams = {},
  options?: Omit<
    UseQueryOptions<
      ListPropertiesResponse,
      Error,
      ListPropertiesResponse,
      ReturnType<typeof listPropertiesQueryKey>
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: listPropertiesQueryKey(params),
    queryFn: () => listProperties(params),
    ...options
  });
}
```

No global providers. No runtime schema parser. No hidden metadata system.

---

## vision.config.ts

`vision.config.ts` is the control plane for safe generation.

```ts
import { defineConfig } from "vision-sync";

export default defineConfig({
  schema: {
    // Use "url" for remote schemas or "file" for local schemas.
    type: "file",
    path: "./openapi.json"
  },

  output: {
    // Generated code should live in an isolated directory.
    baseDir: "src/generated/vision",
    typesFile: "types.ts",
    clientFile: "client.ts",
    hooksFile: "hooks.ts",
    modulesDir: "modules",
    useSrcDir: true
  },

  safety: {
    // Safe mode is designed for production teams.
    safeMode: true,

    // Readonly mode allows analysis without writes.
    readonlyMode: false,

    // Preview is enabled by default so developers see diffs first.
    previewMode: true,
    dryRunByDefault: true,
    requireConfirmation: true,

    // Rollback snapshots are created before write transactions.
    backups: true,
    rollback: true,
    rollbackRetention: 20,

    // Verify content after writes.
    checksumValidation: true,
    atomicWrites: true,

    // Folders treated as developer-owned by default.
    protectedFolders: [
      "app",
      "pages",
      "components",
      "src/app",
      "src/pages",
      "src/components",
      "developer-owned",
      "protected"
    ],

    ignoredFolders: [
      "node_modules",
      ".next",
      "dist",
      "build",
      ".git"
    ],

    generatedMarkers: {
      start: "@vision-generated-start",
      end: "@vision-generated-end"
    }
  },

  integration: {
    // Level 1 is the safest default.
    level: 1,
    mode: "conservative",

    // AST integration is opt-in.
    astEnabled: false,
    astPreviewOnly: true,

    transformationPermissions: [
      "ensure-import",
      "replace-generated-region"
    ],

    integrationBoundaries: [
      "src/generated",
      "generated"
    ],

    ignoredComponents: [
      "Hero",
      "AnimatedLanding",
      "CinematicLayout"
    ]
  },

  generators: {
    // "auto" emits hooks when TanStack Query is detected.
    queryLibrary: "auto",
    emitHooks: true,
    emitClient: true,
    emitTypes: true,
    emitModules: false,
    customGenerators: [],

    naming: {
      operationIdStrategy: "operationId",
      hookPrefix: "use",
      clientSuffix: "",
      typeSuffix: ""
    }
  },

  formatting: {
    indent: "  ",
    lineEnding: "\n",
    finalNewline: true
  }
});
```

---

## Integration Levels

Vision Sync is intentionally conservative. You choose how far automation is allowed to go.

| Level | Name | Behavior | Safety Profile |
| --- | --- | --- | --- |
| Level 1 | Hooks + Types | Generates TypeScript types, fetch clients, and hooks | Safest default. Generated files only. |
| Level 2 | Generated Modules | Adds isolated modules for endpoint groups | Still additive. No app rewrites. |
| Level 3 | AST-Assisted Safe Injection | Enables AST-assisted integration previews | Opt-in. Permission-gated. Preview-first. |
| Level 4 | Advanced Integration Preview | Plans advanced integrations without forcing writes | Review-only workflow for complex apps. |

### Level 1

Use this when you want typed API access without any UI changes.

```bash
vision-sync init --level 1
```

### Level 2

Use this when you want generated endpoint modules grouped by tags.

```bash
vision-sync init --level 2
```

### Level 3

Use this only when your team wants AST-assisted integration previews.

```bash
vision-sync init --level 3
```

### Level 4

Use this for advanced review workflows where automation should propose changes but not write them.

```bash
vision-sync init --level 4
```

---

## Watch Mode

Watch mode keeps generated integrations aligned with a local schema file.

```bash
vision-sync watch --schema ./openapi.json
```

Example output:

```text
✔ Watching ./openapi.json

API Change Detected
✔ Added endpoint: GET /properties
✔ Schema validated
✔ Regenerated affected files only
✔ No unsafe changes detected
```

Use `--yes` when you want safe writes to apply automatically after validation:

```bash
vision-sync watch --schema ./openapi.json --yes
```

Without `--yes`, watch mode stays preview-oriented.

---

## Rollback System

Vision Sync is rollback-first.

Before a write transaction, it can snapshot every affected file. If a write fails, the snapshot can be restored automatically.

### View History

```bash
vision-sync history
```

```text
vs_20260508_0012  2026-05-08T06:42:10.000Z  sync 348905a...
vs_20260508_0009  2026-05-08T06:31:02.000Z  init config
```

### Restore Latest Snapshot

```bash
vision-sync rollback
```

### Restore A Specific Snapshot

```bash
vision-sync rollback vs_20260508_0012
```

### Restore Alias

```bash
vision-sync restore vs_20260508_0012
```

Rollback protects against:

- partial writes
- interrupted generation
- unsafe output
- failed validation
- accidental generated changes
- schema mismatches

---

## Performance

Vision Sync is designed for large frontend codebases.

### Incremental Generation

Schema digests and operation checksums make it possible to identify what changed between syncs.

### Cache-First Architecture

Generated schema metadata is stored under `.vision/cache`, so future runs can avoid unnecessary work.

### Lazy AST Loading

AST integration is not part of the default path. Source files are parsed only when AST operations are explicitly enabled.

### Worker Threads

The transformation engine is isolated from the CLI and write queue, so large-project AST work can be moved into worker threads without changing generated output semantics.

### Low Memory Usage

The normal Level 1 and Level 2 flows generate static files from a normalized schema model. They do not require loading an entire application into memory.

### Monorepo Support

Project detection checks for workspace markers, package managers, existing API layers, and generated folders so Vision Sync can fit into larger repositories.

---

## Enterprise Safety

Vision Sync is built like infrastructure, not magic.

| Safety Capability | Purpose |
| --- | --- |
| Deterministic transforms | Same inputs produce the same output |
| Compiler validation | Rejects invalid generated or transformed TypeScript |
| Atomic writes | Prevents partially written files |
| Checksum validation | Confirms content integrity after writes |
| Conflict detection | Blocks unsafe imports and ownership violations |
| Generated markers | Makes generated ownership visible |
| Rollback snapshots | Restores files after failed or unwanted changes |
| Protected folders | Keeps developer-owned UI immutable |
| Dry-run previews | Makes every change reviewable |
| No hidden runtime | Keeps production bundles small and predictable |

Vision Sync fails closed. If it cannot prove a transformation is safe, it refuses to write.

---

## Error Experience

Errors should explain what happened, why it matters, and how to fix it.

```text
✖ Unsafe transformation prevented

File:
src/app/home/page.tsx

Reason:
Protected component boundary detected.

Suggested Fix:
Move integration target into a generated region or run in preview mode.

No files were modified.
```

Another example:

```text
✖ Could not safely inject hook into:
src/components/PropertyList.tsx

Reason:
A conflicting variable named "data" already exists.

Suggested Fix:
Rename the existing variable or use alias mode.

Suggested Command:
vision-sync sync --alias-mode --preview
```

No cryptic AST dumps. No unhelpful stack traces for common safety failures. No silent writes.

---

## Why Developers Trust Vision Sync

Developers trust tools that respect their code.

Vision Sync does not try to own your app. It owns a clearly marked generated boundary and leaves everything else alone.

It gives teams the speed of generation without the fear of losing handcrafted work. It gives platform engineers deterministic output, rollback checkpoints, and compiler validation. It gives product engineers small, readable API utilities that feel native to the codebase.

The goal is simple:

> Make frontend API integration as safe and obvious as running a trusted build tool.

---

## Comparison Table

| Approach | Strength | Risk | Developer Control |
| --- | --- | --- | --- |
| Manual integration | Full control | Slow, repetitive, easy to drift from backend contracts | High |
| Unsafe generators | Fast initial output | Can overwrite files, create noisy diffs, and ignore architecture | Low |
| AI scaffolding tools | Flexible suggestions | Non-deterministic, hard to audit, may hallucinate patterns | Variable |
| Vision Sync | Deterministic sync, safe writes, rollback, generated boundaries | Conservative by default | High |

Vision Sync is not trying to replace frontend engineers. It removes repetitive integration work while preserving architectural control.

---

## Documentation Philosophy

Vision Sync documentation is written for trust.

The docs should make every workflow clear:

- what the command does
- what files it can touch
- what remains developer-owned
- what happens before a write
- how to inspect changes
- how to roll back

No hidden magic. No vague automation. No unclear ownership.

Predictable tooling should have predictable documentation.

---

## Contributing

Contributions are welcome.

Good contributions should preserve the core safety model:

- deterministic generation
- strict TypeScript
- no regex-based source transforms
- AST-first edits for code transformations
- rollback-safe writes
- clear error messages
- minimal runtime impact
- no mutation of developer-owned UI by default

Recommended local workflow:

```bash
npm install
npm run typecheck
npm run build
node dist/cli/bin.js sync --schema examples/openapi.json --preview
```

Before opening a pull request, verify that generated output remains readable, stable, and easy to review.

---

## License

MIT
