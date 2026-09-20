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


# ---------------------------------------------------------------------------
# Storage Schemas (Strictly GenLayer Decorated)
# ---------------------------------------------------------------------------

@allow_storage
@dataclass
class OracleMarket:
    """
    Persistent on-chain state representation of a Pytheas prediction market.
    Decorated with @allow_storage for safe GenVM serialization and indexing.
    """
    creator: Address
    title: str
    criteria: str
    primary_url: str
    secondary_url: str
    deadline: str
    status: str

    outcome: str
    rationale: str
    proof_hash: str
    proof_sample: str
    resolution_attempts: u32

    yes_pool: u256
    no_pool: u256
    yes_stakers_count: u32
    no_stakers_count: u32
    unclaimed_winners_count: u32

    created_at: str
    resolved_at: str


# ---------------------------------------------------------------------------
# Utility & Safety Functions
# ---------------------------------------------------------------------------

def _normalize_address(val) -> Address:
    """Ensures input address is a valid GenLayer Address type."""
    return val if isinstance(val, Address) else Address(val)


def _get_execution_timestamp_iso() -> str:
    """Reads the consensus-verified transaction timestamp from message metadata."""
    raw = getattr(gl, "message_raw", None)
    if isinstance(raw, dict) and "datetime" in raw:
        return raw["datetime"]
    nested = getattr(getattr(gl, "message", None), "raw", None)
    if isinstance(nested, dict) and "datetime" in nested:
        return nested["datetime"]
    msg_dt = getattr(getattr(gl, "message", None), "datetime", None)
    if msg_dt is not None:
        return str(msg_dt)
    return datetime.now(timezone.utc).isoformat()


def _parse_iso_string(iso_str: str) -> datetime:
    """Safely parses ISO-8601 UTC timestamp strings."""
    return datetime.fromisoformat(iso_str.replace("Z", "+00:00"))


def _seconds_elapsed(start_iso: str, end_iso: str) -> float:
    """Calculates duration in seconds between two ISO-8601 timestamps."""
    try:
        return (_parse_iso_string(end_iso) - _parse_iso_string(start_iso)).total_seconds()
    except Exception:
        return -1.0


def _is_valid_web_url(url_str: str) -> bool:
    """Validates that URL string uses standard http or https scheme."""
    return url_str.startswith("http://") or url_str.startswith("https://")


def _extract_domain(url_str: str) -> str:
    """
    Extracts the normalized host domain from an http(s) URL.
    Safely strips userinfo credentials (e.g. user:pass@host) to mitigate authority spoofing attacks.
    """
    if url_str.startswith("https://"):
        segment = url_str[len("https://") :]
    elif url_str.startswith("http://"):
        segment = url_str[len("http://") :]
    else:
        return ""

    for delimiter in ("/", "?", "#"):
        pos = segment.find(delimiter)
        if pos != -1:
            segment = segment[:pos]

    # Defense against userinfo authority spoofing: e.g. https://attacker:secret@bbc.com/
    if "@" in segment:
        segment = segment.rsplit("@", 1)[1]
    if ":" in segment:
        segment = segment.split(":", 1)[0]

    return segment.strip().lower()
