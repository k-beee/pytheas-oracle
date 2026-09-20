"""
Pytheas Oracle Standalone Unit & Algorithm Verification Test Suite
=============================================================================
Verifies contract algorithms, anti-spoofing guards, parimutuel math,
and HTML sanitization in pure Python environment.
"""

import re
import pytest
from datetime import datetime, timezone
import hashlib


def clean_html_payload(raw_html: str, max_length: int = 6000) -> str:
    if not raw_html:
        return ""
    text = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", raw_html)
    text = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", text)
    text = re.sub(r"(?is)<noscript[^>]*>.*?</noscript>", " ", text)
    text = re.sub(r"(?is)<nav[^>]*>.*?</nav>", " ", text)
    text = re.sub(r"(?is)<header[^>]*>.*?</header>", " ", text)
    text = re.sub(r"(?is)<footer[^>]*>.*?</footer>", " ", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"").replace("&#39;", "'")
    text = re.sub(r"\s+", " ", text).strip()
    return text[:max_length]


def extract_and_verify_domain(url: str, trusted_domains: tuple) -> str:
    url = url.strip()
    assert url.startswith("http://") or url.startswith("https://"), "URL must use http or https scheme"
    rest = url.split("://", 1)[1]
    authority = rest.split("/")[0].split("?")[0].split("#")[0]
    assert "@" not in authority, "Authority spoofing detected: embedded credentials forbidden"
    host = authority.split(":")[0].lower()
    assert len(host) > 0, "Missing host authority"
    is_authorized = any(host == d or host.endswith("." + d) for d in trusted_domains)
    assert is_authorized, f"Domain {host} is not in trusted registry"
    return host


def compute_parimutuel_payout(user_stake: int, total_pool: int, winning_pool: int) -> int:
    assert winning_pool > 0
    return (user_stake * total_pool) // winning_pool


# Tests
def test_html_cleaner_strips_hostile_markup():
    raw = (
        "<html><head><script>stealKeys()</script><style>.body{color:red}</style></head>"
        "<body><header><nav>Menu</nav></header><p>NASA confirms Artemis III crew assignments.</p>"
        "<footer>Copyright 2026</footer></body></html>"
    )
    cleaned = clean_html_payload(raw)
    assert cleaned == "NASA confirms Artemis III crew assignments."


def test_html_cleaner_decodes_entities():
    raw = "SEC &amp; Commodity Futures &quot;Rules&quot; &#39;Final&#39;"
    cleaned = clean_html_payload(raw)
    assert cleaned == "SEC & Commodity Futures \"Rules\" 'Final'"


def test_anti_spoofing_rejects_credential_injection():
    with pytest.raises(AssertionError, match="Authority spoofing detected"):
        extract_and_verify_domain("https://admin:pass@reuters.com/article", ("reuters.com",))


def test_domain_verification_accepts_valid_subdomains():
    host = extract_and_verify_domain("https://world.reuters.com/news/123", ("reuters.com",))
    assert host == "world.reuters.com"


def test_parimutuel_math_precision_and_ratios():
    total_volume = 200_000_000_000_000_000  # 0.2 GEN total
    winning_pool = 150_000_000_000_000_000  # 0.15 GEN winning
    user_stake = 50_000_000_000_000_000     # 0.05 GEN (1/3 of winning pool)
    
    payout = compute_parimutuel_payout(user_stake, total_volume, winning_pool)
    expected = (50 * 200_000_000_000_000_000) // 150
    assert payout == expected
    assert payout == 66_666_666_666_666_666
