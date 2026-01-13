# Velorin - Notes

Velorin is a lightweight Base Sepolia monitoring toolkit focused on *reading* chain data (no transaction sending).

## Purpose
- Track Base Sepolia fee conditions (base fee / priority fee estimates)
- Keep a simple audit trail of runs (logs + latest report)
- Provide sample targets for read-only checks (addresses, contracts, topics)

## Guardrails
- Built for Base (Base Sepolia only)
- chainId: 84532
- Explorer: https://sepolia.basescan.org
- Read-only workflows only (do not send transactions)

## File map
- config/base-sepolia.json
  - Network configuration (RPC + explorer + fee sampling settings)
- samples/targets.json
  - Example addresses/contracts to watch
- snapshots/fee-history.snapshot.json
  - Stored fee samples for baselining / comparisons
- reports/latest.json
  - Output of the most recent run (summary + stats)
- logs/run.log
  - Human-readable run log

## Suggested workflow
1. Update `config/base-sepolia.json` with your RPC endpoint(s).
2. Adjust `samples/targets.json` to the contracts/addresses you care about.
3. Run your monitoring script (read-only).
4. Write results to `reports/latest.json` and append details to `logs/run.log`.
5. Periodically refresh `snapshots/fee-history.snapshot.json` to keep comparisons meaningful.

## Conventions
- Timestamps are ISO 8601 (UTC recommended).
- All JSON files must be valid JSON (no trailing commas).
- Keep logs short and append-only.
