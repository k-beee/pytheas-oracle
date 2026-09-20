# Pytheas Protocol: API Reference & Client Integration

This document specifies the TypeScript interfaces and GenLayer JSON-RPC method bindings for integrating with Pytheas Oracle.

---

## 1. Client Installation

```bash
npm install genlayer-js viem
```

## 2. Client Initialization

```typescript
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export const pytheasClient = createClient({
  chain: studionet,
});
```

## 3. Contract Read Example

```typescript
const marketData = await pytheasClient.readContract({
  address: "0x...",
  functionName: "get_market",
  args: [0],
});
console.log("Adjudication Outcome:", marketData.outcome);
```

## 4. Contract Write Example (Staking)

```typescript
import { parseEther } from "viem";

const txHash = await pytheasClient.writeContract({
  address: "0x...",
  functionName: "stake_yes",
  args: [0],
  value: parseEther("0.5"),
});
```
