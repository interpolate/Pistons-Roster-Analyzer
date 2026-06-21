import React, { useState } from "react";
import { FreeAgent } from "../types";
import { Sparkles, DollarSign, Calendar, Compass, ShieldAlert, ArrowUpRight, HelpCircle, UserPlus, CheckCircle } from "lucide-react";

interface FreeAgencyViewProps {
  freeAgents: FreeAgent[];
  addedFreeAgentIds: string[];
  onSignFreeAgent: (id: string) => void;
  onReleaseFreeAgent: (id: string) => void;
  onNavigateToSimulator: () => void;
}

export default function FreeAgencyView({
  freeAgents,
  addedFreeAgentIds,
  onSignFreeAgent,
  onReleaseFreeAgent,
  onNavigateToSimulator
}: FreeAgencyViewProps) {
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [selectedPosition, setSelectedPosition] = useState<string>("All");

  const tiers = ["All", "Max Target", "Premium Starter", "Valued Role Player", "Vet Minimum"];
  const positions = ["All", "PG", "SG", "SF", "PF", "C"];

  const filteredAgents = freeAgents.filter((agent) => {
    const matchesTier = selectedTier === "All" || agent.tier === selectedTier;
    const matchesPosition = selectedPosition === "All" || agent.position.includes(selectedPosition);
    return matchesTier && matchesPosition;
  });

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "Max Target":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Premium Starter":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Valued Role Player":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div id="free-agency-container" className="flex-1 overflow-y-auto bg-slate-900 p-4 lg:p-8 pb-32 lg:pb-8 text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Free Agency Pool</h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
            Simulate signings to optimize team spacing, frontcourt protection, or veteran scoring experience.
          </p>
        </div>
        
        <div className="bg-slate-950 p-3.5 md:p-4 rounded-xl border border-slate-800 flex items-center gap-3 shrink-0">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase leading-none">Pistons Target Cap Space</p>
            <p className="text-sm font-bold text-slate-200 mt-1.5 font-mono">$36.5 Million Est.</p>
          </div>
        </div>
      </div>

      {/* Dynamic Filters Toolbar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 md:p-5 mb-6 md:mb-8 space-y-4">
        {/* Tier filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
          <span className="text-xs font-mono text-slate-400 uppercase w-28 shrink-0">Acquisition Tier:</span>
          <div id="tier-filter-buttons" className="flex flex-wrap items-center gap-2">
            {tiers.map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                  selectedTier === tier
                    ? "bg-red-600 text-white border-red-500 shadow-xs"
                    : "text-slate-400 bg-slate-900/60 border-slate-800 hover:text-slate-200"
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Diagonal Line spacer */}
        <div className="h-px bg-slate-900" />

        {/* Position filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
          <span className="text-xs font-mono text-slate-400 uppercase w-28 shrink-0">Field Position:</span>
          <div id="position-filter-buttons" className="flex flex-wrap items-center gap-2">
            {positions.map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                  selectedPosition === pos
                    ? "bg-blue-600 text-white border-blue-500 shadow-xs"
                    : "text-slate-400 bg-slate-900/60 border-slate-800 hover:text-slate-200"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Targets Cards Grid */}
      <div className="grid xl:grid-cols-2 gap-6">
        {filteredAgents.map((agent) => {
          const isSigned = addedFreeAgentIds.includes(agent.id);

          return (
            <div
              key={agent.id}
              id={`free-agent-card-${agent.id}`}
              className={`bg-slate-950 border rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between ${
                isSigned
                  ? "border-emerald-500/45 shadow-emerald-500/5 bg-slate-950"
                  : "border-slate-800 hover:border-slate-700/80 transition-all"
              }`}
            >
              {/* Top Banner with Team Logo or Status */}
              <div className="flex items-start justify-between border-b border-slate-900 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{agent.name}</h3>
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] rounded">
                      {agent.position}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Current: {agent.currentTeam} • Age {agent.age}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${getTierBadgeColor(agent.tier)}`}>
                    {agent.tier}
                  </span>
                  
                  {/* Projected Salary Cap hit flag */}
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    ${agent.projectedSalary}M / yr
                  </span>
                </div>
              </div>

              {/* Player Stats banner */}
              <div className="grid grid-cols-3 gap-2 py-3 bg-slate-900/40 px-4 rounded-xl mt-4 border border-slate-900/60">
                <div className="text-center">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">PPG</span>
                  <span className="text-sm font-bold text-slate-200">{agent.ppg.toFixed(1)}</span>
                </div>
                <div className="text-center border-l border-slate-900">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">RPG</span>
                  <span className="text-sm font-bold text-slate-200">{agent.rpg.toFixed(1)}</span>
                </div>
                <div className="text-center border-l border-slate-900">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">APG</span>
                  <span className="text-sm font-bold text-slate-200">{agent.apg.toFixed(1)}</span>
                </div>
              </div>

              {/* Advanced Impact Ratings banner */}
              <div className="grid grid-cols-3 gap-2 py-2 px-4 bg-slate-900/20 rounded-xl mb-4 border border-slate-900/30">
                <div className="text-center">
                  <span className="text-[8px] uppercase tracking-wider font-mono text-blue-400 block font-bold">DARKO DPM</span>
                  <span className="text-xs font-mono font-bold text-blue-300">
                    {agent.darko !== undefined ? (agent.darko > 0 ? `+${agent.darko.toFixed(1)}` : agent.darko.toFixed(1)) : "—"}
                  </span>
                </div>
                <div className="text-center border-l border-slate-900/60">
                  <span className="text-[8px] uppercase tracking-wider font-mono text-pink-400 block font-bold">LEBRON Rating</span>
                  <span className="text-xs font-mono font-bold text-pink-300">
                    {agent.lebron !== undefined ? (agent.lebron > 0 ? `+${agent.lebron.toFixed(1)}` : agent.lebron.toFixed(1)) : "—"}
                  </span>
                </div>
                <div className="text-center border-l border-slate-900/60">
                  <span className="text-[8px] uppercase tracking-wider font-mono text-emerald-400 block font-bold">EPM Rating</span>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    {agent.epm !== undefined ? (agent.epm > 0 ? `+${agent.epm.toFixed(1)}` : agent.epm.toFixed(1)) : "—"}
                  </span>
                </div>
              </div>

              {/* Strengths & Weaknesses Checklist */}
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-[10px] uppercase font-mono text-blue-400 font-bold block mb-1.5">Scout Strengths</span>
                  <ul className="space-y-1">
                    {agent.strengths.slice(0, 2).map((str, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-center gap-1.5 truncate">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-red-400 font-bold block mb-1.5">Potential Cons</span>
                  <ul className="space-y-1">
                    {agent.weaknesses.slice(0, 2).map((wk, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                        <span className="text-red-500 font-black">•</span>
                        <span>{wk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Short Description Fit */}
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-900 text-xs text-slate-300 leading-relaxed mb-4">
                <span className="font-semibold text-amber-500 block mb-1 font-mono uppercase tracking-widest text-[9px]">Pistons Scheme Alignment:</span>
                {agent.fitAnalysis}
              </div>

              {/* CTA Action */}
              <div className="pt-2 border-t border-slate-900 flex justify-end">
                {isSigned ? (
                  <button
                    onClick={() => onReleaseFreeAgent(agent.id)}
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white text-xs font-semibold cursor-pointer transition-all border border-red-500/20 py-2.5 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Cut Signed Deal</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onSignFreeAgent(agent.id);
                      onNavigateToSimulator();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Contract & Simulate Sign</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredAgents.length === 0 && (
          <div className="col-span-2 text-center py-20 bg-slate-950 rounded-2xl border border-slate-800 text-slate-500">
            <svg className="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold mb-1">No Free Agents Found</p>
            <p className="text-xs text-slate-600">Try relaxing your positional or acquisition tier filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
