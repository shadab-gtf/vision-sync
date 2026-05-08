export function printHelp(): void {
  console.log(`vision-sync

Commands:
  vision-sync init                 Create a safe default vision.config.ts
  vision-sync sync                 Preview and apply deterministic generated code
  vision-sync watch                Watch a local OpenAPI schema
  vision-sync history              List rollback snapshots
  vision-sync rollback [snapshot]  Restore a snapshot

Common flags:
  --schema <url|file>              Override schema source
  --config <file>                  Use a custom config path
  --preview                        Preview only, never write files
  --yes                            Accept safe writes after preview
  --output <dir>                   Set generated output directory during init
  --level <1|2|3|4>                Select integration level during init
`);
}
