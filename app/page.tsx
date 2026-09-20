"use client";

import React, { useState, useEffect } from "react";
import { CelestialHeader } from "../components/CelestialHeader";
import { OracleMarketCard } from "../components/OracleMarketCard";
import { StakingSimulatorModal } from "../components/StakingSimulatorModal";
import { ConsensusTelemetryModal } from "../components/ConsensusTelemetryModal";
import { SettlementStationModal } from "../components/SettlementStationModal";
import { CreateOracleMarketModal } from "../components/CreateOracleMarketModal";
import { OracleMarketData } from "../src/types";
import {
  fetchMarketCount,
  fetchMarket,
  fetchUserStake,
  getGenLayerClient,
  stakeYes,
  stakeNo,
  resolveMarket,
  claimPayout,
  claimRefund,
  claimStaleRefund,
  createMarket,
} from "../src/contract";
import { Compass, Sparkles, Shield, Award, Layers, Search, Filter } from "lucide-react";
import { formatGen } from "../src/utils";

const DEMO_BENCHMARK_MARKETS: OracleMarketData[] = [
  {
    market_id: 0,
    creator: "0x4994A3a7e5286E5DC416d59981C56085B8609772",
    title: "Will NASA officially announce crew assignments for the Artemis III lunar landing mission before 2027?",
    criteria: "Resolves YES if NASA publishes an official news release confirming astronauts assigned to the Artemis III surface landing crew before December 31, 2026. Resolves NO otherwise.",
    primary_url: "https://www.nasa.gov/news",
    secondary_url: "https://www.nature.com",
    deadline: "2026-12-31T00:00:00Z",
    deadline_iso: "2026-12-31T00:00:00Z",
    deadline_timestamp: 1798675200,
    status: 0,
    status_str: "ACTIVE",
    outcome: "",
    consensus_outcome: "",
    rationale: "",
    consensus_rationale: "",
    proof_hash: "",
    evidence_proof_hash: "",
    proof_sample: "",
    evidence_proof_sample: "",
    resolution_attempts: 0,
    yes_pool: "4500000000000000000",
    no_pool: "2500000000000000000",
    total_volume: "7000000000000000000",
    total_yes_stake: "4500000000000000000",
    total_no_stake: "2500000000000000000",
    total_pool_volume: "7000000000000000000",
    total_claims_paid: "0",
    remaining_pool: "7000000000000000000",
    remaining_payout_pool: "7000000000000000000",
    unclaimed_winners_count: 0,
    yes_stakers_count: 14,
    no_stakers_count: 8,
    yes_percent: 64,
    no_percent: 36,
    created_at: "2026-09-18T12:00:00Z",
    created_at_iso: "2026-09-18T12:00:00Z",
    resolved_at: "",
    resolved_at_iso: "",
  },
  {
    market_id: 1,
    creator: "0x4994A3a7e5286E5DC416d59981C56085B8609772",
    title: "Will the US SEC finalize regulatory guidance for autonomous AI trading agents in 2026?",
    criteria: "Resolves YES if the Securities and Exchange Commission issues a final rule notice or regulatory policy statement specifically addressing autonomous AI execution agents before December 31, 2026.",
    primary_url: "https://www.sec.gov/news",
    secondary_url: "https://www.reuters.com",
    deadline: "2026-11-30T00:00:00Z",
    deadline_iso: "2026-11-30T00:00:00Z",
    deadline_timestamp: 1796000000,
    status: 0,
    status_str: "ACTIVE",
    outcome: "",
    consensus_outcome: "",
    rationale: "",
    consensus_rationale: "",
    proof_hash: "",
    evidence_proof_hash: "",
    proof_sample: "",
    evidence_proof_sample: "",
    resolution_attempts: 0,
    yes_pool: "8200000000000000000",
    no_pool: "9400000000000000000",
    total_volume: "17600000000000000000",
    total_yes_stake: "8200000000000000000",
    total_no_stake: "9400000000000000000",
    total_pool_volume: "17600000000000000000",
    total_claims_paid: "0",
    remaining_pool: "17600000000000000000",
    remaining_payout_pool: "17600000000000000000",
    unclaimed_winners_count: 0,
    yes_stakers_count: 22,
    no_stakers_count: 28,
    yes_percent: 47,
    no_percent: 53,
    created_at: "2026-09-17T08:30:00Z",
    created_at_iso: "2026-09-17T08:30:00Z",
    resolved_at: "",
    resolved_at_iso: "",
  },
  {
    market_id: 2,
    creator: "0x4994A3a7e5286E5DC416d59981C56085B8609772",
    title: "Will NOAA report above-average accumulated cyclone energy for the 2026 Atlantic season?",
    criteria: "Resolves YES if NOAA's official post-season tropical meteorological summary certifies total ACE exceeding 103% of the 30-year historical median. Resolves NO otherwise.",
    primary_url: "https://www.noaa.gov/news",
    secondary_url: "",
    deadline: "2026-09-19T00:00:00Z",
    deadline_iso: "2026-09-19T00:00:00Z",
    deadline_timestamp: 1789776000,
    status: 2,
    status_str: "SETTLED_YES",
    outcome: "YES",
    consensus_outcome: "YES",
    rationale: "NOAA post-season climate review published on official news portal verified Atlantic basin ACE reached 142% of normal median.",
    consensus_rationale: "NOAA post-season climate review published on official news portal verified Atlantic basin ACE reached 142% of normal median.",
    proof_hash: "a4f89d3bc7e112448a90bb12ee3387bcf98012da77661144bb221199ee0011bb",
    evidence_proof_hash: "a4f89d3bc7e112448a90bb12ee3387bcf98012da77661144bb221199ee0011bb",
    proof_sample: "PRIMARY EVIDENCE SOURCE (https://www.noaa.gov/news):\nNOAA Climate Prediction Center confirms the 2026 Atlantic season generated 142% of median Accumulated Cyclone Energy (ACE) under persistent warm sea temperatures.",
    evidence_proof_sample: "PRIMARY EVIDENCE SOURCE (https://www.noaa.gov/news):\nNOAA Climate Prediction Center confirms the 2026 Atlantic season generated 142% of median Accumulated Cyclone Energy (ACE) under persistent warm sea temperatures.",
    resolution_attempts: 1,
    yes_pool: "6000000000000000000",
    no_pool: "4000000000000000000",
    total_volume: "10000000000000000000",
    total_yes_stake: "6000000000000000000",
    total_no_stake: "4000000000000000000",
    total_pool_volume: "10000000000000000000",
    total_claims_paid: "2500000000000000000",
    remaining_pool: "7500000000000000000",
    remaining_payout_pool: "7500000000000000000",
    unclaimed_winners_count: 5,
    yes_stakers_count: 12,
    no_stakers_count: 9,
    yes_percent: 60,
    no_percent: 40,
    created_at: "2026-08-15T10:00:00Z",
    created_at_iso: "2026-08-15T10:00:00Z",
    resolved_at: "2026-09-19T02:15:00Z",
    resolved_at_iso: "2026-09-19T02:15:00Z",
  }
];

