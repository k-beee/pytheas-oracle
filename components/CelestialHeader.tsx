"use client";

import React from "react";
import { Compass, Navigation2, ShieldCheck, Plus, RefreshCw, Cpu } from "lucide-react";
import { truncateAddress } from "../src/utils";

interface CelestialHeaderProps {
  governor: string;
  totalMarkets: number;
  totalVolume: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
}

export const CelestialHeader: React.FC<CelestialHeaderProps> = ({
  governor,
  totalMarkets,
  totalVolume,
  isRefreshing,
  onRefresh,
  onOpenCreateModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-polar-500/20 bg-midnight-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-polar-400 to-cobalt-600 p-0.5 shadow-lg shadow-polar-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-midnight-950">
              <Compass className="h-5 w-5 text-polar-400 animate-spin-slow" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black tracking-tight text-white">
                PYTHEAS<span className="text-polar-400">.ORACLE</span>
              </h1>
              <span className="rounded-full border border-polar-500/30 bg-polar-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-polar-300">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Live-Web Navigator & Settlement Matrix</p>
          </div>
        </div>

        {/* Global Telemetry Chips */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-2 rounded-lg border border-slate-800 bg-midnight-900/60 px-3 py-1.5 text-xs font-mono text-slate-300">
            <Cpu className="h-3.5 w-3.5 text-polar-400" />
            <span>Network:</span>
            <span className="text-emerald-400">StudioNet (61999)</span>
          </div>

          <div className="flex items-center space-x-2 rounded-lg border border-slate-800 bg-midnight-900/60 px-3 py-1.5 text-xs font-mono text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-cobalt-400" />
            <span>Gov:</span>
            <span className="text-polar-300">{governor ? truncateAddress(governor) : "0x4994...9772"}</span>
          </div>

          <div className="flex items-center space-x-2 rounded-lg border border-slate-800 bg-midnight-900/60 px-3 py-1.5 text-xs font-mono text-slate-300">
            <span>Markets:</span>
            <span className="text-white font-bold">{totalMarkets}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1 rounded-lg border border-polar-500/30 bg-midnight-900 px-3 py-2 text-xs font-medium text-slate-200 transition-all hover:border-polar-400 hover:text-white disabled:opacity-50"
            title="Refresh On-Chain State"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-polar-400 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-polar-500 to-cobalt-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-polar-500/20 transition-all hover:brightness-110 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Chart Market</span>
          </button>
        </div>
      </div>
    </header>
  );
};
