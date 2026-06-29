import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import RosterView from "./components/RosterView";
import DepthChartView from "./components/DepthChartView";
import FinanceForecasterView from "./components/FinanceForecasterView";
import DraftBoardView from "./components/DraftBoardView";
import FreeAgencyView from "./components/FreeAgencyView";
import RosterSimulator from "./components/RosterSimulator";
import TradeMachineView from "./components/TradeMachineView";
import AIStrategyChat from "./components/AIStrategyChat";

import { currentRosterData, upcomingDraftPicks, draftProspectsData, freeAgentsData } from "./data";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("roster");

  // Roster Simulator State Management
  const [excludedPlayerIds, setExcludedPlayerIds] = useState<string[]>([]);
  const [addedProspectIds, setAddedProspectIds] = useState<string[]>([]);
  const [addedFreeAgentIds, setAddedFreeAgentIds] = useState<string[]>([]);

  // Trade Machine State Management
  const [tradedAwayPlayerIds, setTradedAwayPlayerIds] = useState<string[]>([]);
  const [acquiredPlayers, setAcquiredPlayers] = useState<any[]>([]);
  const [completedTrades, setCompletedTrades] = useState<any[]>([]);

  // Simulation Handlers
  const handleTogglePlayerExclude = (id: string) => {
    setExcludedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleAddProspect = (id: string) => {
    if (!addedProspectIds.includes(id)) {
      setAddedProspectIds((prev) => [...prev, id]);
    }
  };

  const handleRemoveProspect = (id: string) => {
    setAddedProspectIds((prev) => prev.filter((pId) => pId !== id));
  };

  const handleAddFreeAgent = (id: string) => {
    if (!addedFreeAgentIds.includes(id)) {
      setAddedFreeAgentIds((prev) => [...prev, id]);
    }
  };

  const handleRemoveFreeAgent = (id: string) => {
    setAddedFreeAgentIds((prev) => prev.filter((faId) => faId !== id));
  };

  const handleResetSimulation = () => {
    setExcludedPlayerIds([]);
    setAddedProspectIds([]);
    setAddedFreeAgentIds([]);
    setTradedAwayPlayerIds([]);
    setAcquiredPlayers([]);
    setCompletedTrades([]);
  };

  // Trade Execute Triggers
  const handleExecuteTrade = (outgoingIds: string[], incomingTargets: any[]) => {
    // 1. Mark outgoing Pistons as traded
    setTradedAwayPlayerIds((prev) => {
      const updated = [...prev];
      outgoingIds.forEach((id) => {
        if (!updated.includes(id)) {
          updated.push(id);
        }
      });
      return updated;
    });

    // 2. Map incoming targets to standard Player structures
    const mappedAcquired = incomingTargets.map((t) => ({
      id: t.id,
      name: t.name,
      number: `#${t.number || "TRD"}`,
      position: t.position,
      age: t.age,
      height: "6'7\"",
      weight: "220 lbs",
      experience: "Pro",
      ppg: t.ppg,
      rpg: t.rpg,
      apg: t.apg,
      per: t.per,
      ts: t.ts,
      impactGrade: t.ppg > 20 ? "A" : t.ppg > 15 ? "B+" : "B-",
      strengths: t.strengths,
      weaknesses: ["Trade Integration Adjustment"],
      analysis: `${t.name} joined Detroit in a blockbuster custom trade sequence. He instantly patches crucial rotations.`,
      howToOptimize: `Incorporate into active halfcourt plays and prioritize driving routes.`,
      salary: `$${t.salary.toFixed(1)}M`,
      isAcquired: true,
      originalTeam: t.team,
      benefit: t.benefit,
      darko: t.epm > 0 ? +(t.epm * 0.9).toFixed(1) : +(t.epm * 1.1).toFixed(1),
      lebron: t.epm > 0 ? +(t.epm * 0.85).toFixed(1) : +(t.epm * 1.05).toFixed(1),
      epm: t.epm
    }));

    setAcquiredPlayers((prev) => {
      const existingIds = prev.map((p) => p.id);
      const newAdds = mappedAcquired.filter((p) => !existingIds.includes(p.id));
      return [...prev, ...newAdds];
    });

    // 3. Log trade transactions
    const outgoingSum = currentRosterData
      .filter((p) => outgoingIds.includes(p.id))
      .reduce((sum, p) => sum + parseFloat(p.salary.replace("$", "").replace("M", "")), 0);
    const incomingSum = incomingTargets.reduce((sum, t) => sum + t.salary, 0);
    const diff = incomingSum - outgoingSum;
    const netSalaryText = diff > 0 ? `+$${diff.toFixed(1)}M` : `-$${Math.abs(diff).toFixed(1)}M`;

    const nextTrade = {
      id: `trade-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      outgoingNames: currentRosterData.filter((p) => outgoingIds.includes(p.id)).map((p) => p.name),
      incomingNames: incomingTargets.map((p) => p.name),
      incomingTotalSalary: +incomingSum.toFixed(1),
      outgoingTotalSalary: +outgoingSum.toFixed(1),
      netSalaryText,
      rawOutgoingIds: outgoingIds,
      rawIncomingIds: incomingTargets.map((t) => t.id)
    };

    setCompletedTrades((prev) => [nextTrade, ...prev]);
  };

  const handleUndoTrade = (tradeId: string) => {
    const trade = completedTrades.find((t) => t.id === tradeId);
    if (!trade) return;

    setTradedAwayPlayerIds((prev) => prev.filter((id) => !trade.rawOutgoingIds.includes(id)));
    setAcquiredPlayers((prev) => prev.filter((p) => !trade.rawIncomingIds.includes(p.id)));
    setCompletedTrades((prev) => prev.filter((t) => t.id !== tradeId));
  };

  const handleResetTrades = () => {
    setTradedAwayPlayerIds([]);
    setAcquiredPlayers([]);
    setCompletedTrades([]);
  };

  const handleApplyScenario = (scenario: {
    releasingPlayerIds: string[];
    draftProspectIds: string[];
    freeAgentIds: string[];
  }) => {
    setExcludedPlayerIds(scenario.releasingPlayerIds || []);
    setAddedProspectIds(scenario.draftProspectIds || []);
    setAddedFreeAgentIds(scenario.freeAgentIds || []);
    // Navigate to Roster Simulator tab to instantly show the visual outcome
    setActiveTab("simulator");
  };

  // Counting proposed additions for sidebar badge helper
  const simulatedCount = addedProspectIds.length + addedFreeAgentIds.length;

  // View Router Dispatcher
  const renderActiveView = () => {
    switch (activeTab) {
      case "roster":
        return (
          <RosterView 
            roster={currentRosterData} 
            acquiredPlayers={acquiredPlayers}
            tradedAwayPlayerIds={tradedAwayPlayerIds}
          />
        );
      case "depth":
        return (
          <DepthChartView
            excludedPlayerIds={excludedPlayerIds}
            addedProspectIds={addedProspectIds}
            addedFreeAgentIds={addedFreeAgentIds}
            tradedAwayPlayerIds={tradedAwayPlayerIds}
            acquiredPlayers={acquiredPlayers}
          />
        );
      case "finance":
        return (
          <FinanceForecasterView
            excludedPlayerIds={excludedPlayerIds}
            addedProspectIds={addedProspectIds}
            addedFreeAgentIds={addedFreeAgentIds}
            tradedAwayPlayerIds={tradedAwayPlayerIds}
            acquiredPlayers={acquiredPlayers}
          />
        );
      case "draft":
        return (
          <DraftBoardView
            picks={upcomingDraftPicks}
            prospects={draftProspectsData}
            addedProspectIds={addedProspectIds}
            onDraftProspect={handleAddProspect}
            onRemoveProspect={handleRemoveProspect}
            onNavigateToSimulator={() => setActiveTab("simulator")}
          />
        );
      case "freeagency":
        return (
          <FreeAgencyView
            freeAgents={freeAgentsData}
            addedFreeAgentIds={addedFreeAgentIds}
            onSignFreeAgent={handleAddFreeAgent}
            onReleaseFreeAgent={handleRemoveFreeAgent}
            onNavigateToSimulator={() => setActiveTab("simulator")}
          />
        );
      case "simulator":
        return (
          <RosterSimulator
            excludedPlayerIds={excludedPlayerIds}
            addedProspectIds={addedProspectIds}
            addedFreeAgentIds={addedFreeAgentIds}
            tradedAwayPlayerIds={tradedAwayPlayerIds}
            acquiredPlayers={acquiredPlayers}
            onTogglePlayerExclude={handleTogglePlayerExclude}
            onAddProspect={handleAddProspect}
            onRemoveProspect={handleRemoveProspect}
            onAddFreeAgent={handleAddFreeAgent}
            onRemoveFreeAgent={handleRemoveFreeAgent}
            onResetSimulation={handleResetSimulation}
          />
        );
      case "trade": {
        const combinedExclusions = [...excludedPlayerIds, ...tradedAwayPlayerIds];
        return (
          <TradeMachineView
            roster={currentRosterData}
            excludedPlayerIds={combinedExclusions}
            onTogglePlayerExclude={handleTogglePlayerExclude}
            onExecuteTrade={handleExecuteTrade}
            completedTrades={completedTrades}
            onUndoTrade={handleUndoTrade}
            onResetTrades={handleResetTrades}
          />
        );
      }
      default:
        return (
          <RosterView 
            roster={currentRosterData} 
            acquiredPlayers={acquiredPlayers}
            tradedAwayPlayerIds={tradedAwayPlayerIds}
          />
        );
    }
  };

  return (
    <div id="app-root-container" className="flex h-screen w-screen bg-slate-950 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        simulatedCount={simulatedCount}
      />

      {/* Main View Area */}
      <main id="app-main-content" className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900 lg:border-l border-slate-800">
        
        {/* Mobile Header (iPhone Optimized) */}
        <div id="mobile-top-header" className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center border border-blue-600/60 shadow-lg shadow-red-500/10">
              <span className="text-white font-black text-[10px] tracking-tight">DET</span>
            </div>
            <div>
              <h1 className="text-white font-extrabold text-xs tracking-tight uppercase">Pistons Roster</h1>
              <p className="text-red-500 font-bold tracking-widest text-[9px] uppercase leading-none mt-0.5">Architect Pro</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg">
            <span className="text-[9px] font-mono font-bold text-slate-400">STATUS: LIVE</span>
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        {renderActiveView()}
      </main>

      {/* Gemini Strategy Chat Terminal overlay/drawer */}
      <AIStrategyChat
        excludedPlayerIds={excludedPlayerIds}
        addedProspectIds={addedProspectIds}
        addedFreeAgentIds={addedFreeAgentIds}
        onNavigateToTab={(tab) => setActiveTab(tab)}
        onApplyScenario={handleApplyScenario}
      />
    </div>
  );
}
