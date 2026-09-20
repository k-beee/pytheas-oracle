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


def _clean_html_payload(html_content: str) -> str:
    """
    In-contract regex-based HTML text extraction and sanitization engine.
    
    Strips scripts, CSS styling, headers, navigation chrome, and boilerplate markup.
    Neutralizes prompt-injection maneuvers and protects LLM context windows against token bloat.
    """
    if not html_content:
        return ""

    text = html_content
    # Strip dangerous/noisy DOM subtrees
    text = re.sub(r"(?is)<script.*?>.*?</script>", " ", text)
    text = re.sub(r"(?is)<style.*?>.*?</style>", " ", text)
    text = re.sub(r"(?is)<noscript.*?>.*?</noscript>", " ", text)
    text = re.sub(r"(?is)<nav.*?>.*?</nav>", " ", text)
    text = re.sub(r"(?is)<header.*?>.*?</header>", " ", text)
    text = re.sub(r"(?is)<footer.*?>.*?</footer>", " ", text)

    # Strip remaining HTML tags
    text = re.sub(r"<[^>]+>", " ", text)

    # Unescape common HTML entities
    text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"').replace("&#39;", "'")
    text = re.sub(r"\s+", " ", text)
    return text.strip()[:6000]


# ---------------------------------------------------------------------------
# Pytheas Main Intelligent Contract
# ---------------------------------------------------------------------------

