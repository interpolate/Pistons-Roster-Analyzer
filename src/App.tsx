import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import RosterView from "./components/RosterView";
import DraftBoardView from "./components/DraftBoardView";
import FreeAgencyView from "./components/FreeAgencyView";
import RosterSimulator from "./components/RosterSimulator";
import AIStrategyChat from "./components/AIStrategyChat";

import { currentRosterData, upcomingDraftPicks, draftProspectsData, freeAgentsData } from "./data";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("roster");

  // Roster Simulator State Management
  const [excludedPlayerIds, setExcludedPlayerIds] = useState<string[]>([]);
  const [addedProspectIds, setAddedProspectIds] = useState<string[]>([]);
  const [addedFreeAgentIds, setAddedFreeAgentIds] = useState<string[]>([]);

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
  };

  // Counting proposed additions for sidebar badge helper
  const simulatedCount = addedProspectIds.length + addedFreeAgentIds.length;

  // View Router Dispatcher
  const renderActiveView = () => {
    switch (activeTab) {
      case "roster":
        return <RosterView roster={currentRosterData} />;
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
            onTogglePlayerExclude={handleTogglePlayerExclude}
            onAddProspect={handleAddProspect}
            onRemoveProspect={handleRemoveProspect}
            onAddFreeAgent={handleAddFreeAgent}
            onRemoveFreeAgent={handleRemoveFreeAgent}
            onResetSimulation={handleResetSimulation}
          />
        );
      default:
        return <RosterView roster={currentRosterData} />;
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
      />
    </div>
  );
}
