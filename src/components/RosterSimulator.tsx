import React, { useState, useEffect } from "react";
import { Player, DraftProspect, FreeAgent, TeamNeedsChecklist } from "../types";
import { currentRosterData, draftProspectsData, freeAgentsData } from "../data";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Wrench, 
  UserMinus, 
  BadgeAlert, 
  Plus, 
  Check, 
  AlertCircle, 
  TrendingUp, 
  Lock, 
  CircleDollarSign, 
  ChevronRight, 
  Info,
  Layers,
  UserCheck,
  ChevronDown
} from "lucide-react";

interface RosterSimulatorProps {
  // Current state of simulation managed in App.tsx
  excludedPlayerIds: string[];
  addedProspectIds: string[];
  addedFreeAgentIds: string[];
  
  onTogglePlayerExclude: (id: string) => void;
  onAddProspect: (id: string) => void;
  onRemoveProspect: (id: string) => void;
  onAddFreeAgent: (id: string) => void;
  onRemoveFreeAgent: (id: string) => void;
  onResetSimulation: () => void;
}

export default function RosterSimulator({
  excludedPlayerIds,
  addedProspectIds,
  addedFreeAgentIds,
  onTogglePlayerExclude,
  onAddProspect,
  onRemoveProspect,
  onAddFreeAgent,
  onRemoveFreeAgent,
  onResetSimulation
}: RosterSimulatorProps) {

  const [isAdditionsExpanded, setIsAdditionsExpanded] = useState(true);
  const [isRosterExpanded, setIsRosterExpanded] = useState(true);

  // Collapse sections on mobile pages by default to maximize visible feedback
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsAdditionsExpanded(false);
      setIsRosterExpanded(false);
    }
  }, []);

  // Fetch full active list from baseline datasets
  const activeCurrentPlayers = currentRosterData.filter(p => !excludedPlayerIds.includes(p.id));
  const selectedProspects = draftProspectsData.filter(d => addedProspectIds.includes(d.id));
  const selectedFreeAgents = freeAgentsData.filter(f => addedFreeAgentIds.includes(f.id));

  const totalSimulatedPlayersCount = activeCurrentPlayers.length + selectedProspects.length + selectedFreeAgents.length;

  // 1. PROJECTED CAP SPACE CALCULATIONS
  // Starting CAP space estimate for Pistons in 2026: ~$36.5M
  const baselineCapSpace = 36.5;
  const signedFreeAgentCost = selectedFreeAgents.reduce((sum, fa) => sum + fa.projectedSalary, 0);
  const remainingCapSpace = +(baselineCapSpace - signedFreeAgentCost).toFixed(1);

  // 2. SPORTS ANALYTICS METRICS IN SILICO
  // Projected Total score (Average of top 5 scorers on simulated squad)
  const allScoringRates = [
    ...activeCurrentPlayers.map(p => p.ppg),
    ...selectedProspects.map(p => p.projectedPpg),
    ...selectedFreeAgents.map(fa => fa.ppg)
  ].sort((a,b) => b-a);
  
  const topScorers = allScoringRates.slice(0, 5);
  const projectedSquadScoring = topScorers.length > 0 
    ? +(topScorers.reduce((sum, val) => sum + val, 0)).toFixed(1) 
    : 0.0;

  // Spacing Rating (1-10)
  // Current squad baseline holds Beasley, Fontecchio, Stewart, Harris as average spacers.
  const baseShootersCount = activeCurrentPlayers.filter(p => 
    p.strengths.some(s => s.toLowerCase().includes("3pt") || s.toLowerCase().includes("spacing")) ||
    p.name === "Malik Beasley" || p.name === "Simone Fontecchio"
  ).length;
  
  const additionalShootersCount = selectedProspects.filter(p => p.primaryBenefit === "shooting").length +
                                 selectedFreeAgents.filter(fa => fa.primaryBenefit === "shooting").length;
  
  const totalSpacers = baseShootersCount + additionalShootersCount;
  const spacerRating = Math.min(10, Math.max(2, totalSpacers * 2));

  // Defensive Integrity tier (Below Average, Average, Elite)
  const premiumRimProtectors = selectedFreeAgents.filter(fa => fa.id === "fa-myles-turner").length +
                               selectedProspects.filter(p => p.id === "prospect-khaman-maluach").length;

  const wingSnipers = activeCurrentPlayers.filter(p => p.id === "ausar-thompson").length +
                      selectedFreeAgents.filter(fa => fa.id === "fa-derrick-jones").length +
                      selectedProspects.filter(p => p.id === "prospect-ace-bailey").length;

  let defenseTier = "Below Average ⚠";
  let defenseColor = "text-red-400";
  if (premiumRimProtectors > 0 && wingSnipers >= 2) {
    defenseTier = "Championship Elite (A+)";
    defenseColor = "text-emerald-400";
  } else if (premiumRimProtectors > 0 || wingSnipers >= 1) {
    defenseTier = "League Average (B)";
    defenseColor = "text-blue-400";
  }

  // 3. THE DYNAMIC NEED CHECKLIST CALCULATOR
  const needsChecklist = {
    perimeterShooting: totalSpacers >= 3,
    rimProtection: premiumRimProtectors > 0 || activeCurrentPlayers.some(p => p.id === "jalen-duren" && !excludedPlayerIds.includes("jalen-duren")),
    vetLeadership: (
      activeCurrentPlayers.filter(p => p.age >= 30).length + 
      selectedFreeAgents.filter(f => f.age >= 30).length
    ) >= 2,
    secondaryPlaymaking: (
      activeCurrentPlayers.some(p => p.id === "jaden-ivey") ||
      selectedProspects.some(p => p.primaryBenefit === "playmaking") ||
      selectedFreeAgents.some(fa => fa.primaryBenefit === "veteran_experience" || fa.primaryBenefit === "playmaking")
    ),
    wingDefense: wingSnipers >= 1
  };

  return (
    <div id="roster-simulator-container" className="flex-1 overflow-y-auto bg-slate-900 p-4 lg:p-8 pb-32 lg:pb-8 text-slate-100">
      
      {/* Title */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Wrench className="w-7 h-7 md:w-8 md:h-8 text-red-500 animate-spin-slow" />
            <span>Roster Simulator Sandbox</span>
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
            Sign Free Agents, Lock Prospects, and toggle current players off-roster to see real-time updates of team analytics.
          </p>
        </div>

        <button
          onClick={onResetSimulation}
          className="self-start xl:self-auto px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-red-505 text-red-500 hover:text-red-400 transition-all cursor-pointer"
        >
          Reset Simulation
        </button>
      </div>

      {/* Simulator Metrics Dashboard Card Block */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* Cap Space Card */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 h-1.5 w-full bg-emerald-500" />
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Simulated Cap Space</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-black font-mono ${remainingCapSpace < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
              {remainingCapSpace < 0 ? "" : "$"}{remainingCapSpace}M
            </span>
            <span className="text-xs text-slate-500">remaining</span>
          </div>
          {remainingCapSpace < 0 ? (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-red-500 font-semibold bg-red-500/10 p-2 rounded-lg border border-red-500/10">
              <BadgeAlert className="w-4 h-4 shrink-0" />
              <span>Hard Cap Exceeded!</span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 mt-3 font-medium">Starting pool: $36.5M</p>
          )}
        </div>

        {/* Projected Scoring Capacity */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 h-1.5 w-full bg-blue-500" />
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Core Projected PPG</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-blue-400 font-mono">{projectedSquadScoring}</span>
            <span className="text-xs text-slate-500">PPG (Top 5)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-medium">Calculated off highest 5 scoring options</p>
        </div>

        {/* Spacing Quotient */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 h-1.5 w-full bg-purple-500" />
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Floor Spacing Grade</span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-black text-purple-400 font-mono">{spacerRating}/10</span>
            <span className="text-xs text-slate-500">Gravity Rating</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${spacerRating * 10}%` }} />
          </div>
        </div>

        {/* Defensive Tier Card */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 h-1.5 w-full bg-red-500" />
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Team Defense Level</span>
          <div className="mt-2.5">
            <p className={`text-lg font-black tracking-tight ${defenseColor}`}>
              {defenseTier}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 mt-3.5 leading-relaxed">
            Requires at least 1 elite rim defender & 2 lock wings.
          </p>
        </div>
      </div>

      {/* Main Sandbox Grid Split Panel */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left 8 Columns: Active Squad Controls */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Section 1: Proposed Drafts & Signings */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div 
              onClick={() => setIsAdditionsExpanded(!isAdditionsExpanded)}
              className="flex items-center justify-between cursor-pointer select-none group"
            >
              <h3 className="text-md font-black text-white tracking-tight flex items-center justify-between w-full">
                <span className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-red-500" />
                  <span>Simulated Additions ({selectedProspects.length + selectedFreeAgents.length})</span>
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono uppercase group-hover:text-slate-400 whitespace-nowrap">
                  {isAdditionsExpanded ? "Collapse" : "Expand"}
                </span>
                <ChevronDown className={`w-4.5 h-4.5 text-slate-400 group-hover:text-white transition-transform duration-200 shrink-0 ${isAdditionsExpanded ? "rotate-180" : ""}`} />
              </div>
            </div>

            {!isAdditionsExpanded ? (
              <div className="mt-4 pt-4 border-t border-slate-900 flex flex-wrap gap-2">
                {selectedProspects.map(p => (
                  <span key={p.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/10 text-blue-400 text-xs font-mono font-bold border border-blue-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {p.name} (Draft)
                  </span>
                ))}
                {selectedFreeAgents.map(f => (
                  <span key={f.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-600/10 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {f.name} (${f.projectedSalary}M)
                  </span>
                ))}
                {selectedProspects.length === 0 && selectedFreeAgents.length === 0 && (
                  <span className="text-xs text-slate-500 font-mono">No active additions</span>
                )}
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-slate-900">
                {selectedProspects.length === 0 && selectedFreeAgents.length === 0 ? (
                  <div className="text-center py-12 bg-slate-900/40 rounded-xl border-2 border-dashed border-slate-800 text-slate-500">
                    <p className="text-sm font-semibold mb-1">No proposed acquisitions yet.</p>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto mt-2 leading-relaxed">
                      Go to <span className="text-blue-400 font-bold">Draft Board</span> or <span className="text-emerald-400 font-bold">Free Agency Pool</span> to draft and sign elite players into this simulator squad.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {/* Render simulated prospects */}
                      {selectedProspects.map((prospect) => (
                        <motion.div
                          key={prospect.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          className="bg-blue-950/20 border border-blue-500/35 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 font-extrabold text-xs border border-blue-500/20 shrink-0">
                              DRAFT
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-white text-sm truncate">{prospect.name}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Prospect • {prospect.position} • Scouting Sc: {prospect.scoutingGrade}
                                <span className="text-[10px] text-slate-500 block font-mono mt-1 leading-relaxed">
                                  Proj DARKO: <strong className="text-blue-400">{prospect.darko !== undefined ? (prospect.darko > 0 ? `+${prospect.darko}` : prospect.darko) : "—"}</strong> • 
                                  Proj LEBRON: <strong className="text-pink-400">{prospect.lebron !== undefined ? (prospect.lebron > 0 ? `+${prospect.lebron}` : prospect.lebron) : "—"}</strong> • 
                                  Proj EPM: <strong className="text-emerald-400">{prospect.epm !== undefined ? (prospect.epm > 0 ? `+${prospect.epm}` : prospect.epm) : "—"}</strong>
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-900/50">
                            <span className="px-2.5 py-1 bg-blue-600/10 text-blue-400 text-[10px] font-bold border border-blue-500/15 rounded">
                              {prospect.projectedRange}
                            </span>
                            <button
                              onClick={() => onRemoveProspect(prospect.id)}
                              className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                              title="Release from simulation"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}

                      {/* Render simulated Free Agents */}
                      {selectedFreeAgents.map((fa) => (
                        <motion.div
                          key={fa.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          className="bg-emerald-950/20 border border-emerald-500/35 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-extrabold text-xs border border-emerald-500/20 shrink-0">
                              DEAL
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-white text-sm truncate">{fa.name}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">
                                FA • {fa.position} • Current: {fa.currentTeam}
                                <span className="text-[10px] text-slate-500 block font-mono mt-1 leading-relaxed">
                                  DARKO: <strong className="text-blue-400">{fa.darko !== undefined ? (fa.darko > 0 ? `+${fa.darko}` : fa.darko) : "—"}</strong> • 
                                  LEBRON: <strong className="text-pink-400">{fa.lebron !== undefined ? (fa.lebron > 0 ? `+${fa.lebron}` : fa.lebron) : "—"}</strong> • 
                                  EPM: <strong className="text-emerald-400">{fa.epm !== undefined ? (fa.epm > 0 ? `+${fa.epm}` : fa.epm) : "—"}</strong>
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-900/50">
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              ${fa.projectedSalary}M/yr
                            </span>
                            <button
                              onClick={() => onRemoveFreeAgent(fa.id)}
                              className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                              title="Release from simulation"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Current Team Core Breakdown & Waives */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div 
              onClick={() => setIsRosterExpanded(!isRosterExpanded)}
              className="flex items-center justify-between cursor-pointer select-none group"
            >
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-md font-black text-white tracking-tight flex items-center justify-between w-full">
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-red-500" />
                    <span>Active Current Core ({activeCurrentPlayers.length})</span>
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono uppercase group-hover:text-slate-400 whitespace-nowrap">
                  {isRosterExpanded ? "Collapse" : "Expand"}
                </span>
                <ChevronDown className={`w-4.5 h-4.5 text-slate-400 group-hover:text-white transition-transform duration-200 shrink-0 ${isRosterExpanded ? "rotate-180" : ""}`} />
              </div>
            </div>

            {!isRosterExpanded ? (
              <div className="mt-4 pt-4 border-t border-slate-900 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Current Roster: <strong className="text-slate-200">{activeCurrentPlayers.length} Active / {currentRosterData.length} Total</strong></span>
                  {excludedPlayerIds.length > 0 && (
                    <span className="text-red-400 font-semibold">{excludedPlayerIds.length} Waived</span>
                  )}
                </div>
                {excludedPlayerIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentRosterData.filter(p => excludedPlayerIds.includes(p.id)).map(p => (
                      <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-mono font-bold border border-red-500/20">
                        {p.name} (Waived)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-slate-900">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-6">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300">Exclude Players from calculation</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Waive or bench current Pistons players to clear rotation positions or evaluate pure developmental roster lineups.
                    </p>
                  </div>
                  <div className="text-[10px] bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-500 font-mono shrink-0">
                    TOTAL PLAYERS: {totalSimulatedPlayersCount}
                  </div>
                </div>

                {/* List of current roster, allowing dynamic toggles to exclude */}
                <div className="grid gap-3">
                  {currentRosterData.map((player) => {
                    const isExcluded = excludedPlayerIds.includes(player.id);

                    return (
                      <div
                        key={player.id}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all duration-200 ${
                          isExcluded
                            ? "bg-slate-900/20 border-slate-900 opacity-40 grayscale"
                            : "bg-slate-900/60 border-slate-800 hover:border-slate-700/80"
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center border shrink-0 ${
                            isExcluded 
                              ? "bg-slate-950 border-slate-900 text-slate-600" 
                              : "bg-blue-600/15 border-blue-500/20 text-blue-400"
                          }`}>
                            {player.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-100 truncate">{player.name}</span>
                              <span className="px-1.5 py-0.5 bg-slate-950 text-[10px] text-slate-400 border border-slate-900 rounded font-mono shrink-0">
                                {player.position}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 font-sans leading-relaxed">
                              PPG: {player.ppg} • RPG: {player.rpg} • APG: {player.apg} • Impact: {player.impactGrade}
                              <span className="text-[10px] text-slate-500 block font-mono mt-0.5 leading-relaxed">
                                DARKO: <strong className="text-blue-400">{player.darko !== undefined ? (player.darko > 0 ? `+${player.darko}` : player.darko) : "—"}</strong> • 
                                LEBRON: <strong className="text-pink-400">{player.lebron !== undefined ? (player.lebron > 0 ? `+${player.lebron}` : player.lebron) : "—"}</strong> • 
                                EPM: <strong className="text-emerald-400">{player.epm !== undefined ? (player.epm > 0 ? `+${player.epm}` : player.epm) : "—"}</strong>
                              </span>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => onTogglePlayerExclude(player.id)}
                          className={`w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-center shrink-0 ${
                            isExcluded
                              ? "bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20"
                              : "bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/10"
                          }`}
                        >
                          {isExcluded ? "Activate Player" : "Simulate Waive"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Columns: Dynamic Needs Checklist Panel */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="border-b border-slate-900 pb-4 mb-4">
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-500" />
                <span>Roster Needs Checklist</span>
              </h3>
              <p className="text-slate-400 text-[11px] mt-1 leading-normal">
                Detroit is currently in developmental rebuilding phase. Acquire players from draft or signings to meet these critical basketball profiles.
              </p>
            </div>

            <div className="space-y-4">
              {/* Need 1: Perimeter Shooting */}
              <div className="flex items-start gap-3">
                <div className={`p-1 mt-0.5 rounded-full border transition-colors ${
                  needsChecklist.perimeterShooting 
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  <Check className={`w-4 h-4 transition-transform ${needsChecklist.perimeterShooting ? 'scale-100' : 'scale-0'}`} />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${needsChecklist.perimeterShooting ? 'text-slate-200' : 'text-slate-400'}`}>
                    Perimeter Floor Spacing
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                    Target: At least 3 high-volume three point spacer gravity assets on the active simulation roster.
                  </p>
                  <span className={`text-[10px] font-mono mt-1 inline-block ${needsChecklist.perimeterShooting ? 'text-emerald-400' : 'text-red-400'}`}>
                    {needsChecklist.perimeterShooting ? "Status: FULLY MET" : "Needs: 3PT Spacing Target"}
                  </span>
                </div>
              </div>

              {/* Spacer */}
              <div className="h-px bg-slate-900" />

              {/* Need 2: Rim Protection */}
              <div className="flex items-start gap-3">
                <div className={`p-1 mt-0.5 rounded-full border transition-colors ${
                  needsChecklist.rimProtection 
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  <Check className={`w-4 h-4 transition-transform ${needsChecklist.rimProtection ? 'scale-100' : 'scale-0'}`} />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${needsChecklist.rimProtection ? 'text-slate-200' : 'text-slate-400'}`}>
                    Elite Rim Protection
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                    Target: Require active Jalen Duren, or draft Maluach, or sign Myles Turner to reinforce backline presence.
                  </p>
                  <span className={`text-[10px] font-mono mt-1 inline-block ${needsChecklist.rimProtection ? 'text-emerald-400' : 'text-red-400'}`}>
                    {needsChecklist.rimProtection ? "Status: FULLY MET" : "Needs: Shot-Blocking Anchor"}
                  </span>
                </div>
              </div>

              {/* Spacer */}
              <div className="h-px bg-slate-900" />

              {/* Need 3: Vet Leadership */}
              <div className="flex items-start gap-3">
                <div className={`p-1 mt-0.5 rounded-full border transition-colors ${
                  needsChecklist.vetLeadership 
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  <Check className={`w-4 h-4 transition-transform ${needsChecklist.vetLeadership ? 'scale-100' : 'scale-0'}`} />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${needsChecklist.vetLeadership ? 'text-slate-200' : 'text-slate-400'}`}>
                    Veteran Locker Mentors
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                    Target: At least 2 players over age 30 with experience. Fits: Tobias Harris, Chris Paul, or T.J. McConnell.
                  </p>
                  <span className={`text-[10px] font-mono mt-1 inline-block ${needsChecklist.vetLeadership ? 'text-emerald-400' : 'text-red-400'}`}>
                    {needsChecklist.vetLeadership ? "Status: FULLY MET" : "Needs: 2+ Veteran Leaders"}
                  </span>
                </div>
              </div>

              {/* Spacer */}
              <div className="h-px bg-slate-900" />

              {/* Need 4: Secondary Playmaking */}
              <div className="flex items-start gap-3">
                <div className={`p-1 mt-0.5 rounded-full border transition-colors ${
                  needsChecklist.secondaryPlaymaking 
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  <Check className={`w-4 h-4 transition-transform ${needsChecklist.secondaryPlaymaking ? 'scale-100' : 'scale-0'}`} />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${needsChecklist.secondaryPlaymaking ? 'text-slate-200' : 'text-slate-400'}`}>
                    Secondary Ball Handlers
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                    Target: Relay Cade's playmaking strain. Fits: Keep Jaden Ivey, sign CP3/McConnell, or draft Traoré/Harper.
                  </p>
                  <span className={`text-[10px] font-mono mt-1 inline-block ${needsChecklist.secondaryPlaymaking ? 'text-emerald-400' : 'text-red-400'}`}>
                    {needsChecklist.secondaryPlaymaking ? "Status: FULLY MET" : "Needs: High-Assists Secondary Handler"}
                  </span>
                </div>
              </div>

              {/* Spacer */}
              <div className="h-px bg-slate-900" />

              {/* Need 5: Wing Defense */}
              <div className="flex items-start gap-3">
                <div className={`p-1 mt-0.5 rounded-full border transition-colors ${
                  needsChecklist.wingDefense 
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  <Check className={`w-4 h-4 transition-transform ${needsChecklist.wingDefense ? 'scale-100' : 'scale-0'}`} />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${needsChecklist.wingDefense ? 'text-slate-200' : 'text-slate-400'}`}>
                    Perimeter Wing Lockdown
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                    Target: Lock-down elite perimeter speeds. Keep Ausar Thompson active, draft Bailey, or sign Derrick Jones Jr.
                  </p>
                  <span className={`text-[10px] font-mono mt-1 inline-block ${needsChecklist.wingDefense ? 'text-emerald-400' : 'text-red-400'}`}>
                    {needsChecklist.wingDefense ? "Status: FULLY MET" : "Needs: Elite Defensive Wing"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tips helper */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-slate-400 text-xs space-y-2 leading-relaxed">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold font-mono text-[10px] uppercase tracking-wider">
              <Info className="w-4 h-4 text-blue-500 hover:text-blue-400" />
              <span>Architect Recommendations</span>
            </div>
            <p>
              To achieve maximum team scores:
            </p>
            <ul className="space-y-1.5 list-disc pl-4 text-slate-400 text-[11px]">
              <li>Sign <strong className="text-slate-300">Myles Turner</strong> for instant Rim Protection & high gravity pick-and-pop spacing.</li>
              <li>Draft <strong className="text-slate-300">Ace Bailey</strong> or <strong className="text-slate-300">Dylan Harper</strong> to inject elite wing scoring or playmaking complementary options.</li>
              <li>Toggle off lower efficiency shooters in the active squad to maximize the team's floor spacing score.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
