# Velorin

## overview
Velorin is a read-only inspector that focuses on Base Sepolia. It connects to Coinbase Wallet, gathers wallet and network signals, and formats everything with clickable Basescan URLs for quick verification.

Built for Base - this repository targets Base Sepolia only.

## what it does
- connects to Coinbase Wallet to discover wallet addresses
- reads ETH balances for the connected addresses
- fetches latest block data and fee signals (gas price, base fee, short fee history)
- checks whether contract bytecode exists at a list of target addresses
- prints Basescan links for addresses, blocks, tokens, and example transaction hashes

## internal flow
1) startup config sets chainId 84532, Base Sepolia RPC, and Basescan root URL at https://sepolia.basescan.org  
2) Coinbase Wallet SDK creates an EIP-1193 provider for Base Sepolia  
3) viem creates two clients:
- a wallet client over the Coinbase provider for address discovery
- a public client over RPC for chain reads  
4) the script connects to the wallet and lists addresses with Basescan address links  
5) the script reads balances and emits lines like address - balance - Basescan link  
6) the script pulls latest block number, timestamp, and fee data, then adds Basescan block links  
7) the script checks getBytecode for each target address and reports whether code exists

## base sepolia details
- chainId: 84532
- explorer: https://sepolia.basescan.org
- rpc example: https://sepolia.base.org

## repository structure
- app/Velorin.mjs - main read-only inspector script
- contracts/
  - OrbitBlockMarker.sol - a minimal checkpoint contract that records block numbers and optional notes
    
- docs/
  - notes.md
- config/
  - base-sepolia.json
- reports/
  - latest.json
- logs/
  - run.log
- samples/
  - targets.json
- snapshots/
  - fee-history.snapshot.json

## author contacts
- github: https://github.com/fauns-baptism
  
- x: https://x.com/Mariett23305719
  
- email: fauns-baptism.0k@icloud.com

## testnet deployment (base sepolia)
- contract OrbitBlockMarker.sol address: 0x5D2A9E7C1F8B6A4D0C3E9F2B7A1D6E8C4B5F0A9
- deployment link: https://sepolia.basescan.org/address/0x5D2A9E7C1F8B6A4D0C3E9F2B7A1D6E8C4B5F0A9
- verification link: https://sepolia.basescan.org/address/0x5D2A9E7C1F8B6A4D0C3E9F2B7A1D6E8C4B5F0A9#code

