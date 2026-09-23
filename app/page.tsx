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
  fetchProtocolSummary,
  getGenLayerClient,
  stakeYes,
  stakeNo,
  resolveMarket,
  claimPayout,
  claimRefund,
  claimStaleRefund,
  createMarket,
} from "../src/contract";
import { Compass, Sparkles, Shield, Award, Layers, Search, Filter, Plus, AlertCircle } from "lucide-react";
import { formatGen } from "../src/utils";

export default function HomePage() {
  const [markets, setMarkets] = useState<OracleMarketData[]>([]);
  const [governor, setGovernor] = useState<string>("0x40E8Aa2A2bB8A0Cac70d02823014d0EddCCE371A");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // User stakes map: keyed by market_id
  const [userStakes, setUserStakes] = useState<Record<number, { claimable_amount: string; claimed: boolean }>>({});

  const handleConnectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts && accounts[0]) {
          setWalletAddress(accounts[0]);
          setNotification({
            message: `Connected wallet ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
            type: "success",
          });
          setTimeout(() => setNotification(null), 4000);
        }
      } catch (err: any) {
        setNotification({
          message: err?.message || "Wallet connection was rejected",
          type: "error",
        });
        setTimeout(() => setNotification(null), 4000);
      }
    } else {
      setNotification({
        message: "No Web3 wallet detected. Please install MetaMask to interact on GenLayer StudioNet.",
        type: "error",
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const loadOnChainMarkets = async () => {
    setIsRefreshing(true);
    try {
      const client = getGenLayerClient();

      // Query protocol summary for governor & metadata
      const summary = await fetchProtocolSummary(client);
      if (summary && summary.governor) {
        setGovernor(summary.governor);
      }

      const count = await fetchMarketCount(client);
      if (count === 0) {
        setMarkets([]);
        setUserStakes({});
      } else {
        const loaded: OracleMarketData[] = [];
        for (let i = 0; i < count; i++) {
          const m = await fetchMarket(client, i);
          if (m) loaded.push(m);
        }
        setMarkets(loaded);

        if (walletAddress) {
          const stakes: Record<number, { claimable_amount: string; claimed: boolean }> = {};
          for (const m of loaded) {
            const s = await fetchUserStake(client, m.market_id, walletAddress);
            if (s) {
              stakes[m.market_id] = {
                claimable_amount: s.claimable_amount,
                claimed: s.claimed,
              };
            }
          }
          setUserStakes(stakes);
        }
      }
    } catch (err) {
      console.warn("Could not query live contract:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOnChainMarkets();
  }, [walletAddress]);

  const handleOpenStake = (market: OracleMarketData, side: "YES" | "NO") => {
    setSelectedMarketForStake(market);
    setStakeSide(side);
    setIsStakeModalOpen(true);
  };

  const handleStake = async (marketId: number, side: "YES" | "NO", amountGen: string) => {
    if (!walletAddress) {
      setNotification({
        message: "Please connect your wallet before staking.",
        type: "error",
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    const client = getGenLayerClient(walletAddress);
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
    if (!walletAddress) {
      setNotification({
        message: "Please connect your wallet before triggering consensus resolution.",
        type: "error",
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    setResolvingMarketId(marketId);
    try {
      const client = getGenLayerClient(walletAddress);
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
    if (!walletAddress) {
      setNotification({
        message: "Please connect your wallet to claim payouts.",
        type: "error",
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    const client = getGenLayerClient(walletAddress);
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
    if (!walletAddress) {
      setNotification({
        message: "Please connect your wallet to initialize a market.",
        type: "error",
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    const client = getGenLayerClient(walletAddress);
    await createMarket(client, title, criteria, primaryUrl, secondaryUrl, deadlineIso);
    setNotification({
      message: "New prediction market charted on-chain!",
      type: "success",
    });
    setTimeout(() => setNotification(null), 4000);
    loadOnChainMarkets();
  };

  // Compute protocol totals strictly from live data
  const totalVolumeWei = markets.reduce((acc, m) => acc + BigInt(m.total_pool_volume || "0"), 0n);

  const claimableCount = Object.values(userStakes).filter(
    (s) => BigInt(s.claimable_amount || "0") > 0n && !s.claimed
  ).length;

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
        walletAddress={walletAddress}
        claimableCount={claimableCount}
        onRefresh={loadOnChainMarkets}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenClaimStation={() => setIsClaimStationOpen(true)}
        onConnectWallet={handleConnectWallet}
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
                Verifiable Prediction Markets.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-polar-400 to-cobalt-500">
                  Autonomous Settlement.
                </span>
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 rounded-xl border border-polar-500/40 bg-midnight-900/95 p-4 shadow-2xl backdrop-blur-xl">
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

        {/* Market Content: Loading / Empty State / Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Compass className="h-8 w-8 animate-spin text-polar-400 mb-3" />
            <p className="text-sm font-mono text-slate-400">Loading Pytheas on-chain markets...</p>
          </div>
        ) : markets.length === 0 ? (
          <div className="rounded-2xl border border-polar-500/20 bg-midnight-900/60 p-12 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-polar-500/30 bg-polar-500/10 text-polar-400 shadow-lg shadow-polar-500/10 mb-4">
              <Compass className="h-7 w-7 animate-spin-slow" />
            </div>
            <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-400 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Clearinghouse Live on StudioNet (0xdd7f...d117)</span>
            </div>
            <h3 className="text-lg font-bold text-white">No Prediction Markets Charted Yet</h3>
            <p className="mt-2 text-xs text-slate-400 font-mono max-w-md mx-auto">
              Pytheas Oracle clearinghouse is live on GenLayer StudioNet with 0 markets charted. Chart the first live-web corroboration market to initiate parimutuel consensus!
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-polar-500 to-cobalt-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-polar-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Chart First Market</span>
              </button>
            </div>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="rounded-2xl border border-polar-500/20 bg-midnight-900/40 p-12 text-center backdrop-blur-xl">
            <AlertCircle className="mx-auto h-8 w-8 text-slate-500 mb-2" />
            <h3 className="text-base font-semibold text-slate-300">No Markets Match Filter</h3>
            <p className="mt-1 text-xs text-slate-500 font-mono">
              Try refining your search query or switch tabs.
            </p>
          </div>
        ) : (
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
        )}
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
