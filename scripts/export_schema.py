#!/usr/bin/env python3
"""
Pytheas Oracle Schema Exporter
=============================================================================
Exports contract method signatures, parameter types, and view schema
for TypeScript frontend bindings.
"""

import json
from pathlib import Path

SCHEMA = {
    "contract": "PytheasOracle",
    "version": "1.0.0",
    "runner": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6",
    "methods": [
        {
            "name": "register_trusted_domain",
            "type": "write",
            "inputs": ["domain: str"],
            "outputs": []
        },
        {
            "name": "deprecate_trusted_domain",
            "type": "write",
            "inputs": ["domain: str"],
            "outputs": []
        },
        {
            "name": "is_trusted_domain",
            "type": "view",
            "inputs": ["domain: str"],
            "outputs": ["bool"]
        },
        {
            "name": "create_market",
            "type": "write",
            "inputs": ["title: str", "criteria: str", "primary_url: str", "secondary_url: str", "deadline: str"],
            "outputs": ["u32"]
        },
        {
            "name": "stake_yes",
            "type": "write_payable",
            "inputs": ["market_id: u32"],
            "outputs": []
        },
        {
            "name": "stake_no",
            "type": "write_payable",
            "inputs": ["market_id: u32"],
            "outputs": []
        },
        {
            "name": "resolve_market",
            "type": "write",
            "inputs": ["market_id: u32"],
            "outputs": ["str"]
        },
        {
            "name": "claim_payout",
            "type": "write",
            "inputs": ["market_id: u32"],
            "outputs": ["u256"]
        },
        {
            "name": "claim_refund",
            "type": "write",
            "inputs": ["market_id: u32"],
            "outputs": ["u256"]
        },
        {
            "name": "claim_stale_market_refund",
            "type": "write",
            "inputs": ["market_id: u32"],
            "outputs": ["u256"]
        },
        {
            "name": "get_market",
            "type": "view",
            "inputs": ["market_id: u32"],
            "outputs": ["dict"]
        },
        {
            "name": "get_market_count",
            "type": "view",
            "inputs": [],
            "outputs": ["u32"]
        },
        {
            "name": "list_market_ids",
            "type": "view",
            "inputs": [],
            "outputs": ["list"]
        },
        {
            "name": "get_stake",
            "type": "view",
            "inputs": ["market_id: u32", "side: str", "staker: str"],
            "outputs": ["u256"]
        },
        {
            "name": "get_claimable_amount",
            "type": "view",
            "inputs": ["market_id: u32", "staker: str"],
            "outputs": ["u256"]
        },
        {
            "name": "get_user_stake",
            "type": "view",
            "inputs": ["market_id: u32", "user_address: str"],
            "outputs": ["dict"]
        },
        {
            "name": "get_protocol_summary",
            "type": "view",
            "inputs": [],
            "outputs": ["dict"]
        },
        {
            "name": "get_authorized_domains",
            "type": "view",
            "inputs": [],
            "outputs": ["list"]
        }
    ]
}

if __name__ == "__main__":
    out_path = Path(__file__).resolve().parent.parent / "artifacts" / "PytheasOracle.schema.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(SCHEMA, f, indent=2)
    print(f"Schema successfully exported to: {out_path}")
