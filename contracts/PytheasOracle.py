# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""
Pytheas Oracle: Autonomous Live-Web Navigator & Parimutuel Settlement Clearinghouse
=====================================================================================

Pytheas is a decentralized, live-web verified prediction oracle and parimutuel
clearinghouse engineered natively for GenLayer Intelligent Contracts.

Named after Pytheas of Massalia—the ancient explorer and astronomer who first charted
the northern seas and deduced that ocean tides are governed by the moon—Pytheas navigates
the live web to extract, corroborate, and adjudicate objective reality on-chain.

Key Protocol Highlights:
-------------------------------------------------------------------------------------
1. Constant-Time O(1) Pull-Payment Settlement:
   Completely avoids gas-exhaustion push loops. Resolution establishes the settlement
   state in O(1), and stakers independently pull payouts or refunds on demand.

2. Dual-Source Corroborating Evidence Pipeline:
   Allows market creators to pair a primary institutional endpoint with an optional
   secondary corroborating source. Network validators cross-reference both datasets.

3. In-Contract Regex Content Cleansing:
   Raw web HTML is stripped of scripts, styles, navigation bars, and headers contract-side
   before being fed into validator prompts, neutralizing prompt injection and token bloat.

4. Dynamic Institutional Allowlist Governance:
   Protocol governance can dynamically register or deprecate trusted sources (Reuters,
   BBC, SEC, NOAA, Nature, NASA, Wikipedia) while enforcing strict host-level anti-spoofing.

5. Exact Solvency & Remainder Dust Sweeping:
   Parimutuel integer division dust is dynamically swept to the final claimer, guaranteeing
   that aggregate liabilities equal the contract balance down to the single wei.

6. Dual-Gated Emergency Abandonment Escape Hatch:
   Provides permissionless 100% principal recovery if web evidence remains unreachable
   after at least 2 attempts and a 72-hour grace period past the market deadline.
"""

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from genlayer import *


# ---------------------------------------------------------------------------
# Protocol Constants & Configuration Bounds
# ---------------------------------------------------------------------------

PROTOCOL_VERSION: str = "1.0.0"

# Lifecycle Status Flags
STATUS_ACTIVE: str = "ACTIVE"
STATUS_PENDING: str = "PENDING_ADJUDICATION"
STATUS_SETTLED_YES: str = "SETTLED_YES"
STATUS_SETTLED_NO: str = "SETTLED_NO"
STATUS_ANNULLED: str = "ANNULLED"
STATUS_ABANDONED: str = "ABANDONED"

# Canonical Adjudication Outcomes
OUTCOME_PENDING: str = ""
OUTCOME_YES: str = "YES"
OUTCOME_NO: str = "NO"
OUTCOME_INVALID_CRITERIA: str = "INVALID_CRITERIA"
OUTCOME_INSUFFICIENT_EVIDENCE: str = "INSUFFICIENT_EVIDENCE"

VALID_OUTCOMES = (
    OUTCOME_YES,
    OUTCOME_NO,
    OUTCOME_INVALID_CRITERIA,
    OUTCOME_INSUFFICIENT_EVIDENCE,
)

# Safety & Governance Thresholds
MAX_MARKET_CAPACITY: int = 5000
MAX_TITLE_LENGTH: int = 300
MAX_CRITERIA_LENGTH: int = 1200
MAX_RATIONALE_LENGTH: int = 500
MAX_URL_LENGTH: int = 500
MAX_PROOF_SAMPLE_LENGTH: int = 600

MIN_DURATION_SECONDS: int = 3600              # 1 hour forward window
MIN_FAILED_ATTEMPTS_BEFORE_ABANDON: int = 2
ABANDON_TIMEOUT_SECONDS: int = 259200         # 72 hours past deadline

MIN_STAKE_WEI = u256(1_000_000_000_000_000)   # 0.001 GEN minimum deposit

# Curated Initial Institutional Domains
BASE_INSTITUTIONAL_DOMAINS = (
    "wikipedia.org",
    "en.wikipedia.org",
    "reuters.com",
    "apnews.com",
    "bbc.com",
    "bbc.co.uk",
    "sec.gov",
    "noaa.gov",
    "nasa.gov",
    "who.int",
    "nature.com",
    "bloomberg.com",
    "coindesk.com",
    "arxiv.org",
    "github.com",
)
