import React, { useState, useEffect } from "react";
import { DraftPick, DraftProspect } from "../types";
import { MapPin, Eye, GraduationCap, ChevronRight, HelpCircle, CornerDownRight, PlusCircle, CheckCircle2, ChevronDown } from "lucide-react";

interface DraftBoardViewProps {
  picks: DraftPick[];
  prospects: DraftProspect[];
  addedProspectIds: string[];
  onDraftProspect: (id: string) => void;
  onRemoveProspect: (id: string) => void;
  onNavigateToSimulator: () => void;
}

export default function DraftBoardView({
  picks,
  prospects,
  addedProspectIds,
  onDraftProspect,
  onRemoveProspect,
  onNavigateToSimulator
}: DraftBoardViewProps) {
  const [selectedProspect, setSelectedProspect] = useState<DraftProspect | null>(null);
  const [isInventoryExpanded, setIsInventoryExpanded] = useState(true);

  // Auto-collapse draft picks list on mobile/tablet to save space
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsInventoryExpanded(false);
    }
  }, []);

  return (
    <div id="draft-board-container" className="flex-1 overflow-y-auto bg-slate-900 p-4 lg:p-8 pb-32 lg:pb-8 text-slate-100">
      
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Draft Board & Assets</h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
            Build your future. Track Detroit's upcoming assets and match with elite scouting prospects.
          </p>
        </div>
        
        <div className="text-xs text-slate-500 font-mono bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 self-start lg:self-auto shrink-0">
          PROLETARIAN SCOUTS: ONLINE
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left column: Upcoming Picks Inventory */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div 
              onClick={() => setIsInventoryExpanded(!isInventoryExpanded)}
              className="flex items-center justify-between cursor-pointer select-none group"
            >
              <h3 className="text-md font-bold text-white tracking-tight flex items-center justify-between w-full">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 114 0v2m-4 0h4m-4 0H5" />
                  </svg>
                  <span>Draft Assets Inventory ({picks.length})</span>
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono uppercase group-hover:text-slate-400 whitespace-nowrap">
                  {isInventoryExpanded ? "Collapse" : "Expand"}
                </span>
                <ChevronDown className={`w-4.5 h-4.5 text-slate-400 group-hover:text-white transition-transform duration-200 shrink-0 ${isInventoryExpanded ? "rotate-180" : ""}`} />
              </div>
            </div>

            {!isInventoryExpanded ? (
              <div className="mt-4 pt-4 border-t border-slate-900 flex flex-wrap gap-2">
                {picks.map((pick) => (
                  <span key={pick.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/10 text-blue-400 text-xs font-mono font-bold border border-blue-500/20">
                    {pick.year} {pick.round === 1 ? "1st" : "2nd"} Rd ({pick.originalOwner})
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-slate-900">
                <p className="text-slate-400 text-xs leading-relaxed mb-4">
                  The Detroit Pistons hold critical future draft capital that can be traded or used to add cost-controlled elite young prospects to support the Cade Cunningham core.
                </p>

                <div className="space-y-3.5">
                  {picks.map((pick) => (
                    <div
                      key={pick.id}
                      id={`pick-card-${pick.id}`}
                      className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-red-500">
                          {pick.year} DRAFT ASSET
                        </span>
                        <span className="px-2.5 py-0.5 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-md font-mono text-xs font-bold">
                          Round {pick.round}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200 text-sm">
                          {pick.year} Pick - {pick.round === 1 ? "1st Round" : "2nd Round"} Pick ({pick.originalOwner})
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal font-sans">
                          {pick.notes}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center / Right column: Prospects Listing */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-red-500" />
              <span>Realistic Elite Draft Prospects</span>
            </h3>
            
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Click on a prospect card for detailed fit analytics and strengths. Simulate drafting them by clicking "Draft into Sandbox" to calculate impact on team needs.
            </p>

            <div className="space-y-4">
              {prospects.map((prospect) => {
                const isDrafted = addedProspectIds.includes(prospect.id);
                
                return (
                  <div
                    key={prospect.id}
                    id={`prospect-card-${prospect.id}`}
                    className={`p-5 rounded-2xl border transition-all duration-200 ${
                      isDrafted
                        ? "bg-blue-950/20 border-blue-500/50 shadow-md shadow-blue-500/5"
                        : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Bio info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                            {prospect.name}
                          </h4>
                          <span className="px-2 py-0.5 bg-slate-900 text-slate-400 text-[10px] font-mono border border-slate-800 rounded-sm">
                            {prospect.position}
                          </span>
                          <span className="px-2 py-0.5 bg-red-600/10 text-red-400 font-bold text-[10px] border border-red-500/10 rounded-sm font-mono">
                            {prospect.projectedRange}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 font-mono">
                          <span>{prospect.collegeOrTeam}</span>
                          <span>•</span>
                          <span>{prospect.height}</span>
                          <span>•</span>
                          <span>Age {prospect.age}</span>
                        </div>

                        {/* Projection brief */}
                        <div className="grid grid-cols-3 gap-2 max-w-xs mt-3.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-900">
                          <div className="text-center">
                            <span className="text-[9px] text-slate-500 block uppercase font-mono">Proj PPG</span>
                            <span className="text-sm font-bold text-slate-200">{prospect.projectedPpg}</span>
                          </div>
                          <div className="text-center border-l border-slate-900">
                            <span className="text-[9px] text-slate-500 block uppercase font-mono">Proj RPG</span>
                            <span className="text-sm font-bold text-slate-200">{prospect.projectedRpg}</span>
                          </div>
                          <div className="text-center border-l border-slate-900">
                            <span className="text-[9px] text-slate-500 block uppercase font-mono">Proj APG</span>
                            <span className="text-sm font-bold text-slate-200">{prospect.projectedApg}</span>
                          </div>
                        </div>

                        {/* Projected Advanced stats */}
                        <div className="grid grid-cols-3 gap-2 max-w-xs mt-2 bg-slate-950/45 p-2 rounded-xl border border-dashed border-slate-800/80">
                          <div className="text-center">
                            <span className="text-[8px] text-blue-400 block font-mono uppercase font-black">Proj DARKO</span>
                            <span className="text-xs font-bold text-blue-300 font-mono">
                              {prospect.darko !== undefined ? (prospect.darko > 0 ? `+${prospect.darko.toFixed(1)}` : prospect.darko.toFixed(1)) : "—"}
                            </span>
                          </div>
                          <div className="text-center border-l border-slate-900/60">
                            <span className="text-[8px] text-pink-400 block font-mono uppercase font-black">Proj LEBRON</span>
                            <span className="text-xs font-bold text-pink-300 font-mono">
                              {prospect.lebron !== undefined ? (prospect.lebron > 0 ? `+${prospect.lebron.toFixed(1)}` : prospect.lebron.toFixed(1)) : "—"}
                            </span>
                          </div>
                          <div className="text-center border-l border-slate-900/60">
                            <span className="text-[8px] text-emerald-400 block font-mono uppercase font-black">Proj EPM</span>
                            <span className="text-xs font-bold text-emerald-300 font-mono">
                              {prospect.epm !== undefined ? (prospect.epm > 0 ? `+${prospect.epm.toFixed(1)}` : prospect.epm.toFixed(1)) : "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Grades & Interactive CTA */}
                      <div className="flex flex-col md:items-end justify-between gap-3">
                        <div className="text-left md:text-right bg-slate-950/80 px-4.5 py-2 rounded-xl border border-slate-900">
                          <span className="text-[9px] text-slate-500 block font-mono uppercase tracking-widest">Scouting Score</span>
                          <span className="text-base font-black text-emerald-400">{prospect.scoutingGrade}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedProspect(prospect)}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Details</span>
                          </button>

                          {isDrafted ? (
                            <button
                              onClick={() => onRemoveProspect(prospect.id)}
                              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Release</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                onDraftProspect(prospect.id);
                                onNavigateToSimulator();
                              }}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/10"
                            >
                              <PlusCircle className="w-4 h-4" />
                              <span>Draft into Simulator</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Scout Prospect Modal */}
      {selectedProspect && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div
            id="prospect-scout-modal"
            className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative"
          >
            <div className="h-2 bg-gradient-to-r from-blue-600 to-red-600" />
            
            <button
              onClick={() => setSelectedProspect(null)}
              className="absolute top-5 right-5 p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6 md:p-8">
              <div className="border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl font-black text-sm">
                    {selectedProspect.position}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white">{selectedProspect.name}</h3>
                    <p className="text-slate-400 text-xs mt-1 font-mono">
                      {selectedProspect.collegeOrTeam} • {selectedProspect.height} • Projected: {selectedProspect.projectedRange}
                    </p>
                  </div>
                </div>
              </div>

              {/* Projected Advanced Analytics Block */}
              <div className="bg-slate-905 border border-slate-800/80 rounded-2xl p-4 mt-5">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-2.5 text-center font-bold">Projected Advanced Impact Analytics</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                    <span className="text-[8px] uppercase font-mono text-blue-400 block font-black">Proj. DARKO DPM</span>
                    <span className="text-base font-mono font-black text-white mt-1 block">
                      {selectedProspect.darko !== undefined ? (selectedProspect.darko > 0 ? `+${selectedProspect.darko.toFixed(1)}` : selectedProspect.darko.toFixed(1)) : "—"}
                    </span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                    <span className="text-[8px] uppercase font-mono text-pink-400 block font-black">Proj. LEBRON</span>
                    <span className="text-base font-mono font-black text-white mt-1 block">
                      {selectedProspect.lebron !== undefined ? (selectedProspect.lebron > 0 ? `+${selectedProspect.lebron.toFixed(1)}` : selectedProspect.lebron.toFixed(1)) : "—"}
                    </span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                    <span className="text-[8px] uppercase font-mono text-emerald-400 block font-black">Proj. EPM Rating</span>
                    <span className="text-base font-mono font-black text-white mt-1 block">
                      {selectedProspect.epm !== undefined ? (selectedProspect.epm > 0 ? `+${selectedProspect.epm.toFixed(1)}` : selectedProspect.epm.toFixed(1)) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scouting Strengths / Weaknesses */}
              <div className="grid md:grid-cols-2 gap-4 my-6">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block mb-2">Primary Strengths</span>
                  <ul className="space-y-1.5">
                    {selectedProspect.strengths.map((str, i) => (
                      <li key={i} className="text-xs text-slate-200 flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-red-400 font-bold block mb-2">Developmental Areas</span>
                  <ul className="space-y-1.5">
                    {selectedProspect.weaknesses.map((wk, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                        <span className="text-red-400 font-black">•</span>
                        <span>{wk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* In-depth fit analysis */}
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
                <span className="text-xs uppercase font-mono text-amber-500 font-bold block mb-2">Fit with Current Pistons Strategy</span>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {selectedProspect.fitAnalysis}
                </p>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedProspect(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  Close Scout Drawer
                </button>
                
                {addedProspectIds.includes(selectedProspect.id) ? (
                  <button
                    onClick={() => {
                      onRemoveProspect(selectedProspect.id);
                      setSelectedProspect(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Release from Simulated Squad
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onDraftProspect(selectedProspect.id);
                      setSelectedProspect(null);
                      onNavigateToSimulator();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Draft into Simulated Squad
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
