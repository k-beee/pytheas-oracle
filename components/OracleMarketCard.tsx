"use client";

import React from "react";
import { ExternalLink, Clock, TrendingUp, ShieldAlert, Cpu, Sparkles, Award } from "lucide-react";
import { OracleMarketData, MARKET_STATUS_MAP } from "../src/types";
import { formatGen, formatTimeRemaining } from "../src/utils";

interface OracleMarketCardProps {
  market: OracleMarketData;
  userClaimable: string;
  isResolving: boolean;
  onOpenStake: (market: OracleMarketData, side: "YES" | "NO") => void;
  onOpenTelemetry: (market: OracleMarketData) => void;
  onResolve: (marketId: number) => void;
  onClaim: (marketId: number) => void;
}

export const OracleMarketCard: React.FC<OracleMarketCardProps> = ({
  market,
  userClaimable,
  isResolving,
  onOpenStake,
  onOpenTelemetry,
  onResolve,
  onClaim,
}) => {
  const statusInfo = MARKET_STATUS_MAP[market.status] || MARKET_STATUS_MAP[0];
  const timeRemaining = formatTimeRemaining(market.deadline_iso);
  const hasClaimable = userClaimable && BigInt(userClaimable) > 0n;

  // Safe domain extract
  let primaryHost = "authoritative source";
  try {
    primaryHost = new URL(market.primary_url).hostname;
  } catch {}

  let secondaryHost = "";
  if (market.secondary_url) {
    try {
      secondaryHost = new URL(market.secondary_url).hostname;
    } catch {}
  }

  const isDeadlinePassed = new Date(market.deadline_iso).getTime() <= Date.now();
  const canResolve = market.status === 0 && isDeadlinePassed;

  return (
    <div className="polar-card relative flex flex-col justify-between rounded-2xl p-5 transition-all duration-300">
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-mono font-medium ${statusInfo.badge}`}>
            {statusInfo.label}
          </span>

          <div className="flex items-center space-x-2">
            <a
              href={market.primary_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs font-mono text-polar-300/80 hover:text-polar-200 transition-colors"
              title="Verified Primary Source"
            >
              <span>{primaryHost}</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            {secondaryHost && (
              <>
                <span className="text-slate-600">•</span>
                <a
                  href={market.secondary_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs font-mono text-cobalt-300/80 hover:text-cobalt-200 transition-colors"
                  title="Corroborating Secondary Source"
                >
                  <span>{secondaryHost}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white line-clamp-2 hover:text-polar-300 transition-colors">
          {market.title}
        </h3>

        {/* Resolution Criteria */}
        <p className="mt-2 text-xs text-slate-400 line-clamp-2 font-mono bg-midnight-900/80 rounded-lg p-2 border border-slate-800/80">
          {market.criteria}
        </p>

        {/* Odds Meter */}
        <div className="mt-4">
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-polar-400 font-semibold">YES {market.yes_percent}% ({formatGen(market.total_yes_stake)} GEN)</span>
            <span className="text-rose-400 font-semibold">{market.no_percent}% NO ({formatGen(market.total_no_stake)} GEN)</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-midnight-950 border border-slate-800 flex">
            <div
              className="h-full bg-gradient-to-r from-polar-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${market.yes_percent}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
              style={{ width: `${market.no_percent}%` }}
            />
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center space-x-1">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{timeRemaining}</span>
          </div>

          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
            <span>Pool: {formatGen(market.total_pool_volume)} GEN</span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
        {hasClaimable && (
          <button
            onClick={() => onClaim(market.market_id)}
            className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-all"
          >
            <Award className="h-4 w-4 text-emerald-400" />
            <span>Claim Entitlement ({formatGen(userClaimable)} GEN)</span>
          </button>
        )}

        {market.status === 0 && !isDeadlinePassed && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOpenStake(market, "YES")}
              className="rounded-lg bg-polar-500/10 border border-polar-500/30 py-2 text-xs font-bold text-polar-300 hover:bg-polar-500/20 hover:border-polar-400 transition-all"
            >
              Stake YES
            </button>
            <button
              onClick={() => onOpenStake(market, "NO")}
              className="rounded-lg bg-rose-500/10 border border-rose-500/30 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:border-rose-400 transition-all"
            >
              Stake NO
            </button>
          </div>
        )}

        {canResolve && (
          <button
            onClick={() => onResolve(market.market_id)}
            disabled={isResolving}
            className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 py-2 text-xs font-bold text-white shadow-lg shadow-amber-500/20 hover:brightness-110 disabled:opacity-50 transition-all"
          >
            <Cpu className={`h-3.5 w-3.5 ${isResolving ? "animate-spin" : ""}`} />
            <span>{isResolving ? "Deliberating Consensus..." : "Resolve Market"}</span>
          </button>
        )}

        <button
          onClick={() => onOpenTelemetry(market)}
          className="w-full text-center py-1.5 text-[11px] font-mono text-slate-400 hover:text-polar-300 transition-colors"
        >
          View Evidence & Validator Deliberation →
        </button>
      </div>
    </div>
  );
};
