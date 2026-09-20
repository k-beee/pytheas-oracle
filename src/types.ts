export type MarketStatus = 0 | 1 | 2 | 3 | 4 | 5;

export const MARKET_STATUS_MAP: Record<MarketStatus, { label: string; color: string; badge: string }> = {
  0: { label: "ACTIVE", color: "text-polar-400", badge: "bg-polar-500/10 border-polar-500/30 text-polar-300" },
  1: { label: "CONSENSUS DELIBERATING", color: "text-amber-400", badge: "bg-amber-500/10 border-amber-500/30 text-amber-300" },
  2: { label: "SETTLED: YES", color: "text-emerald-400", badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" },
  3: { label: "SETTLED: NO", color: "text-rose-400", badge: "bg-rose-500/10 border-rose-500/30 text-rose-300" },
  4: { label: "ANNULLED (REFUND)", color: "text-indigo-400", badge: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300" },
  5: { label: "ABANDONED (TIMEOUT)", color: "text-slate-400", badge: "bg-slate-500/10 border-slate-500/30 text-slate-300" },
};

export interface OracleMarketData {
  market_id: number;
  creator: string;
  title: string;
  criteria: string;
  primary_url: string;
  secondary_url: string;
  deadline: string;
  deadline_iso: string;
  deadline_timestamp: number;
  status: MarketStatus;
  status_str: string;
  outcome: string;
  consensus_outcome: string;
  rationale: string;
  consensus_rationale: string;
  proof_hash: string;
  evidence_proof_hash: string;
  proof_sample: string;
  evidence_proof_sample: string;
  resolution_attempts: number;
  yes_pool: string;
  no_pool: string;
  total_volume: string;
  total_yes_stake: string;
  total_no_stake: string;
  total_pool_volume: string;
  total_claims_paid: string;
  remaining_pool: string;
  remaining_payout_pool: string;
  unclaimed_winners_count: number;
  yes_stakers_count: number;
  no_stakers_count: number;
  yes_percent: number;
  no_percent: number;
  created_at: string;
  created_at_iso: string;
  resolved_at: string;
  resolved_at_iso: string;
}

export interface UserStakeData {
  yes_stake: string;
  no_stake: string;
  claimed: boolean;
  claimable_amount: string;
}

export interface ProtocolSummaryData {
  version: string;
  governor: string;
  total_markets: number;
}
