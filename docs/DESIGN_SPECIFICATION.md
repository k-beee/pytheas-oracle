# Pytheas Protocol: Architectural Specification & Navigation Model

> *"Like Pytheas navigating beyond the Pillars of Hercules into uncharted northern oceans, the Pytheas Protocol navigates the vast, untrusted live web to establish cryptographic and semantic certainty for decentralized prediction clearinghouses."*

---

## 1. Executive Mission & System Purpose

**Pytheas** is a high-integrity, live-web verified prediction oracle and parimutuel settlement clearinghouse built natively on GenLayer Intelligent Contracts. 

Traditional decentralized prediction markets (e.g. Augur, Polymarket, UMA) face fundamental trade-offs:
- **Centralized Oracle Relays:** Prone to operator downtime, API censorship, or front-running.
- **Optimistic Dispute Delays:** Multi-day dispute periods stall capital liquidity and expose users to whale voting cartels.
- **Synchronous Push-Payment Gas Reverts:** Traditional EVM contracts that iterate over stakers in an unbounded loop during resolution revert due to block gas limits, permanently stranding collateral.
- **Rigid Allowlist Monocultures:** Static oracles fail when institutional domains redesign, rotate URLs, or deprecate endpoints.

Pytheas resolves these structural vulnerabilities through four interlocking pillars:
1. **Autonomous Network-Validator Ingestion:** Validators directly fetch source HTML via `gl.nondet.web.get` without intermediary off-chain relayers.
2. **$O(1)$ Constant-Time Pull-Payment Architecture:** Resolution transitions state in a single transaction; winners and refundees claim pro-rata distributions on-demand.
3. **In-Contract Regex Content Cleansing:** Contract-side stripping of scripts, CSS, and DOM boilerplate defends validator LLM context windows against prompt-injection and token exhaustion.
4. **Dynamic On-Chain Domain Governance:** Protocol governance permissions institutional sources while validating URI host structures against credential-spoofing attacks.

---

## 2. Core Protocol Invariants

### Invariant 1: Conservation of Collateral (Strict Solvency)
For any market $m \in \mathcal{M}$:
$$\text{Total Escrow}_m = \text{Pool}_{\text{YES}, m} + \text{Pool}_{\text{NO}, m}$$
At all points after resolution:
$$\text{Remaining Payout Pool}_m = \text{Total Escrow}_m - \sum \text{Claims Paid}_m$$
When the final winning staker executes `claim_payout()`, all remaining division dust is swept into their payout:
$$\text{Final Payout} = \text{Remaining Payout Pool}_m$$
This guarantees that the contract's native GEN balance exactly matches total unclaimed liabilities down to 1 wei:
$$\text{Contract Balance} \equiv \sum_{m \in \mathcal{M}} \text{Remaining Payout Pool}_m$$

### Invariant 2: Checks-Effects-Interactions & Reentrancy Neutrality
All state transitions (`has_claimed = True`, `remaining_pool` decrement, `unclaimed_winners_count` decrement) occur strictly **before** external EVM proxy transfers are emitted via `_Payee(sender).emit_transfer(value)`.

### Invariant 3: $O(1)$ Computational Boundedness
No contract method contains unbounded loops over users, stakers, or addresses. Staking, adjudication, and claiming execute in deterministic $O(1)$ gas complexity.

---

## 3. Four-Tier Outcome Taxonomy

| Outcome Band | Consensus Trigger | Settlement Action |
| :--- | :--- | :--- |
| **`YES`** | Validators agree evidence decisively proves criteria occurred. | YES pool splits total collateral pro-rata. NO pool forfeited. |
| **`NO`** | Validators agree evidence decisively proves criteria did NOT occur. | NO pool splits total collateral pro-rata. YES pool forfeited. |
| **`INVALID_CRITERIA`** | Criteria were contradictory, subjective, or impossible to verify. | Market is annulled. 100% symmetric refund to all stakers. |
| **`INSUFFICIENT_EVIDENCE`** | Web page unreachable, event ongoing, or inconclusive proof. | Market remains pending. Escrow locked safely. Retries permitted. |

---

## 4. Dual-Gated Emergency Escape Hatch

If web sources become permanently offline or behind Cloudflare bot walls:
- Condition A: At least two distinct resolution attempts have been executed ($\ge 2$).
- Condition B: At least 72 hours (259,200 seconds) have elapsed past the resolution deadline.
- Result: Any participant can permissionlessly transition the market to `ABANDONED` and recover 100% of their deposited stake via `claim_stale_market_refund()`.
