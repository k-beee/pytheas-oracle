"use client";

import React, { useState } from "react";
import { X, Compass, ShieldCheck, AlertCircle, Globe, CheckCircle2 } from "lucide-react";

interface CreateOracleMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMarket: (
    title: string,
    criteria: string,
    primaryUrl: string,
    secondaryUrl: string,
    deadlineIso: string
  ) => Promise<void>;
}

const TRUSTED_DOMAINS_SAMPLE = [
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
  "en.wikipedia.org",
  "coindesk.com",
  "arxiv.org",
  "github.com",
];

export const CreateOracleMarketModal: React.FC<CreateOracleMarketModalProps> = ({
  isOpen,
  onClose,
  onCreateMarket,
}) => {
  const [title, setTitle] = useState("");
  const [criteria, setCriteria] = useState("");
  const [primaryUrl, setPrimaryUrl] = useState("");
  const [secondaryUrl, setSecondaryUrl] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time domain verification helper
  const checkDomain = (url: string) => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      return TRUSTED_DOMAINS_SAMPLE.some((d) => host === d || host.endsWith("." + d));
    } catch {
      return false;
    }
  };

  const primaryStatus = checkDomain(primaryUrl);
  const secondaryStatus = secondaryUrl ? checkDomain(secondaryUrl) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 10 || title.trim().length > 300) {
      setError("Market question must be between 10 and 300 characters.");
      return;
    }
    if (criteria.trim().length < 20 || criteria.trim().length > 1200) {
      setError("Resolution criteria must be between 20 and 1200 characters.");
      return;
    }
    if (!primaryUrl.startsWith("http://") && !primaryUrl.startsWith("https://")) {
      setError("Primary URL must begin with http:// or https://");
      return;
    }
    if (primaryStatus === false) {
      setError("Primary source host is not in the approved institutional registry.");
      return;
    }
    if (secondaryUrl && secondaryStatus === false) {
      setError("Secondary corroborating source host is not in the approved institutional registry.");
      return;
    }

    const days = parseFloat(durationDays) || 30;
    const deadlineIso = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();

    setIsSubmitting(true);
    try {
      await onCreateMarket(title.trim(), criteria.trim(), primaryUrl.trim(), secondaryUrl.trim(), deadlineIso);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to chart market on-chain");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-950/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-polar-500/30 bg-midnight-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Compass className="h-5 w-5 text-polar-400" />
            <h2 className="text-base font-bold text-white">Chart New Prediction Market</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Question */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Market Question (Plain-English)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Will NASA confirm Artemis III lunar crew assignments before 2027?"
              className="w-full rounded-xl border border-slate-700 bg-midnight-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-polar-400 focus:outline-none"
            />
          </div>

          {/* Criteria */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Deterministic Resolution Criteria</label>
            <textarea
              rows={3}
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="Resolves YES if the official source confirms... Resolves NO if..."
              className="w-full rounded-xl border border-slate-700 bg-midnight-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-polar-400 focus:outline-none resize-none"
            />
          </div>

          {/* Primary Source URL */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-mono text-slate-400">Primary Institutional Source URL</label>
              {primaryStatus === true && (
                <span className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Approved Source</span>
                </span>
              )}
              {primaryStatus === false && (
                <span className="flex items-center space-x-1 text-[11px] font-mono text-rose-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>Unregistered Domain</span>
                </span>
              )}
            </div>
            <input
              type="url"
              value={primaryUrl}
              onChange={(e) => setPrimaryUrl(e.target.value)}
              placeholder="https://www.nasa.gov/news"
              className="w-full rounded-xl border border-slate-700 bg-midnight-950 px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-polar-400 focus:outline-none"
            />
          </div>

          {/* Secondary Source URL */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Secondary Corroborating Source URL (Optional)</label>
            <input
              type="url"
              value={secondaryUrl}
              onChange={(e) => setSecondaryUrl(e.target.value)}
              placeholder="https://www.nature.com"
              className="w-full rounded-xl border border-slate-700 bg-midnight-950 px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-polar-400 focus:outline-none"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Market Horizon (Days: {durationDays})</label>
            <input
              type="range"
              min="1"
              max="180"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="w-full accent-polar-400"
            />
          </div>

          {error && (
            <div className="flex items-center space-x-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-polar-500 to-cobalt-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-polar-500/20 hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? "Initializing On-Chain Market..." : "Initialize Pytheas Market"}
          </button>
        </form>
      </div>
    </div>
  );
};
