import React, { useState, useEffect } from "react";
import { Player, DraftProspect, FreeAgent, TeamNeedsChecklist } from "../types";
import { currentRosterData, draftProspectsData, freeAgentsData } from "../data";
import { calculateLineupSynergy, getPlayerArchetypes } from "../utils/chemistry";
import { validateCBAPayroll, generateDynamicCapSheet, CBA_LIMITS } from "../utils/finance";
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
  tradedAwayPlayerIds?: string[];
  acquiredPlayers?: any[];
  
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
  tradedAwayPlayerIds = [],
  acquiredPlayers = [],
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
  const activeCurrentPlayers = currentRosterData.filter(p => !excludedPlayerIds.includes(p.id) && !tradedAwayPlayerIds.includes(p.id));
  const selectedProspects = draftProspectsData.filter(d => addedProspectIds.includes(d.id));
  const selectedFreeAgents = freeAgentsData.filter(f => addedFreeAgentIds.includes(f.id));
  const activeAcquiredPlayers = acquiredPlayers;

  const totalSimulatedPlayersCount = activeCurrentPlayers.length + selectedProspects.length + selectedFreeAgents.length + activeAcquiredPlayers.length;

  // CBA Financial & Cap Table Forecaster state
  const [optionsOverrides, setOptionsOverrides] = useState<{ [playerId: string]: { [year: string]: boolean } }>({});
  const [sandboxView, setSandboxView] = useState<"sandbox" | "cap_forecaster" | "cba_rules">("sandbox");

  const activePlayers = [
    ...activeCurrentPlayers,
    ...selectedProspects,
    ...selectedFreeAgents,
    ...activeAcquiredPlayers.map(ap => ({
      ...ap,
      primaryBenefit: ap.benefit || "shooting"
    }))
  ];

  // Run dynamic chemistry metrics engine
  const synergy = calculateLineupSynergy(activePlayers);

  // 1. DYNAMIC CBA FINANCIAL VALIDATIONS & CALCULATIONS
  const cbaStatus = validateCBAPayroll(activePlayers, selectedFreeAgents, selectedProspects, activeAcquiredPlayers, optionsOverrides);
  const capSheet = generateDynamicCapSheet(activePlayers, selectedFreeAgents, selectedProspects, activeAcquiredPlayers, optionsOverrides);

  const remainingCapSpace = cbaStatus.capSpace;
  const activePayroll = cbaStatus.payroll;

  // 2. SPORTS ANALYTICS METRICS IN SILICO
  // Projected Total score (Average of top 5 scorers on simulated squad)
  const allScoringRates = activePlayers.map(p => p.ppg || p.projectedPpg || 0).sort((a,b) => b-a);
  
  const topScorers = allScoringRates.slice(0, 5);
  const projectedSquadScoring = topScorers.length > 0 
    ? +(topScorers.reduce((sum, val) => sum + val, 0)).toFixed(1) 
    : 0.0;

  // Spacing Rating (1-10)
  const spacerRating = synergy.spacingRating;

  // Defensive Integrity tier (Below Average, Average, Elite)
  let defenseTier = "Below Average ⚠";
  let defenseColor = "text-red-400";
  if (synergy.defensiveRating <= 104.0) {
    defenseTier = `Championship Elite (Def: ${synergy.defensiveRating})`;
    defenseColor = "text-emerald-400";
  } else if (synergy.defensiveRating <= 109.5) {
    defenseTier = `League Average (Def: ${synergy.defensiveRating})`;
    defenseColor = "text-blue-400";
  } else {
    defenseTier = `Vulnerable Def (Def: ${synergy.defensiveRating}) ⚠`;
    defenseColor = "text-red-400";
  }

  // 3. THE DYNAMIC NEED CHECKLIST CALCULATOR
  const needsChecklist = {
    perimeterShooting: !synergy.alerts.some(a => a.id === "deficit-shooting"),
    rimProtection: !synergy.alerts.some(a => a.id === "deficit-rim"),
    vetLeadership: (
      activeCurrentPlayers.filter(p => p.age >= 30).length + 
      selectedFreeAgents.filter(f => f.age >= 30).length +
      activeAcquiredPlayers.filter(ap => ap.age >= 30).length
    ) >= 2,
    secondaryPlaymaking: !synergy.alerts.some(a => a.id === "deficit-secondary-playmaker"),
    wingDefense: !synergy.alerts.some(a => a.id === "deficit-poa")
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
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Simulated Active Payroll</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-black font-mono ${!cbaStatus.isLegal ? 'text-red-500' : 'text-emerald-400'}`}>
              ${activePayroll}M
            </span>
            <span className="text-xs text-slate-500">/ $155.1M Cap</span>
          </div>
          {!cbaStatus.isLegal ? (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-red-500 font-semibold bg-red-500/10 p-2 rounded-lg border border-red-500/10">
              <BadgeAlert className="w-4 h-4 shrink-0" />
              <span>CBA Cap Violations!</span>
            </div>
          ) : cbaStatus.capSpace > 0 ? (
            <p className="text-[11px] text-emerald-400 mt-3 font-semibold flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              ${cbaStatus.capSpace}M Cap Room remaining
            </p>
          ) : (
            <p className="text-[11px] text-amber-400 mt-3 font-semibold flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
              Above Cap ({cbaStatus.apronStatus})
            </p>
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

      {/* Dynamic Lineup Synergy & Advanced Analytics Insights Panel */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4 mb-5">
          <div>
            <h3 className="text-md font-extrabold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Lineup Synergy & Advanced Analytics Insights</span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Powered by simulated EPM, DARKO, and player synergy combinations.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Simulated Net Court Rating</span>
            <div className={`px-4 py-1.5 rounded-xl text-md font-black font-mono flex items-center gap-1.5 border ${
              synergy.netRating >= 0 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}>
              <span>{synergy.netRating >= 0 ? "Net: +" : "Net: "}{synergy.netRating}</span>
            </div>
          </div>
        </div>

        {/* Synergy list / alert box */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Column: Synergy Boosts & Penalties */}
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block mb-2.5">On-Court Synergy Dynamics</span>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {synergy.synergyBoosts.map((boost, idx) => (
                  <div key={`boost-${idx}`} className="flex items-start gap-2.5 p-2.5 bg-emerald-950/15 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                    <span>{boost}</span>
                  </div>
                ))}

                {synergy.synergyPenalties.map((penalty, idx) => (
                  <div key={`penalty-${idx}`} className="flex items-start gap-2.5 p-2.5 bg-red-950/15 border border-red-500/20 rounded-xl text-xs text-red-300">
                    <span className="text-red-400 font-bold shrink-0 mt-0.5">⚠</span>
                    <span>{penalty}</span>
                  </div>
                ))}

                {synergy.synergyBoosts.length === 0 && synergy.synergyPenalties.length === 0 && (
                  <p className="text-slate-500 text-xs italic py-4">No significant lineup synergies or penalties computed. Adjust your active roster to trigger boosts!</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Skill Deficiency Alerts */}
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block mb-2.5">AI GM Skill Deficiency Alerts</span>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {synergy.alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-xl border flex flex-col gap-1.5 text-xs ${
                    alert.severity === "critical"
                      ? "bg-red-950/10 border-red-500/20 text-red-200"
                      : "bg-amber-950/10 border-amber-500/20 text-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`w-4.5 h-4.5 shrink-0 ${alert.severity === "critical" ? "text-red-400" : "text-amber-400"}`} />
                    <span className="font-extrabold text-white">{alert.title}</span>
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      alert.severity === "critical" 
                        ? "bg-red-500/20 text-red-400 border border-red-500/20" 
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {alert.description}
                  </p>
                  <div className="text-[10px] bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-slate-300">
                    <strong className="text-slate-200 font-mono uppercase text-[9px] block mb-0.5">Suggested Action:</strong>
                    {alert.solution}
                  </div>
                </div>
              ))}

              {synergy.alerts.length === 0 && (
                <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 rounded-xl text-center text-emerald-400">
                  <Check className="w-5 h-5 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-white">Roster Fully Optimized!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">The AI GM flags no current skill deficits or vulnerabilities on this roster.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Tab Switcher */}
      <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800/85 mb-8 max-w-xl">
        <button
          onClick={() => setSandboxView("sandbox")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            sandboxView === "sandbox"
              ? "bg-red-600 text-white shadow-lg shadow-red-600/15"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Active Sandbox Controls</span>
        </button>
        <button
          onClick={() => setSandboxView("cap_forecaster")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            sandboxView === "cap_forecaster"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/15"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <CircleDollarSign className="w-4 h-4" />
          <span>Cap Table Forecaster</span>
        </button>
        <button
          onClick={() => setSandboxView("cba_rules")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            sandboxView === "cba_rules"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/15"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>CBA Rules & Aprons</span>
        </button>
      </div>

      {sandboxView === "sandbox" && (
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
                              {(() => {
                                const arch = getPlayerArchetypes(prospect);
                                return (
                                  <div className="flex gap-1.5 mt-2 flex-wrap">
                                    <span className="px-2 py-0.5 bg-slate-900/60 text-[9px] text-blue-400 border border-blue-900/30 rounded font-mono font-medium">
                                      Offense: {arch.offensive}
                                    </span>
                                    <span className="px-2 py-0.5 bg-slate-900/60 text-[9px] text-red-400 border border-red-900/30 rounded font-mono font-medium">
                                      Defense: {arch.defensive}
                                    </span>
                                  </div>
                                );
                              })()}
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
                              {(() => {
                                const arch = getPlayerArchetypes(fa);
                                return (
                                  <div className="flex gap-1.5 mt-2 flex-wrap">
                                    <span className="px-2 py-0.5 bg-slate-900/60 text-[9px] text-blue-400 border border-blue-900/30 rounded font-mono font-medium">
                                      Offense: {arch.offensive}
                                    </span>
                                    <span className="px-2 py-0.5 bg-slate-900/60 text-[9px] text-red-400 border border-red-900/30 rounded font-mono font-medium">
                                      Defense: {arch.defensive}
                                    </span>
                                  </div>
                                );
                              })()}
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

                      {/* Render simulated Trade-acquired Targets */}
                      {activeAcquiredPlayers.map((tr) => (
                        <motion.div
                          key={tr.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          className="bg-blue-950/25 border border-blue-550/35 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-450 text-blue-450 font-black text-[10px] border border-blue-500/30 shrink-0">
                              TRADE
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-white text-sm truncate">{tr.name}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Traded from {tr.originalTeam} • {tr.position} • Age: {tr.age}
                                <span className="text-[10px] text-slate-500 block font-mono mt-1 leading-relaxed">
                                  DARKO: <strong className="text-blue-400">{tr.darko !== undefined ? (tr.darko > 0 ? `+${tr.darko}` : tr.darko) : "—"}</strong> • 
                                  LEBRON: <strong className="text-pink-400">{tr.lebron !== undefined ? (tr.lebron > 0 ? `+${tr.lebron}` : tr.lebron) : "—"}</strong> • 
                                  EPM: <strong className="text-emerald-400">{tr.epm !== undefined ? (tr.epm > 0 ? `+${tr.epm}` : tr.epm) : "—"}</strong>
                                </span>
                              </p>
                              {(() => {
                                const arch = getPlayerArchetypes(tr as any);
                                return (
                                  <div className="flex gap-1.5 mt-2 flex-wrap">
                                    <span className="px-2 py-0.5 bg-slate-900/60 text-[9px] text-blue-400 border border-blue-900/30 rounded font-mono font-medium">
                                      Offense: {arch.offensive}
                                    </span>
                                    <span className="px-2 py-0.5 bg-slate-900/60 text-[9px] text-red-400 border border-red-900/30 rounded font-mono font-medium">
                                      Defense: {arch.defensive}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-900/50">
                            <span className="text-xs font-mono font-bold text-blue-400">
                              {tr.salary}
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
                              ACQUIRED
                            </div>
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
                  {(excludedPlayerIds.length > 0 || tradedAwayPlayerIds.length > 0) && (
                    <span className="text-red-400 font-semibold">
                      {excludedPlayerIds.length + tradedAwayPlayerIds.length} Inactive
                    </span>
                  )}
                </div>
                {(excludedPlayerIds.length > 0 || tradedAwayPlayerIds.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentRosterData.filter(p => excludedPlayerIds.includes(p.id)).map(p => (
                      <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-mono font-bold border border-red-500/20">
                        {p.name} (Waived)
                      </span>
                    ))}
                    {currentRosterData.filter(p => tradedAwayPlayerIds.includes(p.id)).map(p => (
                      <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono font-bold border border-blue-500/20">
                        {p.name} (Traded Out)
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
                    const isTraded = tradedAwayPlayerIds.includes(player.id);
                    const isInactive = isExcluded || isTraded;

                    return (
                      <div
                        key={player.id}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all duration-200 ${
                          isInactive
                            ? "bg-slate-900/10 border-slate-900 opacity-40 grayscale"
                            : "bg-slate-900/60 border-slate-800 hover:border-slate-700/80"
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center border shrink-0 ${
                            isInactive 
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
                              {isTraded && (
                                <span className="px-1.5 py-0.5 bg-blue-600/15 text-[9px] text-blue-400 border border-blue-500/20 rounded font-mono font-bold uppercase shrink-0">
                                  Traded Away
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 font-sans leading-relaxed">
                              PPG: {player.ppg} • RPG: {player.rpg} • APG: {player.apg} • Impact: {player.impactGrade}
                              <span className="text-[10px] text-slate-500 block font-mono mt-0.5 leading-relaxed">
                                DARKO: <strong className="text-blue-400">{player.darko !== undefined ? (player.darko > 0 ? `+${player.darko}` : player.darko) : "—"}</strong> • 
                                LEBRON: <strong className="text-pink-400">{player.lebron !== undefined ? (player.lebron > 0 ? `+${player.lebron}` : player.lebron) : "—"}</strong> • 
                                EPM: <strong className="text-emerald-400">{player.epm !== undefined ? (player.epm > 0 ? `+${player.epm}` : player.epm) : "—"}</strong>
                              </span>
                            </p>
                            {(() => {
                              const arch = getPlayerArchetypes(player);
                              return (
                                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 bg-slate-950 text-[9px] text-blue-400 border border-blue-900/40 rounded font-mono font-medium">
                                    Offense: {arch.offensive}
                                  </span>
                                  <span className="px-2 py-0.5 bg-slate-950 text-[9px] text-red-400 border border-red-900/40 rounded font-mono font-medium">
                                    Defense: {arch.defensive}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {isTraded ? (
                          <div className="bg-blue-600/10 text-blue-400 border border-blue-500/10 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 text-center select-none uppercase">
                            Traded Asset ⇄
                          </div>
                        ) : (
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
                        )}
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
      )}

      {sandboxView === "cap_forecaster" && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl animate-fade-in">
          <div className="border-b border-slate-900 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-blue-400" />
                <span>Pistons Cap Table Forecaster (Multi-Year)</span>
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Analyze contract structures, team/player options, qualifying offers, and dynamic payroll raises through 2030.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
              <span className="text-slate-500 font-bold">TOTAL PAYROLL:</span>
              <strong className="text-blue-400">${activePayroll}M</strong>
              <span className="text-slate-500">/</span>
              <span className="text-slate-500">CAP:</span>
              <strong className="text-slate-200">$155.1M</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4 text-right">2026-27</th>
                  <th className="py-3 px-4 text-right">2027-28</th>
                  <th className="py-3 px-4 text-right">2028-29</th>
                  <th className="py-3 px-4 text-right">2029-30</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-slate-300">
                {capSheet.map((row) => (
                  <tr key={row.playerId} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                      <span>{row.playerName}</span>
                      {row.isCustom && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded font-mono">
                          Simulated
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs font-mono text-slate-400">{row.position}</td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-white">
                      ${row.salaries["2026-27"] === 0 ? "—" : `${row.salaries["2026-27"]}M`}
                      <div className="text-[9px] text-slate-500 mt-0.5">{row.statuses["2026-27"]}</div>
                    </td>
                    
                    {/* 2027-28 */}
                    <td className="py-4 px-4 text-right font-mono">
                      {row.salaries["2027-28"] === 0 ? (
                        <span className="text-slate-600">—</span>
                      ) : (
                        <span className="font-bold text-slate-200">${row.salaries["2027-28"]}M</span>
                      )}
                      
                      <div className="mt-1 flex items-center justify-end gap-1 text-[9px]">
                        {row.statuses["2027-28"] === "Team Option" || row.statuses["2027-28"] === "Non-Guaranteed" ? (
                          <button
                            onClick={() => {
                              const currentVal = optionsOverrides[row.playerId]?.[ "2027-28" ] ?? true;
                              setOptionsOverrides({
                                ...optionsOverrides,
                                [row.playerId]: {
                                  ...(optionsOverrides[row.playerId] || {}),
                                  "2027-28": !currentVal
                                }
                              });
                            }}
                            className={`px-1.5 py-0.5 rounded transition-all font-semibold ${
                              (optionsOverrides[row.playerId]?.[ "2027-28" ] ?? true)
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                            }`}
                          >
                            {(optionsOverrides[row.playerId]?.[ "2027-28" ] ?? true) ? `✓ ${row.statuses["2027-28"]}` : "✗ Decline Option"}
                          </button>
                        ) : (
                          <span className="text-slate-500">{row.statuses["2027-28"]}</span>
                        )}
                      </div>
                    </td>

                    {/* 2028-29 */}
                    <td className="py-4 px-4 text-right font-mono">
                      {row.salaries["2028-29"] === 0 ? (
                        <span className="text-slate-600">—</span>
                      ) : (
                        <span className="font-bold text-slate-200">${row.salaries["2028-29"]}M</span>
                      )}
                      
                      <div className="mt-1 flex items-center justify-end gap-1 text-[9px]">
                        {row.statuses["2028-29"] === "Team Option" || row.statuses["2028-29"] === "Player Option" ? (
                          <button
                            onClick={() => {
                              const currentVal = optionsOverrides[row.playerId]?.[ "2028-29" ] ?? true;
                              setOptionsOverrides({
                                ...optionsOverrides,
                                [row.playerId]: {
                                  ...(optionsOverrides[row.playerId] || {}),
                                  "2028-29": !currentVal
                                }
                              });
                            }}
                            className={`px-1.5 py-0.5 rounded transition-all font-semibold ${
                              (optionsOverrides[row.playerId]?.[ "2028-29" ] ?? true)
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                            }`}
                          >
                            {(optionsOverrides[row.playerId]?.[ "2028-29" ] ?? true) ? `✓ ${row.statuses["2028-29"]}` : "✗ Decline Option"}
                          </button>
                        ) : (
                          <span className="text-slate-500">{row.statuses["2028-29"]}</span>
                        )}
                      </div>
                    </td>

                    {/* 2029-30 */}
                    <td className="py-4 px-4 text-right font-mono">
                      {row.salaries["2029-30"] === 0 ? (
                        <span className="text-slate-600">—</span>
                      ) : (
                        <span className="font-bold text-slate-200">${row.salaries["2029-30"]}M</span>
                      )}
                      
                      <div className="mt-1 flex items-center justify-end gap-1 text-[9px]">
                        {row.statuses["2029-30"] === "Team Option" ? (
                          <button
                            onClick={() => {
                              const currentVal = optionsOverrides[row.playerId]?.[ "2029-30" ] ?? true;
                              setOptionsOverrides({
                                ...optionsOverrides,
                                [row.playerId]: {
                                  ...(optionsOverrides[row.playerId] || {}),
                                  "2029-30": !currentVal
                                }
                              });
                            }}
                            className={`px-1.5 py-0.5 rounded transition-all font-semibold ${
                              (optionsOverrides[row.playerId]?.[ "2029-30" ] ?? true)
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                            }`}
                          >
                            {(optionsOverrides[row.playerId]?.[ "2029-30" ] ?? true) ? `✓ ${row.statuses["2029-30"]}` : "✗ Decline Option"}
                          </button>
                        ) : (
                          <span className="text-slate-500">{row.statuses["2029-30"]}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sandboxView === "cba_rules" && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl animate-fade-in space-y-8">
          {/* Header */}
          <div className="border-b border-slate-900 pb-4 mb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <span>NBA Collective Bargaining Agreement (CBA) Dashboard</span>
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Real-time audit of Detroit's payroll against hard luxury tax caps, aprons, and legal exceptions rules.
            </p>
          </div>

          {/* Visual Cap Apron Progress Meter */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline text-xs font-mono text-slate-400">
              <span>Active Payroll: <strong className="text-white">${activePayroll}M</strong></span>
              <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">{cbaStatus.apronStatus}</span>
            </div>
            
            {/* Multi-segmented meter bar */}
            <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden relative border border-slate-800 flex">
              {/* Under Cap Segment (up to $155.1M) */}
              <div 
                className="h-full bg-emerald-500/70" 
                style={{ width: `${Math.min(100, (activePayroll / 208.5) * 100 * (155.1 / 208.5))}%` }} 
              />
              {/* Above Cap to Tax Line ($155.1M to $188.4M) */}
              <div 
                className="h-full bg-yellow-500/70" 
                style={{ width: `${Math.max(0, Math.min(100, ((activePayroll - 155.1) / 208.5) * 100))}%` }} 
              />
              {/* First Apron Line ($188.4M to $195.9M) */}
              <div 
                className="h-full bg-orange-500/70" 
                style={{ width: `${Math.max(0, Math.min(100, ((activePayroll - 188.4) / 208.5) * 100))}%` }} 
              />
              {/* Above Second Apron ($195.9M+) */}
              <div 
                className="h-full bg-red-500/70" 
                style={{ width: `${Math.max(0, Math.min(100, ((activePayroll - 195.9) / 208.5) * 100))}%` }} 
              />

              {/* Pin indicator of active payroll */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                style={{ left: `${Math.min(100, (activePayroll / 208.5) * 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-mono text-slate-500">
              <div>
                <p className="font-bold text-slate-400">SALARY CAP</p>
                <p>$155.1M</p>
              </div>
              <div>
                <p className="font-bold text-slate-400">LUXURY TAX</p>
                <p>$188.4M</p>
              </div>
              <div>
                <p className="font-bold text-slate-400">FIRST APRON</p>
                <p>$195.9M</p>
              </div>
              <div>
                <p className="font-bold text-slate-400">SECOND APRON</p>
                <p>$208.5M</p>
              </div>
            </div>
          </div>

          {/* CBA Rules, Triggers & Exception Validators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Exceptions Checker */}
            <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Exceptions Eligibility Matrix</span>
              </h4>

              <div className="space-y-3.5 text-xs">
                {/* Non-Taxpayer Mid-Level Exception */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-200">Non-Taxpayer Mid-Level Exception (MLE)</p>
                    <p className="text-[11px] text-slate-500">Value: $14.1M. Hard-caps team at first apron if used.</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    activePayroll > 155.1 && activePayroll < 195.9
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-slate-900 text-slate-500 border border-slate-800"
                  }`}>
                    {activePayroll > 155.1 && activePayroll < 195.9 ? "ACTIVE" : "INELIGIBLE"}
                  </span>
                </div>

                {/* Room Mid-Level Exception */}
                <div className="flex items-start justify-between gap-3 border-t border-slate-900/60 pt-3">
                  <div>
                    <p className="font-bold text-slate-200">Room Mid-Level Exception (Room MLE)</p>
                    <p className="text-[11px] text-slate-500">Value: $8.4M. Available for below-cap teams to sign free agents.</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    activePayroll <= 155.1
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-slate-900 text-slate-500 border border-slate-800"
                  }`}>
                    {activePayroll <= 155.1 ? "ACTIVE" : "INELIGIBLE"}
                  </span>
                </div>

                {/* Bi-Annual Exception */}
                <div className="flex items-start justify-between gap-3 border-t border-slate-900/60 pt-3">
                  <div>
                    <p className="font-bold text-slate-200">Bi-Annual Exception (BAE)</p>
                    <p className="text-[11px] text-slate-500">Value: $5.0M. Triggers hard-cap at first apron.</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    activePayroll > 155.1 && activePayroll < 195.9 && !selectedFreeAgents.some(f => f.projectedSalary > 14.1)
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-slate-900 text-slate-500 border border-slate-800"
                  }`}>
                    {activePayroll > 155.1 && activePayroll < 195.9 ? "ACTIVE" : "INELIGIBLE"}
                  </span>
                </div>

                {/* Vet Minimum Exception */}
                <div className="flex items-start justify-between gap-3 border-t border-slate-900/60 pt-3">
                  <div>
                    <p className="font-bold text-slate-200">Veteran Minimum Contract Exception</p>
                    <p className="text-[11px] text-slate-500">Unlimited minimum contracts to complete roster slots.</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ALWAYS ON
                  </span>
                </div>
              </div>
            </div>

            {/* AI GM Strategic Advice Panel */}
            <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                  <Info className="w-4 h-4 text-purple-400" />
                  <span>AI GM Strategic Financial Advice</span>
                </h4>
                
                <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
                  {cbaStatus.capSpace > 0 ? (
                    <div>
                      <p className="font-bold text-white mb-1">✓ Capitalize on Cap Room</p>
                      <p className="text-[11px] text-slate-400">
                        Detroit sits comfortably under the Cap with <strong className="text-emerald-400">${cbaStatus.capSpace}M</strong>. You can offer any premier Free Agent up to this maximum amount directly without needing complex matching logic.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-white mb-1">⚠ Above Cap Operating Constraints</p>
                      <p className="text-[11px] text-slate-400">
                        Pistons are operating as an above-the-cap franchise. To sign Free Agents, you are restricted to using either your <strong className="text-purple-400">Mid-Level Exception (MLE)</strong> or standard Minimum Exception contracts. You cannot absorb unbalanced trade salary increases unless within the standard 125% matched window.
                      </p>
                    </div>
                  )}

                  {cbaStatus.apronStatus === "Above Second Apron" ? (
                    <div className="p-2.5 bg-red-950/25 border border-red-500/20 rounded-lg text-[11px] text-red-300">
                      <strong>SECOND APRON LOCK triggered:</strong> No MLE exceptions allowed, outgoing trade salary cannot be aggregated, and trade-matching decreases to strictly 100%. Relieve salaries to bypass!
                    </div>
                  ) : cbaStatus.apronStatus === "Above First Apron" ? (
                    <div className="p-2.5 bg-orange-950/25 border border-orange-500/20 rounded-lg text-[11px] text-orange-300">
                      <strong>FIRST APRON WARNING triggered:</strong> Hard cap in effect. Cannot sign-and-trade or receive player increases in trades. Maintain current roster count.
                    </div>
                  ) : (
                    <div className="p-2.5 bg-emerald-950/25 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-300">
                      <strong>Safe Operating Zone:</strong> Detroit stands beneath the Aprons, maintaining maximum trade leverage and exception allowances for blockbuster maneuvers.
                    </div>
                  )}
                </div>
              </div>

              {cbaStatus.warnings.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-950">
                  <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest block mb-1">CBA Audit Advisories:</span>
                  <div className="space-y-1">
                    {cbaStatus.warnings.slice(0, 2).map((w, i) => (
                      <p key={i} className="text-[10px] text-slate-400 leading-normal">• {w}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