export default function HomePage() {
  const [markets, setMarkets] = useState<OracleMarketData[]>(DEMO_BENCHMARK_MARKETS);
  const [governor, setGovernor] = useState<string>("0x4994A3a7e5286E5DC416d59981C56085B8609772");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "SETTLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [selectedMarketForStake, setSelectedMarketForStake] = useState<OracleMarketData | null>(null);
  const [stakeSide, setStakeSide] = useState<"YES" | "NO">("YES");
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);

  const [selectedMarketForTelemetry, setSelectedMarketForTelemetry] = useState<OracleMarketData | null>(null);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);

  const [isClaimStationOpen, setIsClaimStationOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [resolvingMarketId, setResolvingMarketId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // User stakes map
  const [userStakes, setUserStakes] = useState<Record<number, { claimable_amount: string; claimed: boolean }>>({
    2: { claimable_amount: "1500000000000000000", claimed: false },
  });

  const loadOnChainMarkets = async () => {
    setIsRefreshing(true);
    try {
      const client = getGenLayerClient();
      const count = await fetchMarketCount(client);
      if (count > 0) {
        const loaded: OracleMarketData[] = [];
        for (let i = 0; i < count; i++) {
          const m = await fetchMarket(client, i);
          if (m) loaded.push(m);
        }
        if (loaded.length > 0) {
          setMarkets(loaded);
        }
      }
    } catch (err) {
      console.warn("Could not query live contract, displaying benchmark markets:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOnChainMarkets();
  }, []);

  const handleOpenStake = (market: OracleMarketData, side: "YES" | "NO") => {
    setSelectedMarketForStake(market);
    setStakeSide(side);
    setIsStakeModalOpen(true);
  };

  const handleStake = async (marketId: number, side: "YES" | "NO", amountGen: string) => {
    const client = getGenLayerClient();
    if (side === "YES") {
      await stakeYes(client, marketId, amountGen);
    } else {
      await stakeNo(client, marketId, amountGen);
    }
    setNotification({
      message: `Successfully staked ${amountGen} GEN on ${side}!`,
      type: "success",
    });
    setTimeout(() => setNotification(null), 4000);
    loadOnChainMarkets();
  };

  const handleOpenTelemetry = (market: OracleMarketData) => {
    setSelectedMarketForTelemetry(market);
    setIsTelemetryModalOpen(true);
  };

  const handleResolve = async (marketId: number) => {
    setResolvingMarketId(marketId);
    try {
      const client = getGenLayerClient();
      await resolveMarket(client, marketId);
      setNotification({
        message: `Consensus resolved for market #${marketId}!`,
        type: "success",
      });
      loadOnChainMarkets();
    } catch (err: any) {
      setNotification({
        message: err?.message || "Consensus resolution failed",
        type: "error",
      });
    } finally {
      setResolvingMarketId(null);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleClaim = async (marketId: number, type: "PAYOUT" | "REFUND" | "ABANDON") => {
    const client = getGenLayerClient();
    if (type === "PAYOUT") {
      await claimPayout(client, marketId);
    } else if (type === "REFUND") {
      await claimRefund(client, marketId);
    } else {
      await claimStaleRefund(client, marketId);
    }
    setNotification({
      message: "Successfully pulled settlement payout from clearinghouse!",
      type: "success",
    });
    setTimeout(() => setNotification(null), 4000);
    loadOnChainMarkets();
  };

  const handleCreateMarket = async (
    title: string,
    criteria: string,
    primaryUrl: string,
    secondaryUrl: string,
    deadlineIso: string
  ) => {
    const client = getGenLayerClient();
    await createMarket(client, title, criteria, primaryUrl, secondaryUrl, deadlineIso);
    setNotification({
      message: "New prediction market charted on-chain!",
      type: "success",
    });
    setTimeout(() => setNotification(null), 4000);
    loadOnChainMarkets();
  };

  // Compute protocol totals
  const totalVolumeWei = markets.reduce((acc, m) => acc + BigInt(m.total_pool_volume || "0"), 0n);

  // Filter markets
  const filteredMarkets = markets.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.primary_url.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === "ACTIVE") return m.status === 0;
    if (activeTab === "SETTLED") return m.status === 2 || m.status === 3 || m.status === 4 || m.status === 5;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col bg-midnight-950 text-slate-100">
      {/* Header */}
      <CelestialHeader
        governor={governor}
        totalMarkets={markets.length}
        totalVolume={formatGen(totalVolumeWei)}
        isRefreshing={isRefreshing}
        onRefresh={loadOnChainMarkets}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-polar-500/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 rounded-full border border-polar-500/30 bg-polar-500/10 px-3 py-1 text-xs font-mono text-polar-300 mb-3">
                <Compass className="h-3.5 w-3.5 animate-spin-slow" />
                <span>Nautical Live-Web Consensus Matrix</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Verifiable Prediction Markets. <span className="text-transparent bg-clip-text bg-gradient-to-r from-polar-400 to-cobalt-500">Autonomous Settlement.</span>
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400 leading-relaxed">
                Pytheas navigates institutional live-web endpoints to corroborate objective truth. Featuring O(1) pull-payment claims, dual-source evidence corroboration, and in-contract HTML sanitization.
              </p>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto">
              <div className="polar-card rounded-xl p-3.5">
                <span className="text-[11px] font-mono text-slate-400 block">Total Liquidity</span>
                <span className="text-lg font-bold font-mono text-white">{formatGen(totalVolumeWei)} GEN</span>
              </div>
              <div className="polar-card rounded-xl p-3.5">
                <span className="text-[11px] font-mono text-slate-400 block">Charted Markets</span>
                <span className="text-lg font-bold font-mono text-polar-300">{markets.length}</span>
              </div>
              <div className="polar-card rounded-xl p-3.5 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-mono text-slate-400 block">Settlement Architecture</span>
                <span className="text-sm font-bold font-mono text-emerald-400">O(1) Pull-Claim</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 rounded-xl border border-polar-500/40 bg-midnight-900/90 p-4 shadow-2xl backdrop-blur-xl">
          <Sparkles className="h-5 w-5 text-polar-400" />
          <span className="text-xs font-semibold text-white">{notification.message}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 w-full">
        {/* Navigation & Search Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Tab Filter */}
          <div className="flex rounded-xl bg-midnight-900 p-1 border border-slate-800 w-full sm:w-auto">
            {(["ALL", "ACTIVE", "SETTLED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === tab
                    ? "bg-polar-500/20 text-polar-300 border border-polar-500/30 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab === "ALL" ? "All Markets" : tab === "ACTIVE" ? "Active Staking" : "Settled & Final"}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search markets or sources..."
              className="w-full rounded-xl border border-slate-800 bg-midnight-900 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-polar-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Market Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMarkets.map((m) => (
            <OracleMarketCard
              key={m.market_id}
              market={m}
              userClaimable={userStakes[m.market_id]?.claimable_amount || "0"}
              isResolving={resolvingMarketId === m.market_id}
              onOpenStake={handleOpenStake}
              onOpenTelemetry={handleOpenTelemetry}
              onResolve={handleResolve}
              onClaim={(id) => handleClaim(id, m.status === 4 ? "REFUND" : m.status === 5 ? "ABANDON" : "PAYOUT")}
            />
          ))}
        </div>
      </main>

      {/* Modals */}
      <StakingSimulatorModal
        isOpen={isStakeModalOpen}
        market={selectedMarketForStake}
        initialSide={stakeSide}
        onClose={() => setIsStakeModalOpen(false)}
        onStake={handleStake}
      />

      <ConsensusTelemetryModal
        isOpen={isTelemetryModalOpen}
        market={selectedMarketForTelemetry}
        onClose={() => setIsTelemetryModalOpen(false)}
      />

      <SettlementStationModal
        isOpen={isClaimStationOpen}
        markets={markets}
        userStakes={userStakes}
        onClose={() => setIsClaimStationOpen(false)}
        onClaim={handleClaim}
      />

      <CreateOracleMarketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateMarket={handleCreateMarket}
      />
    </div>
  );
}
