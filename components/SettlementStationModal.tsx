"use client";

import React from "react";
import { X, Award, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { OracleMarketData } from "../src/types";
import { formatGen } from "../src/utils";

interface SettlementStationModalProps {
  isOpen: boolean;
  markets: OracleMarketData[];
  userStakes: Record<number, { claimable_amount: string; claimed: boolean }>;
  onClose: () => void;
  onClaim: (marketId: number, type: "PAYOUT" | "REFUND" | "ABANDON") => Promise<void>;
}

export const SettlementStationModal: React.FC<SettlementStationModalProps> = ({
  isOpen,
  markets,
  userStakes,
  onClose,
  onClaim,
}) => {
  if (!isOpen) return null;

  // Filter markets with claimable balances
  const claimableMarkets = markets.filter((m) => {
    const s = userStakes[m.market_id];
    return s && BigInt(s.claimable_amount || "0") > 0n && !s.claimed;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-950/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-polar-500/30 bg-midnight-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-polar-400" />
            <h2 className="text-base font-bold text-white">Settlement Claim Station</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          {claimableMarkets.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-midnight-950 p-6 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
              <p className="text-sm font-medium text-slate-300">All Settlements Claimed</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                No outstanding winnings or refunds pending for your connected account.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {claimableMarkets.map((m) => {
                const s = userStakes[m.market_id];
                const claimType = m.status === 4 ? "REFUND" : m.status === 5 ? "ABANDON" : "PAYOUT";
                return (
                  <div
                    key={m.market_id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-midnight-950 p-3.5"
                  >
                    <div className="pr-3">
                      <span className="text-[10px] font-mono text-polar-400 uppercase">
                        {claimType === "REFUND" ? "Refund Claim" : claimType === "ABANDON" ? "Timeout Escape" : "Winning Payout"}
                      </span>
                      <h4 className="text-xs font-semibold text-white line-clamp-1">{m.title}</h4>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {formatGen(s.claimable_amount)} GEN
                      </span>
                    </div>

                    <button
                      onClick={() => onClaim(m.market_id, claimType)}
                      className="shrink-0 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition-all"
                    >
                      Pull Claim
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
