# Pytheas Protocol: Security Architecture & Formal Invariants

---

## 1. Solvency & Dust-Sweeping Invariant

Parimutuel winnings are calculated using integer division:
$$\text{Payout} = \left\lfloor \frac{\text{User Stake} \times \text{Total Volume}}{\text{Winning Pool}} \right\rfloor$$

Because integer truncation can leave small remainder balances of several wei, Pytheas implements dynamic remainder dust sweeping:
- During each payout claim, `remaining_payout_pool` is decremented by the exact calculated payout.
- If `unclaimed_winners_count <= 1`, the final winner absorbs whatever balance remains in `remaining_payout_pool`.
- This guarantees:
$$\sum \text{Claims Paid} = \text{Total Collateral}$$
$$\text{Contract Balance} = \sum_{m} \text{Remaining Payout Pool}_m$$

---

## 2. Anti-Spoofing URL Parser

Malicious market creators could attempt to craft deceptive URLs with embedded userinfo:
`https://phishing.com:admin@reuters.com/news`
Or:
`https://reuters.com.attacker.com/`

Pytheas strictly mitigates these attacks in `_extract_domain`:
1. Strips userinfo credentials: `segment.rsplit("@", 1)[1]`
2. Strips port numbers: `segment.split(":", 1)[0]`
3. Normalizes scheme and case.
4. Matches against authoritative domain hierarchies (`host == domain or host.endswith("." + domain)`).

---

## 3. Reentrancy Protection via Checks-Effects-Interactions

Every pull-claim function executes state changes prior to emitting external transfers:
```python
self.has_claimed[claim_key] = True
self.remaining_payout_pool[market_id] = u256(rem_pool - payout_amount)
_Payee(sender_addr).emit_transfer(value=u256(payout_amount))
```
This renders reentrancy attacks completely inert.
