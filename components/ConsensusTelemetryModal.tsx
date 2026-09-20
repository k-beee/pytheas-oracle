"use client";

import React, { useState } from "react";
import { X, ShieldCheck, FileText, Hash, CheckCircle2, Globe, ExternalLink, Copy, Check } from "lucide-react";
import { OracleMarketData } from "../src/types";

interface ConsensusTelemetryModalProps {
  isOpen: boolean;
  market: OracleMarketData | null;
  onClose: () => void;
}

export const ConsensusTelemetryModal: React.FC<ConsensusTelemetryModalProps> = ({
  isOpen,
  market,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !market) return null;

  const handleCopyHash = () => {
    if (market.proof_hash) {
      navigator.clipboard.writeText(market.proof_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-950/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-polar-500/30 bg-midnight-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-polar-400" />
            <h2 className="text-base font-bold text-white">Consensus & Evidence Telemetry</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Market Overview */}
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400">Market Question</span>
            <h3 className="text-sm font-semibold text-white mt-0.5">{market.title}</h3>
          </div>

          {/* Adjudication Verdict Card */}
          <div className="rounded-xl border border-polar-500/30 bg-midnight-950 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Adjudicated Consensus Outcome:</span>
              <span className="rounded-md border border-polar-500/40 bg-polar-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-polar-300">
                {market.outcome || "PENDING RESOLUTION"}
              </span>
            </div>

            {market.rationale && (
              <div className="mt-3 text-xs text-slate-300 font-mono bg-midnight-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-polar-400 font-bold block mb-1">Validator Rationale:</span>
                "{market.rationale}"
              </div>
            )}
          </div>

          {/* Grounding Sources */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-midnight-950 p-3">
              <span className="text-[11px] font-mono text-polar-400 block mb-1">Primary Institutional Source</span>
              <a
                href={market.primary_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white break-all transition-colors"
              >
                <Globe className="h-3.5 w-3.5 shrink-0 text-polar-400" />
                <span className="line-clamp-1">{market.primary_url}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>

            <div className="rounded-xl border border-slate-800 bg-midnight-950 p-3">
              <span className="text-[11px] font-mono text-cobalt-400 block mb-1">Corroborating Secondary Source</span>
              {market.secondary_url ? (
                <a
                  href={market.secondary_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white break-all transition-colors"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0 text-cobalt-400" />
                  <span className="line-clamp-1">{market.secondary_url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <span className="text-xs text-slate-500 font-mono italic">None configured</span>
              )}
            </div>
          </div>

          {/* Cryptographic Proof Hash */}
          <div className="rounded-xl border border-slate-800 bg-midnight-950 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                <Hash className="h-3.5 w-3.5 text-polar-400" />
                <span>Evidence SHA-256 Digest:</span>
              </span>
              {market.proof_hash && (
                <button
                  onClick={handleCopyHash}
                  className="flex items-center space-x-1 text-[11px] font-mono text-slate-400 hover:text-polar-300"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>
            <code className="block text-xs font-mono text-slate-300 break-all bg-midnight-900 p-2 rounded border border-slate-800">
              {market.proof_hash || "Evidence digest generated upon consensus finalization."}
            </code>
          </div>

          {/* Sanitized Evidence Preview */}
          <div>
            <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1 mb-1">
              <FileText className="h-3.5 w-3.5 text-polar-400" />
              <span>In-Contract Sanitized Web Evidence Sample:</span>
            </span>
            <div className="rounded-xl border border-slate-800 bg-midnight-950 p-3 text-xs font-mono text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {market.proof_sample || "Web payload sanitized and parsed contract-side during resolution."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
