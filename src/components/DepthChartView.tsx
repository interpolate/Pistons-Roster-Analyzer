import React, { useState, useMemo } from "react";
import { Player, DraftProspect, FreeAgent } from "../types";
import { currentRosterData, draftProspectsData, freeAgentsData } from "../data";
import { 
  Users, 
  Sparkles, 
  HelpCircle, 
  UserPlus, 
  X, 
  AlertTriangle, 
  Trophy, 
  Activity, 
  Zap, 
  TrendingUp, 
  UserCheck 
} from "lucide-react";

interface DepthChartViewProps {
  excludedPlayerIds: string[];
  addedProspectIds: string[];
  addedFreeAgentIds: string[];
  tradedAwayPlayerIds: string[];
  acquiredPlayers: any[];
}

export default function DepthChartView({
  excludedPlayerIds,
  addedProspectIds,
  addedFreeAgentIds,
  tradedAwayPlayerIds = [],
  acquiredPlayers = [],
}: DepthChartViewProps) {
  
  // 1. DYNAMICALLY COMPILE UNIFIED ROSTER FROM SANDBOX STATE
  const availableRoster = useMemo(() => {
    // Current players still on roster
    const basePistons = currentRosterData.filter(
      (p) => !excludedPlayerIds.includes(p.id) && !tradedAwayPlayerIds.includes(p.id)
    );

    // Mapped Draft picks
    const draftedPlayers = draftProspectsData
      .filter((d) => addedProspectIds.includes(d.id))
      .map((d) => ({
        id: d.id,
        name: d.name,
        number: "DRFT",
        position: d.position,
        age: d.age,
        height: d.height,
        weight: "205 lbs",
        experience: "Rookie",
        ppg: d.projectedPpg,
        rpg: d.projectedRpg,
        apg: d.projectedApg,
        per: 13.5,
        ts: 54.0,
        impactGrade: d.scoutingGrade.includes("Elite") ? "B+" : "B-",
        strengths: d.strengths,
        weaknesses: d.weaknesses,
        analysis: d.fitAnalysis,
        howToOptimize: "Deploy in perimeter spacing or slashing scenarios.",
        salary: "$5.4M",
        darko: d.darko || 0.1,
        lebron: d.lebron || 0.1,
        epm: d.epm || 0.2,
      }));

    // Mapped Free agents
    const signedFreeAgents = freeAgentsData
      .filter((f) => addedFreeAgentIds.includes(f.id))
      .map((f) => ({
        id: f.id,
        name: f.name,
        number: "FA",
        position: f.position,
        age: f.age,
        height: "6'7\"",
        weight: "215 lbs",
        experience: f.tier,
        ppg: f.ppg,
        rpg: f.rpg,
        apg: f.apg,
        per: 14.8,
        ts: 56.5,
        impactGrade: (f.tier === "Max Target" ? "A-" : f.tier === "Premium Starter" ? "B+" : "B") as any,
        strengths: f.strengths,
        weaknesses: f.weaknesses,
        analysis: f.fitAnalysis,
        howToOptimize: "Anchor rotations and stretch defensive positioning.",
        salary: `$${f.projectedSalary.toFixed(1)}M`,
        darko: f.darko || 0.5,
        lebron: f.lebron || 0.4,
        epm: f.epm || 0.6,
      }));

    // Mapped custom traded players
    const trades = acquiredPlayers.map((ap) => ({
      ...ap,
      darko: ap.darko || (ap.epm ? +(ap.epm * 0.9).toFixed(1) : 0),
      lebron: ap.lebron || (ap.epm ? +(ap.epm * 0.85).toFixed(1) : 0),
      epm: ap.epm || 0,
    }));

    return [...basePistons, ...draftedPlayers, ...signedFreeAgents, ...trades];
  }, [excludedPlayerIds, addedProspectIds, addedFreeAgentIds, tradedAwayPlayerIds, acquiredPlayers]);

  // Starting Lineup State (assigned player IDs to each court spot)
  const [startingLineup, setStartingLineup] = useState<{
    PG: string;
    SG: string;
    SF: string;
    PF: string;
    C: string;
  }>({
    PG: "",
    SG: "",
    SF: "",
    PF: "",
    C: "",
  });

  const [activeSlotSelection, setActiveSlotSelection] = useState<"PG" | "SG" | "SF" | "PF" | "C" | null>(null);

  // Helper: Retrieve player by ID from compiled roster
  const getPlayer = (id: string): Player | undefined => {
    return availableRoster.find((p) => p.id === id);
  };

  const currentPG = getPlayer(startingLineup.PG);
  const currentSG = getPlayer(startingLineup.SG);
  const currentSF = getPlayer(startingLineup.SF);
  const currentPF = getPlayer(startingLineup.PF);
  const currentC = getPlayer(startingLineup.C);

  const activeLineupPlayers = [currentPG, currentSG, currentSF, currentPF, currentC].filter(Boolean) as Player[];

  // 2. SPORTS SCIENCE METRICS CALCULATION
  const lineupMetrics = useMemo(() => {
    if (activeLineupPlayers.length === 0) {
      return {
        ppg: 0,
        rpg: 0,
        apg: 0,
        avgAge: 0,
        combinedEpm: 0,
        spacingGrade: "D-",
        defensiveRating: 112.5,
        netRating: -5.0,
      };
    }

    const totalPPG = activeLineupPlayers.reduce((sum, p) => sum + p.ppg, 0);
    const totalRPG = activeLineupPlayers.reduce((sum, p) => sum + p.rpg, 0);
    const totalAPG = activeLineupPlayers.reduce((sum, p) => sum + p.apg, 0);
    const totalAge = activeLineupPlayers.reduce((sum, p) => sum + p.age, 0);
    const totalEpm = activeLineupPlayers.reduce((sum, p) => sum + (p.epm || 0), 0);

    const avgAge = totalAge / activeLineupPlayers.length;
    const combinedEpm = totalEpm;

    // Custom spacing calculation based on EPM, True Shooting and positions of starting shooters
    const eliteShooters = activeLineupPlayers.filter(p => p.ts >= 57.0 || p.strengths.some(s => s.toLowerCase().includes("shoot") || s.toLowerCase().includes("spacing"))).length;
    
    let spacingGrade = "C";
    if (eliteShooters >= 4) spacingGrade = "A+";
    else if (eliteShooters === 3) spacingGrade = "A-";
    else if (eliteShooters === 2) spacingGrade = "B-";
    else if (eliteShooters === 1) spacingGrade = "C-";
    else spacingGrade = "D+";

    // Defensive Rating (lower is better, base of 110.0 adjusted by player metrics)
    // Positive defensive EPM values lower (improve) defensive rating
    const defContribution = activeLineupPlayers.reduce((sum, p) => {
      let contrib = 0;
      if (p.epm && p.epm > 0) contrib += p.epm * 1.5;
      if (p.strengths.some(s => s.toLowerCase().includes("def") || s.toLowerCase().includes("protect") || s.toLowerCase().includes("lockdown"))) contrib += 1.8;
      if (p.weaknesses.some(w => w.toLowerCase().includes("def") || w.toLowerCase().includes("foul"))) contrib -= 1.2;
      return sum + contrib;
    }, 0);

    const defensiveRating = +(112.0 - defContribution).toFixed(1);

    // Net Rating
    const netRating = +(combinedEpm * 4.5 + (eliteShooters * 2.5) - (defensiveRating - 108.0)).toFixed(1);

    return {
      ppg: +totalPPG.toFixed(1),
      rpg: +totalRPG.toFixed(1),
      apg: +totalAPG.toFixed(1),
      avgAge: +avgAge.toFixed(1),
      combinedEpm: +combinedEpm.toFixed(2),
      spacingGrade,
      defensiveRating,
      netRating,
    };
  }, [activeLineupPlayers]);

  // Slot Assignment Handler
  const handleAssignPlayer = (slot: "PG" | "SG" | "SF" | "PF" | "C", playerId: string) => {
    setStartingLineup((prev) => {
      const next = { ...prev };
      
      // If player is already assigned somewhere else, clear that spot first to avoid cloning
      Object.keys(next).forEach((k) => {
        const key = k as keyof typeof next;
        if (next[key] === playerId) {
          next[key] = "";
        }
      });

      next[slot] = playerId;
      return next;
    });
    setActiveSlotSelection(null);
  };

  const handleClearSlot = (slot: "PG" | "SG" | "SF" | "PF" | "C") => {
    setStartingLineup((prev) => ({
      ...prev,
      [slot]: "",
    }));
  };

  const handleClearAll = () => {
    setStartingLineup({
      PG: "",
      SG: "",
      SF: "",
      PF: "",
      C: "",
    });
    setActiveSlotSelection(null);
  };

  // 3. AUTOMATED STRATEGIC PRESETS DISPATCHER
  const handleApplyPreset = (presetType: "youth" | "spacing" | "defense" | "optimized") => {
    if (availableRoster.length === 0) return;

    if (presetType === "optimized") {
      // AI Optimized: Find highest EPM for each traditional position
      const pgs = [...availableRoster].filter(p => p.position === "PG" || p.position.includes("G")).sort((a,b) => (b.epm || 0) - (a.epm || 0));
      const sgs = [...availableRoster].filter(p => p.position === "SG" || p.position.includes("G")).sort((a,b) => (b.epm || 0) - (a.epm || 0));
      const sfs = [...availableRoster].filter(p => p.position === "SF" || p.position.includes("F")).sort((a,b) => (b.epm || 0) - (a.epm || 0));
      const pfs = [...availableRoster].filter(p => p.position === "PF" || p.position.includes("F")).sort((a,b) => (b.epm || 0) - (a.epm || 0));
      const cs = [...availableRoster].filter(p => p.position === "C").sort((a,b) => (b.epm || 0) - (a.epm || 0));

      const assignedIds: string[] = [];

      const selectBest = (list: Player[]) => {
        const found = list.find(p => !assignedIds.includes(p.id));
        if (found) {
          assignedIds.push(found.id);
          return found.id;
        }
        return "";
      };

      const pgId = selectBest(pgs);
      const sgId = selectBest(sgs);
      const sfId = selectBest(sfs);
      const pfId = selectBest(pfs);
      const cId = selectBest(cs);

      setStartingLineup({
        PG: pgId,
        SG: sgId,
        SF: sfId,
        PF: pfId,
        C: cId,
      });
    } else if (presetType === "spacing") {
      // Ultimate Spacing: Order players by True Shooting or shooting strengths
      const sortedBySpacing = [...availableRoster].sort((a, b) => {
        const aShooting = a.strengths.some(s => s.toLowerCase().includes("shoot") || s.toLowerCase().includes("spacing")) ? 3 : 0;
        const bShooting = b.strengths.some(s => s.toLowerCase().includes("shoot") || s.toLowerCase().includes("spacing")) ? 3 : 0;
        return (b.ts + bShooting) - (a.ts + aShooting);
      });

      // Simple positional match
      const pg = sortedBySpacing.find(p => p.position === "PG" || p.position.includes("G"))?.id || "";
      const sg = sortedBySpacing.find(p => p.id !== pg && (p.position === "SG" || p.position.includes("G")))?.id || "";
      const sf = sortedBySpacing.find(p => p.id !== pg && p.id !== sg && (p.position === "SF" || p.position.includes("F")))?.id || "";
      const pf = sortedBySpacing.find(p => p.id !== pg && p.id !== sg && p.id !== sf && (p.position === "PF" || p.position.includes("F")))?.id || "";
      const c = sortedBySpacing.find(p => p.id !== pg && p.id !== sg && p.id !== sf && p.id !== pf && p.position === "C")?.id || "";

      setStartingLineup({ PG: pg, SG: sg, SF: sf, PF: pf, C: c });
    } else if (presetType === "defense") {
      // Lockdown defensive rating alignment
      const sortedByDefense = [...availableRoster].sort((a, b) => {
        const aDef = a.strengths.some(s => s.toLowerCase().includes("def") || s.toLowerCase().includes("protect") || s.toLowerCase().includes("lockdown")) ? 2 : 0;
        const bDef = b.strengths.some(s => s.toLowerCase().includes("def") || s.toLowerCase().includes("protect") || s.toLowerCase().includes("lockdown")) ? 2 : 0;
        return (bDef + (b.epm || 0)) - (aDef + (a.epm || 0));
      });

      const pg = sortedByDefense.find(p => p.position === "PG" || p.position.includes("G"))?.id || "";
      const sg = sortedByDefense.find(p => p.id !== pg && (p.position === "SG" || p.position.includes("G")))?.id || "";
      const sf = sortedByDefense.find(p => p.id !== pg && p.id !== sg && (p.position === "SF" || p.position.includes("F")))?.id || "";
      const pf = sortedByDefense.find(p => p.id !== pg && p.id !== sg && p.id !== sf && (p.position === "PF" || p.position.includes("F")))?.id || "";
      const c = sortedByDefense.find(p => p.id !== pg && p.id !== sg && p.id !== sf && p.id !== pf && p.position === "C")?.id || "";

      setStartingLineup({ PG: pg, SG: sg, SF: sf, PF: pf, C: c });
    } else if (presetType === "youth") {
      // Sort youngest first
      const sortedByAge = [...availableRoster].sort((a, b) => a.age - b.age);

      const pg = sortedByAge.find(p => p.position === "PG" || p.position.includes("G"))?.id || "";
      const sg = sortedByAge.find(p => p.id !== pg && (p.position === "SG" || p.position.includes("G")))?.id || "";
      const sf = sortedByAge.find(p => p.id !== pg && p.id !== sg && (p.position === "SF" || p.position.includes("F")))?.id || "";
      const pf = sortedByAge.find(p => p.id !== pg && p.id !== sg && p.id !== sf && (p.position === "PF" || p.position.includes("F")))?.id || "";
      const c = sortedByAge.find(p => p.id !== pg && p.id !== sg && p.id !== sf && p.id !== pf && p.position === "C")?.id || "";

      setStartingLineup({ PG: pg, SG: sg, SF: sf, PF: pf, C: c });
    }
    setActiveSlotSelection(null);
  };

  return (
    <div id="depth-chart-container" className="flex-1 overflow-y-auto bg-slate-900 p-4 lg:p-8 pb-32 lg:pb-8 text-slate-100">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-500 animate-pulse" />
            <span>Pistons Depth Chart</span>
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
            Assign starting positions from your simulated roster, analyze spacing alignment, and test net efficiency ratings.
          </p>
        </div>

        {/* Toolbar Preset Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
          <button
            onClick={() => handleApplyPreset("optimized")}
            className="px-3.5 py-1.5 bg-blue-600/25 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-bold rounded-xl border border-blue-500/30 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Optimized</span>
          </button>
          <button
            onClick={() => handleApplyPreset("spacing")}
            className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition-all active:scale-95 cursor-pointer"
          >
            🎯 Max Spacing
          </button>
          <button
            onClick={() => handleApplyPreset("defense")}
            className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition-all active:scale-95 cursor-pointer"
          >
            🔒 Lockdown Def
          </button>
          <button
            onClick={() => handleApplyPreset("youth")}
            className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition-all active:scale-95 cursor-pointer"
          >
            ⚡ Youth Movement
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/25 text-red-400 text-xs font-extrabold rounded-xl border border-red-500/20 transition-all active:scale-95 cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* LEFT COLUMN: Visual Basketball Court (8 cols on desktop) */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden flex flex-col items-center">
            
            {/* Visual Header Grid for Court Title */}
            <div className="w-full flex justify-between items-center border-b border-slate-900 pb-4 mb-6">
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Interactive Court Sandbox</span>
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-400">LINEUP COMPLETE: {activeLineupPlayers.length}/5</span>
              </div>
            </div>

            {/* Basketball Court Canvas Wrapper */}
            <div className="relative w-full aspect-[4/3] max-w-[580px] bg-radial from-slate-900/40 to-slate-950 border-2 border-slate-800/80 rounded-2xl flex items-center justify-center overflow-hidden">
              
              {/* Traditional Court Lines */}
              <div className="absolute top-0 w-full h-px bg-slate-800" />
              {/* Three Point Arc */}
              <div className="absolute -top-10 w-[72%] aspect-square rounded-full border border-slate-800/50" />
              {/* Standard Key/Paint Box */}
              <div className="absolute top-0 w-[30%] h-[38%] border-x border-b border-slate-800/80 bg-slate-900/20" />
              {/* Free throw circle */}
              <div className="absolute top-[26%] w-[18%] aspect-square rounded-full border border-slate-800/80" />
              {/* Restricted Area semi-circle */}
              <div className="absolute top-0 w-[12%] aspect-square rounded-full border border-slate-800/20 border-t-0" />
              {/* Mid-court Center line */}
              <div className="absolute bottom-0 w-full h-px border-t border-slate-800/30" />

              {/* COURT NODES GRID */}
              
              {/* PG (Point Guard Slot - Top Center) */}
              <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <CourtNode 
                  positionLabel="PG" 
                  assignedPlayer={currentPG} 
                  isSelected={activeSlotSelection === "PG"}
                  onClick={() => setActiveSlotSelection("PG")}
                  onClear={() => handleClearSlot("PG")}
                />
              </div>

              {/* SG (Shooting Guard Slot - Left Wing) */}
              <div className="absolute top-[35%] left-[22%] -translate-x-1/2 -translate-y-1/2 z-10">
                <CourtNode 
                  positionLabel="SG" 
                  assignedPlayer={currentSG} 
                  isSelected={activeSlotSelection === "SG"}
                  onClick={() => setActiveSlotSelection("SG")}
                  onClear={() => handleClearSlot("SG")}
                />
              </div>

              {/* SF (Small Forward Slot - Right Wing) */}
              <div className="absolute top-[35%] left-[78%] -translate-x-1/2 -translate-y-1/2 z-10">
                <CourtNode 
                  positionLabel="SF" 
                  assignedPlayer={currentSF} 
                  isSelected={activeSlotSelection === "SF"}
                  onClick={() => setActiveSlotSelection("SF")}
                  onClear={() => handleClearSlot("SF")}
                />
              </div>

              {/* PF (Power Forward Slot - Mid Paint Right) */}
              <div className="absolute top-[20%] left-[62%] -translate-x-1/2 -translate-y-1/2 z-10">
                <CourtNode 
                  positionLabel="PF" 
                  assignedPlayer={currentPF} 
                  isSelected={activeSlotSelection === "PF"}
                  onClick={() => setActiveSlotSelection("PF")}
                  onClear={() => handleClearSlot("PF")}
                />
              </div>

              {/* C (Center Slot - Low Paint Center) */}
              <div className="absolute top-[10%] left-[38%] -translate-x-1/2 -translate-y-1/2 z-10">
                <CourtNode 
                  positionLabel="C" 
                  assignedPlayer={currentC} 
                  isSelected={activeSlotSelection === "C"}
                  onClick={() => setActiveSlotSelection("C")}
                  onClear={() => handleClearSlot("C")}
                />
              </div>
            </div>

            {/* Dynamic Slot Selection Modal/Panel */}
            {activeSlotSelection && (
              <div className="mt-6 w-full max-w-[580px] bg-slate-900 border border-slate-800 rounded-2xl p-4.5 animate-fade-in relative z-20">
                <div className="flex items-center justify-between mb-3.5 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-extrabold text-white">Assign player to Point Slot: {activeSlotSelection}</span>
                  </div>
                  <button 
                    onClick={() => setActiveSlotSelection(null)} 
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Available matching list */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[180px] overflow-y-auto pr-1">
                  {availableRoster.map((player) => {
                    const isAlreadyAssigned = Object.values(startingLineup).includes(player.id);
                    const matchesPos = player.position.includes(activeSlotSelection);
                    
                    return (
                      <button
                        key={player.id}
                        onClick={() => handleAssignPlayer(activeSlotSelection, player.id)}
                        className={`p-2 rounded-xl text-left border flex flex-col justify-between cursor-pointer transition-all ${
                          isAlreadyAssigned
                            ? "bg-slate-950/60 border-slate-800/80 opacity-50 text-slate-500"
                            : matchesPos 
                              ? "bg-blue-600/10 hover:bg-blue-600/25 border-blue-500/20 text-slate-100" 
                              : "bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold block truncate max-w-[80%]">{player.name}</span>
                          <span className="text-[9px] font-mono text-slate-400">{player.position}</span>
                        </div>
                        <div className="flex items-center justify-between w-full mt-1 border-t border-slate-900/40 pt-1 text-[10px] text-slate-400 font-mono">
                          <span>PPG: {player.ppg}</span>
                          <span className="text-emerald-400">EPM: {player.epm && player.epm > 0 ? `+${player.epm}` : player.epm}</span>
                        </div>
                      </button>
                    );
                  })}
                  {availableRoster.length === 0 && (
                    <p className="text-xs text-slate-500 text-center col-span-3 py-4">No roster players found. Try making changes in Roster Simulator first!</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Out of position check and alerts */}
          <PositionGapsAlert startingLineup={startingLineup} getPlayer={getPlayer} />
        </div>

        {/* RIGHT COLUMN: Performance Chemistry Dashboard & Synergy Stats (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl space-y-5">
            <h3 className="text-sm font-extrabold text-white tracking-wider uppercase border-b border-slate-900 pb-3 flex items-center justify-between">
              <span>Lineup Metrics</span>
              <Activity className="w-4 h-4 text-red-500 animate-pulse" />
            </h3>

            {/* Dynamic Chemistry Meter */}
            <div className="space-y-4">
              {/* Net Rating Widget */}
              <div className="p-4 bg-linear-to-br from-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all duration-300" />
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Projected Net Efficiency</span>
                <p className={`text-4xl font-black tracking-tighter mt-1 ${lineupMetrics.netRating >= 5 ? 'text-emerald-400' : lineupMetrics.netRating >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  {lineupMetrics.netRating > 0 ? `+${lineupMetrics.netRating}` : lineupMetrics.netRating}
                </p>
                <span className="text-[9px] text-slate-500 font-mono block mt-1">Estimating lineup offensive minus defensive net splits</span>
              </div>

              {/* Spacing & Defensive Ratings split */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-900 text-center">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">3PT Spacing Grade</span>
                  <span className="text-xl font-extrabold text-emerald-400 block mt-1">{lineupMetrics.spacingGrade}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-900 text-center">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">Defensive Rating</span>
                  <span className="text-xl font-extrabold text-blue-400 block mt-1">{lineupMetrics.defensiveRating}</span>
                </div>
              </div>

              {/* Scoring Splits & Volume Box */}
              <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-900 space-y-3">
                <p className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Starting 5 Projected Output</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 block">PPG</span>
                    <span className="text-base font-black text-slate-200">{lineupMetrics.ppg}</span>
                  </div>
                  <div className="border-l border-slate-800">
                    <span className="text-[9px] font-mono text-slate-500 block">RPG</span>
                    <span className="text-base font-black text-slate-200">{lineupMetrics.rpg}</span>
                  </div>
                  <div className="border-l border-slate-800">
                    <span className="text-[9px] font-mono text-slate-500 block">APG</span>
                    <span className="text-base font-black text-slate-200">{lineupMetrics.apg}</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-2.5 flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Average Lineup Age:</span>
                  <span className="text-white font-semibold">{lineupMetrics.avgAge} yrs</span>
                </div>
              </div>

              {/* Active Assigned Starting 5 List */}
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Starting Lineup Breakdown</p>
                
                {(["PG", "SG", "SF", "PF", "C"] as const).map((pos) => {
                  const player = getPlayer(startingLineup[pos]);
                  
                  return (
                    <div 
                      key={pos} 
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        player 
                          ? "bg-slate-900 border-slate-800" 
                          : "bg-slate-950/40 border-slate-900/80 border-dashed"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center font-bold text-[10px] text-blue-400 border border-slate-800 shrink-0">
                          {pos}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-100 truncate">
                            {player ? player.name : <span className="text-slate-500 italic font-medium">Empty spot</span>}
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono leading-none mt-0.5">
                            {player ? `${player.position} • Exp: ${player.experience}` : "Click court node to assign"}
                          </p>
                        </div>
                      </div>

                      {player && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 font-mono">{player.salary}</span>
                          <button
                            onClick={() => handleClearSlot(pos)}
                            className="p-1 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------- AUXILIARY COMPONENT NODES -------------------

interface CourtNodeProps {
  positionLabel: "PG" | "SG" | "SF" | "PF" | "C";
  assignedPlayer?: Player;
  isSelected: boolean;
  onClick: () => void;
  onClear: () => void;
}

function CourtNode({ positionLabel, assignedPlayer, isSelected, onClick, onClear }: CourtNodeProps) {
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={onClick}
        className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300 relative cursor-pointer group ${
          assignedPlayer
            ? "bg-linear-to-b from-blue-600 to-blue-700 border-2 border-red-500 text-white hover:scale-105 active:scale-95"
            : isSelected
              ? "bg-slate-900 border-2 border-blue-500 text-blue-400 scale-105"
              : "bg-slate-950/90 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-slate-200 hover:scale-102"
        }`}
      >
        <span className={`text-[10px] font-black uppercase tracking-wider ${assignedPlayer ? 'text-red-200' : 'text-slate-500'}`}>
          {positionLabel}
        </span>
        
        {assignedPlayer ? (
          <span className="text-[11px] font-black tracking-tight uppercase leading-tight truncate max-w-[90%] px-1 mt-0.5">
            {assignedPlayer.name.split(" ").slice(-1)[0]}
          </span>
        ) : (
          <UserPlus className="w-4 h-4 text-slate-600 group-hover:text-slate-400 mt-1" />
        )}

        {/* Action clear trigger */}
        {assignedPlayer && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-600 border border-white rounded-full text-white hover:bg-red-500 transition-colors shadow-md cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </button>
    </div>
  );
}

// ------------------- OUT-OF-POSITION CHECK ALERT BLOCK -------------------

interface GapsProps {
  startingLineup: { PG: string; SG: string; SF: string; PF: string; C: string };
  getPlayer: (id: string) => Player | undefined;
}

function PositionGapsAlert({ startingLineup, getPlayer }: GapsProps) {
  const gaps = useMemo(() => {
    const alerts: string[] = [];
    
    // Check out of position
    const pg = getPlayer(startingLineup.PG);
    const sg = getPlayer(startingLineup.SG);
    const sf = getPlayer(startingLineup.SF);
    const pf = getPlayer(startingLineup.PF);
    const c = getPlayer(startingLineup.C);

    if (pg && !pg.position.includes("G")) {
      alerts.push(`${pg.name} is a natural ${pg.position} assigned to the PG slot.`);
    }
    if (sg && !sg.position.includes("G") && !sg.position.includes("SF")) {
      alerts.push(`${sg.name} is a natural ${sg.position} assigned to the SG slot.`);
    }
    if (sf && !sf.position.includes("SF") && !sf.position.includes("G") && !sf.position.includes("PF")) {
      alerts.push(`${sf.name} is a natural ${sf.position} assigned to the SF slot.`);
    }
    if (pf && !pf.position.includes("PF") && !pf.position.includes("C") && !pf.position.includes("SF")) {
      alerts.push(`${pf.name} is a natural ${pf.position} assigned to the PF slot.`);
    }
    if (c && !c.position.includes("C") && !c.position.includes("PF")) {
      alerts.push(`${c.name} is a natural ${c.position} assigned to the Center slot.`);
    }

    // Check empty spots
    const emptySlots = (["PG", "SG", "SF", "PF", "C"] as const).filter(s => !startingLineup[s]);
    if (emptySlots.length > 0) {
      alerts.push(`Lineup is currently missing a starter at: ${emptySlots.join(", ")}.`);
    }

    return alerts;
  }, [startingLineup, getPlayer]);

  if (gaps.length === 0) {
    return (
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-xs text-emerald-400">
        <UserCheck className="w-4 h-4 shrink-0 text-emerald-500" />
        <span className="font-semibold">Starting lineup is perfectly aligned and CBA / rotation compliant!</span>
      </div>
    );
  }

  return (
    <div className="p-4.5 bg-slate-950 border border-slate-800 rounded-3xl space-y-2.5">
      <div className="flex items-center gap-2 text-amber-500">
        <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
        <span className="text-xs font-extrabold uppercase tracking-wider font-mono">Front Office Gaps & Rotation Warnings</span>
      </div>
      <div className="space-y-1 pl-6">
        {gaps.map((alert, i) => (
          <p key={i} className="text-xs text-slate-300 leading-relaxed list-item list-disc marker:text-amber-500">
            {alert}
          </p>
        ))}
      </div>
    </div>
  );
}