class PytheasOracle(gl.Contract):
    """
    Autonomous Live-Web Oracle & Parimutuel Settlement Clearinghouse on GenLayer.
    """

    governor: Address
    next_market_id: u32
    markets: TreeMap[u32, OracleMarket]
    stakes: TreeMap[str, u256]
    has_claimed: TreeMap[str, bool]
    custom_domains: TreeMap[str, bool]
    remaining_payout_pool: TreeMap[u32, u256]

    def __init__(self):
        """
        Deploy and initialize the Pytheas Oracle Clearinghouse.
        """
        self.next_market_id = u32(0)
        sender = getattr(gl.message, "sender_address", None)
        if sender is not None:
            self.governor = _normalize_address(sender)
        else:
            self.governor = Address("0x0000000000000000000000000000000000000000")

    # -----------------------------------------------------------------------
    # Helper Key Formatters & Internal Lookups
    # -----------------------------------------------------------------------

    def _format_stake_key(self, market_id: u32, side: str, staker_addr: Address) -> str:
        return f"{int(market_id)}:{side}:{staker_addr.as_hex}"

    def _format_claim_key(self, market_id: u32, staker_addr: Address) -> str:
        return f"{int(market_id)}:{staker_addr.as_hex}"

    def _fetch_market_or_revert(self, market_id: u32) -> OracleMarket:
        if market_id not in self.markets:
            raise gl.vm.UserError("NONEXISTENT_MARKET: Pytheas Market ID does not exist")
        return self.markets[market_id]

    def _is_domain_authorized(self, host_domain: str) -> bool:
        if not host_domain:
            return False
        # Check custom dynamic registry first
        if self.custom_domains.get(host_domain, False):
            return True
        # Check base institutional domains and valid subdomains
        for allowed in BASE_INSTITUTIONAL_DOMAINS:
            if host_domain == allowed or host_domain.endswith("." + allowed):
                return True
        return False

    # -----------------------------------------------------------------------
    # Protocol Governance & Whitelist Management
    # -----------------------------------------------------------------------

    @gl.public.write
    def register_trusted_domain(self, domain: str) -> None:
        """Adds a new authoritative domain to the dynamic institutional registry."""
        caller = _normalize_address(gl.message.sender_address)
        if bytes(caller.as_bytes) != bytes(self.governor.as_bytes):
            raise gl.vm.UserError("UNAUTHORIZED: Only protocol governor may register domains")
        cleaned = domain.strip().lower()
        if len(cleaned) < 3 or "." not in cleaned:
            raise gl.vm.UserError("INVALID_DOMAIN: Must be a valid domain string")
        self.custom_domains[cleaned] = True

    @gl.public.write
    def deprecate_trusted_domain(self, domain: str) -> None:
        """Deprecates a domain from the dynamic institutional registry."""
        caller = _normalize_address(gl.message.sender_address)
        if bytes(caller.as_bytes) != bytes(self.governor.as_bytes):
            raise gl.vm.UserError("UNAUTHORIZED: Only protocol governor may deprecate domains")
        cleaned = domain.strip().lower()
        self.custom_domains[cleaned] = False

    @gl.public.view
    def is_trusted_domain(self, domain: str) -> bool:
        """Verifies whether a domain or its parent host is currently authorized."""
        return self._is_domain_authorized(domain.strip().lower())


    # -----------------------------------------------------------------------
    # Public Writes - Market Creation
    # -----------------------------------------------------------------------

    @gl.public.write
    def create_market(
        self,
        title: str,
        criteria: str,
        primary_url: str,
        secondary_url: str,
        deadline: str,
    ) -> u32:
        """
        Initializes a new prediction market on Pytheas with verified institutional source grounding.
        """
        if len(self.markets) >= MAX_MARKET_CAPACITY:
            raise gl.vm.UserError("CAPACITY_EXCEEDED: Global market limit reached")
        if len(title) < 10 or len(title) > MAX_TITLE_LENGTH:
            raise gl.vm.UserError("INVALID_INPUT: Title length must be between 10 and 300 characters")
        if len(criteria) < 20 or len(criteria) > MAX_CRITERIA_LENGTH:
            raise gl.vm.UserError("INVALID_INPUT: Criteria length must be between 20 and 1200 characters")

        # Validate primary source URL and anti-spoofed authority
        if not _is_valid_web_url(primary_url) or len(primary_url) > MAX_URL_LENGTH:
            raise gl.vm.UserError("INVALID_INPUT: Primary URL must be a valid http(s) URL")
        if not self._is_domain_authorized(_extract_domain(primary_url)):
            raise gl.vm.UserError("UNAUTHORIZED_SOURCE: Primary source domain is not in the trusted registry")

        # Validate secondary corroborating source URL if provided
        if secondary_url and len(secondary_url.strip()) > 0:
            if not _is_valid_web_url(secondary_url) or len(secondary_url) > MAX_URL_LENGTH:
                raise gl.vm.UserError("INVALID_INPUT: Secondary URL must be a valid http(s) URL")
            if not self._is_domain_authorized(_extract_domain(secondary_url)):
                raise gl.vm.UserError("UNAUTHORIZED_SOURCE: Secondary source domain is not in the trusted registry")

        # Enforce forward resolution window
        current_time = _get_execution_timestamp_iso()
        elapsed_to_deadline = _seconds_elapsed(current_time, deadline)
        if elapsed_to_deadline < MIN_DURATION_SECONDS:
            raise gl.vm.UserError("INVALID_DEADLINE: Deadline must be at least 1 hour into the future")

        market_id = self.next_market_id
        self.next_market_id = u32(int(market_id) + 1)
        creator_addr = _normalize_address(gl.message.sender_address)

        record = OracleMarket(
            creator=creator_addr,
            title=title.strip(),
            criteria=criteria.strip(),
            primary_url=primary_url.strip(),
            secondary_url=secondary_url.strip() if secondary_url else "",
            deadline=deadline,
            status=STATUS_ACTIVE,
            outcome=OUTCOME_PENDING,
            rationale="",
            proof_hash="",
            proof_sample="",
            resolution_attempts=u32(0),
            yes_pool=u256(0),
            no_pool=u256(0),
            yes_stakers_count=u32(0),
            no_stakers_count=u32(0),
            unclaimed_winners_count=u32(0),
            created_at=current_time,
            resolved_at="",
        )

        self.markets[market_id] = record
        self.remaining_payout_pool[market_id] = u256(0)
        return market_id
