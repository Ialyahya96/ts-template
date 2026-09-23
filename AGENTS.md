# AGENTS.md

Repository guidance for coding agents.

## Code locality

Keep cohesive responsibilities together; do not split into one file per function.

- Source and TSX files: review above 500 lines; 1,000 is the lint ceiling.
- Tests: review above 800 lines; 1,500 is the lint ceiling.
- Functions: 120 lines maximum (200 in TSX), lint-enforced; tests are exempt.
- Cognitive complexity is capped at 15.
- Generated files and data-only tables are exempt only by exact path with an identified owner; do not exempt loaders, validators, or fixtures.
- Never raise a recorded legacy ceiling without approval.

The ceilings are enforced by ESLint; the review thresholds are not separately linted.

## Reading code

Before reading an unfamiliar file whole, check its line and byte counts with `bun run size:report`. Above 500 lines or 20 KB, locate symbols first and read focused 100-200-line ranges instead.

- Treat truncated output as incomplete; retry with a narrower range.
- Inspect imports, callers, and tests before editing, and refresh locations after edits.
- Do not page mechanically through a whole file.
- Edit generators or generated sources, never generated output.
