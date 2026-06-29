import React from "react";
import { Users, DraftingCompass, Briefcase, Zap, AlertCircle, Sparkles, ArrowLeftRight, LayoutGrid, Coins } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  simulatedCount: number;
}

export default function Sidebar({ activeTab, setActiveTab, simulatedCount }: SidebarProps) {
  const menuItems = [
    { id: "roster", name: "Current Roster", icon: Users, desc: "Pistons Active 2025-26 Squad" },
    { id: "depth", name: "Depth Chart", icon: LayoutGrid, desc: "Starting 5 Lineup Sandbox" },
    { id: "finance", name: "Cap Forecaster", icon: Coins, desc: "Multi-Year Salary Projections" },
    { id: "draft", name: "Draft Board", icon: DraftingCompass, desc: "Draft Picks & Scouting Reports" },
    { id: "freeagency", name: "Free Agency Pool", icon: Briefcase, desc: "Targets & Cap Space Impact" },
    { id: "trade", name: "Trade Machine", icon: ArrowLeftRight, desc: "CBA-Compliant Trade Machine" },
    { id: "simulator", name: "Roster Simulator", icon: Zap, desc: "Team Needs Sandbox Simulator" },
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <div id="app-sidebar" className="hidden lg:flex w-80 bg-slate-950 border-r border-slate-800 flex flex-col h-full shrink-0">
        {/* Team Header Brand */}
        <div className="p-6 border-b border-slate-800 bg-linear-to-b from-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            {/* Custom Stylised Pistons Badge */}
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center border-2 border-blue-600 shadow-md shadow-blue-500/20">
              <span className="text-white font-extrabold text-sm tracking-tighter">DET</span>
            </div>
            <div>
              <h1 className="text-white font-bold leading-none tracking-tight text-lg">ROSTER</h1>
              <p className="text-red-500 text-xs font-semibold tracking-widest mt-0.5 uppercase">ARCHITECT</p>
            </div>
          </div>
          <div className="mt-4 px-3 py-1.5 bg-slate-900/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">STATUS: ACTIVE</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        {/* Navigation Options */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-3 mb-2">
            Management Console
          </div>
          
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-left cursor-pointer group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10 border-l-4 border-red-500"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive ? "bg-blue-500/50" : "bg-slate-900 group-hover:bg-slate-800"
                }`}>
                  <IconComponent className="w-5 h-5 text-current" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm flex items-center justify-between">
                    <span>{item.name}</span>
                    {item.id === "simulator" && simulatedCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                        +{simulatedCount}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] truncate mt-0.5 ${isActive ? "text-blue-100" : "text-slate-500"}`}>
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Decorative Brand footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>Detroit Pistons</span>
          </div>
          <p className="text-[10px] text-slate-600 mt-1 font-mono">
            © 2026 Sports analytics system. Powered by AI Studio.
          </p>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (iPhone Optimized with Safe Area support) */}
      <div id="mobile-bottom-nav" className="lg:hidden fixed bottom-0 left-0 right-0 h-18 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 z-40 flex items-center justify-around px-2 pb-[calc(env(safe-area-inset-bottom,4px)+6px)] shadow-2xl bg-gradient-to-b from-slate-950/95 to-slate-950">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              id={`mobile-nav-btn-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 text-center relative cursor-pointer group transition-colors ${
                isActive ? "text-blue-400" : "text-slate-400 active:text-slate-200"
              }`}
            >
              <div className="relative">
                <IconComponent className="w-5.5 h-5.5 text-current transition-transform duration-250 group-active:scale-90" />
                {item.id === "simulator" && simulatedCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-black px-1 py-0.5 rounded-full leading-none animate-bounce">
                    {simulatedCount}
                  </span>
                )}
              </div>
              <span className="text-[8px] sm:text-[9px] font-bold mt-1 tracking-tight leading-none uppercase select-none font-mono">
                {item.id === "roster" ? "Squad" : item.id === "depth" ? "Depth" : item.id === "finance" ? "Cap" : item.id === "draft" ? "Drafts" : item.id === "freeagency" ? "Agents" : item.id === "trade" ? "Trades" : "Simulator"}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
