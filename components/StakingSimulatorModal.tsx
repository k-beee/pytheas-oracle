"use client";

import React, { useState } from "react";
import { X, TrendingUp, Calculator, ShieldCheck, AlertCircle } from "lucide-react";
import { OracleMarketData } from "../src/types";
import { formatGen } from "../src/utils";

interface StakingSimulatorModalProps {
  isOpen: boolean;
  market: OracleMarketData | null;
  initialSide: "YES" | "NO";
  onClose: () => void;
  onStake: (marketId: number, side: "YES" | "NO", amountGen: string) => Promise<void>;
}

export const StakingSimulatorModal: React.FC<StakingSimulatorModalProps> = ({
  isOpen,
  market,
  initialSide,
  onClose,
  onStake,
}) => {
  const [side, setSide] = useState<"YES" | "NO">(initialSide);
  const [amount, setAmount] = useState("0.1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !market) return null;

  // Real-time Parimutuel Payout Simulator
  const numAmount = parseFloat(amount) || 0;
  const currentYes = Number(BigInt(market.total_yes_stake || "0")) / 1e18;
  const currentNo = Number(BigInt(market.total_no_stake || "0")) / 1e18;
  const currentTotal = currentYes + currentNo;

  let projectedPayout = 0;
  let multiplier = 1.0;

  if (numAmount > 0) {
    const newTotal = currentTotal + numAmount;
    const winningPool = side === "YES" ? currentYes + numAmount : currentNo + numAmount;
    if (winningPool > 0) {
      projectedPayout = (numAmount * newTotal) / winningPool;
      multiplier = projectedPayout / numAmount;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numAmount < 0.001) {
      setError("Minimum stake is 0.001 GEN collateral.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onStake(market.market_id, side, amount);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Staking transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-950/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-polar-500/30 bg-midnight-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-polar-400" />
            <h2 className="text-base font-bold text-white">Deposit Parimutuel Stake</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Market Snippet */}
        <div className="mt-4 rounded-xl bg-midnight-950 p-3 border border-slate-800/80">
          <h4 className="text-xs font-semibold text-slate-200 line-clamp-2">{market.title}</h4>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Side Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide("YES")}
              className={`rounded-xl py-2.5 text-xs font-bold transition-all ${
                side === "YES"
                  ? "bg-polar-500 text-midnight-950 shadow-lg shadow-polar-500/30"
                  : "bg-midnight-950 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              YES ({market.yes_percent}%)
            </button>
            <button
              type="button"
              onClick={() => setSide("NO")}
              className={`rounded-xl py-2.5 text-xs font-bold transition-all ${
                side === "NO"
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                  : "bg-midnight-950 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              NO ({market.no_percent}%)
            </button>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Stake Amount</span>
              <span>Balance: 100.00 GEN</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.1"
                className="w-full rounded-xl border border-slate-700 bg-midnight-950 px-4 py-2.5 text-sm font-mono text-white focus:border-polar-400 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-polar-400">GEN</span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex space-x-2">
            {["0.05", "0.1", "0.5", "1.0", "5.0"].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className="flex-1 rounded-lg border border-slate-800 bg-midnight-950 py-1 text-[11px] font-mono text-slate-400 hover:border-polar-500/50 hover:text-polar-300 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Simulator Metrics Box */}
          <div className="rounded-xl border border-polar-500/20 bg-polar-500/5 p-3 font-mono text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Projected Payout:</span>
              <span className="font-bold text-polar-300">{projectedPayout.toFixed(4)} GEN</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Projected Multiplier:</span>
              <span className="font-bold text-emerald-400">{multiplier.toFixed(2)}x</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Settlement Mechanism:</span>
              <span className="text-slate-300">O(1) Pull-Payment</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-1.5 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full rounded-xl py-3 text-xs font-bold text-white shadow-lg transition-all ${
              side === "YES"
                ? "bg-gradient-to-r from-polar-500 to-cyan-600 shadow-polar-500/20 hover:brightness-110"
                : "bg-gradient-to-r from-rose-500 to-orange-600 shadow-rose-500/20 hover:brightness-110"
            } disabled:opacity-50`}
          >
            {isSubmitting ? "Executing Transaction..." : `Confirm ${side} Deposit (${amount} GEN)`}
          </button>
        </form>
      </div>
    </div>
  );
};
