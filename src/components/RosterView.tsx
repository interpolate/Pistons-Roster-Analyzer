import React, { useState } from "react";
import { Player } from "../types";
import { Search, SlidersHorizontal, ArrowUpDown, X, Star, BarChart3, TrendingUp, AlertCircle, Wrench, Shield } from "lucide-react";

interface RosterViewProps {
  roster: Player[];
  acquiredPlayers?: Player[];
  tradedAwayPlayerIds?: string[];
  onOpenPlayerDetails?: (player: Player) => void;
}

export default function RosterView({ 
  roster, 
  acquiredPlayers = [], 
  tradedAwayPlayerIds = [], 
  onOpenPlayerDetails 
}: RosterViewProps) {
  const [search, setSearch] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<string>("All");
  const [sortBy, setSortBy] = useState<keyof Player | "">("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);

  // Compute a unified roster derived from simulated trades
  const combinedRoster = React.useMemo(() => {
    const pistonsBase = roster.filter(p => !tradedAwayPlayerIds.includes(p.id));
    return [...pistonsBase, ...acquiredPlayers];
  }, [roster, acquiredPlayers, tradedAwayPlayerIds]);

  // Filter positions
  const positions = ["All", "PG", "SG", "SF", "PF", "C"];

  const handleSort = (field: keyof Player) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const sortedAndFilteredPlayers = combinedRoster
    .filter((player) => {
      const matchesSearch = player.name.toLowerCase().includes(search.toLowerCase()) ||
                            player.position.toLowerCase().includes(search.toLowerCase());
      const matchesPosition = selectedPosition === "All" || player.position.includes(selectedPosition);
      return matchesSearch && matchesPosition;
    })
    .sort((a, b) => {
      if (!sortBy) return 0;
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });

  // Calculate some squad averages
  const avgPpg = (combinedRoster.reduce((sum, p) => sum + p.ppg, 0) / (combinedRoster.length || 1)).toFixed(1);
  const avgRpg = (combinedRoster.reduce((sum, p) => sum + p.rpg, 0) / (combinedRoster.length || 1)).toFixed(1);
  const avgApg = (combinedRoster.reduce((sum, p) => sum + p.apg, 0) / (combinedRoster.length || 1)).toFixed(1);
  const avgPer = (combinedRoster.reduce((sum, p) => sum + p.per, 0) / (combinedRoster.length || 1)).toFixed(1);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (grade.startsWith("B")) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (grade.startsWith("C")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  };

  return (
    <div id="roster-view-container" className="flex-1 overflow-y-auto bg-slate-900 p-4 lg:p-8 pb-32 lg:pb-8 text-slate-100">
      
      {/* Overview Head & Stats Widgets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Current Pistons Roster</h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
            Evaluate player efficiency rating, true shooting, impact tiers, and customize optimization parameters.
          </p>
        </div>

        {/* Quick averages dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-slate-950/80 p-3 sm:p-4 rounded-2xl border border-slate-800 shrink-0">
          <div className="px-2.5 py-1 text-center">
            <p className="text-[9px] text-slate-500 font-mono tracking-wider uppercase">PPG AVG</p>
            <p className="text-base sm:text-lg font-bold text-slate-100">{avgPpg}</p>
          </div>
          <div className="px-2.5 py-1 text-center border-l border-slate-800">
            <p className="text-[9px] text-slate-500 font-mono tracking-wider uppercase">RPG AVG</p>
            <p className="text-base sm:text-lg font-bold text-slate-100">{avgRpg}</p>
          </div>
          <div className="px-2.5 py-1 text-center border-l border-slate-850 sm:border-slate-800">
            <p className="text-[9px] text-slate-500 font-mono tracking-wider uppercase">APG AVG</p>
            <p className="text-base sm:text-lg font-bold text-slate-100">{avgApg}</p>
          </div>
          <div className="px-2.5 py-1 text-center border-l border-slate-800">
            <p className="text-[9px] text-slate-500 font-mono tracking-wider uppercase">PER AVG</p>
            <p className="text-base sm:text-lg font-bold text-red-500">{avgPer}</p>
          </div>
        </div>
      </div>

      {/* Interactive Toolbar Filter */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              id="player-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player name or position..."
              className="w-full bg-slate-900 pl-11 pr-4 py-2.5 rounded-xl border border-slate-800 text-sm focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-200 placeholder:text-slate-500"
            />
          </div>

          {/* Position Quick Selection Pills */}
          <div id="position-filter-pills" className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
            {positions.map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  selectedPosition === pos
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing {sortedAndFilteredPlayers.length} of {combinedRoster.length} Players
        </div>
      </div>

      {/* Mobile/Tablet Card Deck (Visible only on lg and down screens) */}
      <div id="roster-mobile-cards" className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4.5 mb-8">
        {sortedAndFilteredPlayers.map((player) => (
          <div
            key={player.id}
            onClick={() => {
              setActivePlayer(player);
              if (onOpenPlayerDetails) onOpenPlayerDetails(player);
            }}
            className="bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative flex flex-col justify-between cursor-pointer transition-all duration-200 active:scale-[0.98] group"
          >
            <div>
              {/* Header: Name, Position, Number */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 font-extrabold flex items-center justify-center shrink-0">
                    {player.number.replace("#", "")}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-white group-hover:text-blue-400 transition-colors truncate">
                      {player.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <span>{player.position}</span>
                      <span>•</span>
                      <span>Age {player.age}</span>
                    </p>
                  </div>
                </div>
                
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-bold shrink-0 ${getGradeColor(player.impactGrade)}`}>
                  {player.impactGrade}
                </span>
              </div>

              {/* Standard Stats Box */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-900 mb-3 text-center">
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-mono">PPG</span>
                  <span className="text-sm font-black text-slate-200">{player.ppg.toFixed(1)}</span>
                </div>
                <div className="border-l border-slate-900">
                  <span className="text-[9px] text-slate-500 block uppercase font-mono">RPG</span>
                  <span className="text-sm font-black text-slate-200">{player.rpg.toFixed(1)}</span>
                </div>
                <div className="border-l border-slate-900">
                  <span className="text-[9px] text-slate-500 block uppercase font-mono">APG</span>
                  <span className="text-sm font-black text-slate-200">{player.apg.toFixed(1)}</span>
                </div>
              </div>

              {/* Advanced Stats: DARKO, LEBRON, EPM */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900/40 p-2 rounded-xl border border-dashed border-slate-800/80 mb-4 text-center">
                <div>
                  <span className="text-[8px] text-blue-400 block font-mono uppercase font-black">DARKO</span>
                  <span className="text-xs font-bold text-blue-300 font-mono">
                    {player.darko !== undefined ? (player.darko > 0 ? `+${player.darko.toFixed(1)}` : player.darko.toFixed(1)) : "—"}
                  </span>
                </div>
                <div className="border-l border-slate-900/40">
                  <span className="text-[8px] text-pink-400 block font-mono uppercase font-black">LEBRON</span>
                  <span className="text-xs font-bold text-pink-300 font-mono">
                    {player.lebron !== undefined ? (player.lebron > 0 ? `+${player.lebron.toFixed(1)}` : player.lebron.toFixed(1)) : "—"}
                  </span>
                </div>
                <div className="border-l border-slate-900/40">
                  <span className="text-[8px] text-emerald-400 block font-mono uppercase font-black">EPM</span>
                  <span className="text-xs font-bold text-emerald-300 font-mono">
                    {player.epm !== undefined ? (player.epm > 0 ? `+${player.epm.toFixed(1)}` : player.epm.toFixed(1)) : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer: Salary and Action indicator */}
            <div className="flex items-center justify-between border-t border-slate-900 pt-3.5">
              <span className="text-xs text-slate-500 font-mono font-medium lowercase">
                salary: <span className="text-slate-300 font-semibold font-mono">{player.salary}</span>
              </span>
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1 group-hover:underline">
                <span>GM Analysis</span>
                <span>→</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Stats Grid Table (Visible on lg desktop and up) */}
      <div className="hidden lg:block bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table id="roster-data-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs font-mono uppercase">
                <th className="py-4 px-6 font-semibold">Player</th>
                <th className="py-4 px-4 text-center font-semibold">Pos</th>
                <th className="py-4 px-4 text-center font-semibold">Age</th>
                <th className="py-4 px-4 text-center font-semibold">Height</th>
                <th className="py-4 px-4 text-center font-semibold">
                  <button
                    onClick={() => handleSort("ppg")}
                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    PPG <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-4 px-4 text-center font-semibold">
                  <button
                    onClick={() => handleSort("rpg")}
                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    RPG <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-4 px-4 text-center font-semibold">
                  <button
                    onClick={() => handleSort("apg")}
                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    APG <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-4 px-4 text-center font-semibold">
                  <button
                    onClick={() => handleSort("per")}
                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    PER (Eff) <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-4 px-4 text-center font-semibold">
                  <button
                    onClick={() => handleSort("ts")}
                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    TS% <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-4 px-4 text-center font-semibold text-blue-400">
                  <button
                    onClick={() => handleSort("darko")}
                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    DARKO <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-4 px-4 text-center font-semibold text-pink-400">
                  <button
                    onClick={() => handleSort("lebron")}
                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    LEBRON <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-4 px-4 text-center font-semibold text-emerald-400">
                  <button
                    onClick={() => handleSort("epm")}
                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    EPM <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-4 px-6 text-center font-semibold">
                  <button
                    onClick={() => handleSort("impactGrade")}
                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    Impact <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-4 px-6 text-right font-semibold">Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedAndFilteredPlayers.map((player) => (
                <tr
                  key={player.id}
                  id={`roster-row-${player.id}`}
                  onClick={() => {
                    setActivePlayer(player);
                    if (onOpenPlayerDetails) onOpenPlayerDetails(player);
                  }}
                  className="hover:bg-slate-900/65 cursor-pointer transition-colors group"
                >
                  {/* Name and jersey info */}
                  <td className="py-4.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-600/15 flex items-center justify-center font-bold text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors border border-blue-500/20">
                        {player.number.replace("#", "")}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                          {player.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">Exp: {player.experience}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-300">
                      {player.position}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-sm font-mono text-slate-300">{player.age}</td>
                  <td className="py-4 px-4 text-center text-sm font-mono text-slate-300">{player.height}</td>
                  <td className="py-4 px-4 text-center font-bold text-sm text-slate-100">{player.ppg.toFixed(1)}</td>
                  <td className="py-4 px-4 text-center text-sm text-slate-300">{player.rpg.toFixed(1)}</td>
                  <td className="py-4 px-4 text-center text-sm text-slate-300">{player.apg.toFixed(1)}</td>
                  <td className={`py-4 px-4 text-center text-sm font-bold ${player.per >= 15 ? 'text-red-400' : 'text-slate-400'}`}>
                    {player.per.toFixed(1)}
                  </td>
                  <td className="py-4 px-4 text-center text-sm font-mono text-slate-300">{player.ts}%</td>
                  <td className="py-4 px-4 text-center text-sm font-bold font-mono text-blue-400">
                    {player.darko !== undefined ? (player.darko > 0 ? `+${player.darko.toFixed(1)}` : player.darko.toFixed(1)) : "—"}
                  </td>
                  <td className="py-4 px-4 text-center text-sm font-bold font-mono text-pink-400">
                    {player.lebron !== undefined ? (player.lebron > 0 ? `+${player.lebron.toFixed(1)}` : player.lebron.toFixed(1)) : "—"}
                  </td>
                  <td className="py-4 px-4 text-center text-sm font-bold font-mono text-emerald-400">
                    {player.epm !== undefined ? (player.epm > 0 ? `+${player.epm.toFixed(1)}` : player.epm.toFixed(1)) : "—"}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getGradeColor(player.impactGrade)}`}>
                      {player.impactGrade}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-xs text-slate-400 font-semibold">{player.salary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Player Details Card Modal */}
      {activePlayer && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div
            id="player-detail-modal"
            className="bg-slate-950 border border-slate-800 rounded-2xl md:rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
          >
            {/* Header backdrop color bar representing active status */}
            <div className="h-2 bg-gradient-to-r from-blue-600 via-red-600 to-amber-500" />
            
            <button
              onClick={() => setActivePlayer(null)}
              className="absolute top-5 right-5 p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8">
              {/* Profile Bio Bar */}
              <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl border-2 border-red-500 shadow-lg">
                    {activePlayer.number}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white leading-none">{activePlayer.name}</h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-mono">
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">{activePlayer.position}</span>
                      <span>•</span>
                      <span>{activePlayer.height} ({activePlayer.weight})</span>
                      <span>•</span>
                      <span>Age {activePlayer.age}</span>
                    </div>
                  </div>
                </div>

                {/* Grade and Contract Info */}
                <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                  <div className="text-center px-4">
                    <p className="text-[9px] text-slate-500 font-mono uppercase">Impact Grade</p>
                    <p className="text-2xl font-black text-red-500 mt-0.5">{activePlayer.impactGrade}</p>
                  </div>
                  <div className="h-8 w-px bg-slate-800" />
                  <div className="text-center px-4">
                    <p className="text-[9px] text-slate-500 font-mono uppercase">Current Salary</p>
                    <p className="text-lg font-bold text-slate-200 mt-1 font-mono">{activePlayer.salary}</p>
                  </div>
                </div>
              </div>

              {/* Advanced Performance Metrics Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-6">
                <div className="bg-slate-900/45 p-3 rounded-xl border border-slate-950 text-center">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">PPG</span>
                  <span className="text-xl font-bold block mt-1 text-slate-100">{activePlayer.ppg.toFixed(1)}</span>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (activePlayer.ppg / 30) * 100)}%` }} />
                  </div>
                </div>

                <div className="bg-slate-900/45 p-3 rounded-xl border border-slate-950 text-center">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">RPG</span>
                  <span className="text-xl font-bold block mt-1 text-slate-100">{activePlayer.rpg.toFixed(1)}</span>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (activePlayer.rpg / 15) * 100)}%` }} />
                  </div>
                </div>

                <div className="bg-slate-900/45 p-3 rounded-xl border border-slate-950 text-center">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">APG</span>
                  <span className="text-xl font-bold block mt-1 text-slate-100">{activePlayer.apg.toFixed(1)}</span>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (activePlayer.apg / 10) * 100)}%` }} />
                  </div>
                </div>

                <div className="bg-slate-900/45 p-3 rounded-xl border border-slate-950 text-center">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">PER</span>
                  <span className="text-xl font-bold block mt-1 text-red-500">{activePlayer.per.toFixed(1)}</span>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min(100, (activePlayer.per / 25) * 100)}%` }} />
                  </div>
                </div>

                <div className="bg-slate-900/45 p-3 rounded-xl border border-slate-950 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">TS%</span>
                  <span className="text-xl font-bold block mt-1 text-emerald-400">{activePlayer.ts}%</span>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(activePlayer.ts / 70) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Advanced Impact Ratings Bar */}
              <div id="player-advanced-bento" className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 mb-6">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-3 text-center">Elite Advanced Impact Analytics</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/65 text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <span className="text-[10px] uppercase font-mono text-blue-400 font-bold block">DARKO DPM</span>
                    <span className="text-2xl font-black block mt-1.5 text-white">
                      {activePlayer.darko !== undefined ? (activePlayer.darko > 0 ? `+${activePlayer.darko.toFixed(1)}` : activePlayer.darko.toFixed(1)) : "—"}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-1 font-mono leading-none">Daily Adjusted Rating Ko</span>
                  </div>

                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/65 text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-pink-500" />
                    <span className="text-[10px] uppercase font-mono text-pink-400 font-bold block">LEBRON Rating</span>
                    <span className="text-2xl font-black block mt-1.5 text-white">
                      {activePlayer.lebron !== undefined ? (activePlayer.lebron > 0 ? `+${activePlayer.lebron.toFixed(1)}` : activePlayer.lebron.toFixed(1)) : "—"}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-1 font-mono leading-none">Box/On-Off Plus-Minus</span>
                  </div>

                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/65 text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block">EPM (Est. Plus-Minus)</span>
                    <span className="text-2xl font-black block mt-1.5 text-white">
                      {activePlayer.epm !== undefined ? (activePlayer.epm > 0 ? `+${activePlayer.epm.toFixed(1)}` : activePlayer.epm.toFixed(1)) : "—"}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-1 font-mono leading-none">Statistical Impact Estimator</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Analysis Panels */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {/* Strengths & Weaknesses Box */}
                <div className="space-y-4">
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold uppercase tracking-widest mb-3">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span>Key Scout Strengths</span>
                    </div>
                    <ul className="space-y-2">
                      {activePlayer.strengths.map((st, i) => (
                        <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold uppercase tracking-widest mb-3">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span>Scouting Concern Areas</span>
                    </div>
                    <ul className="space-y-2">
                      {activePlayer.weaknesses.map((wk, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-red-500 font-black">•</span>
                          <span>{wk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Narrative scouting & optimization details */}
                <div className="space-y-4">
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 h-full flex flex-col">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold uppercase tracking-widest mb-2.5">
                      <BarChart3 className="w-4 h-4 text-amber-500" />
                      <span>Analytics Assessment</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed flex-1">
                      {activePlayer.analysis}
                    </p>

                    <div className="mt-5 pt-4 border-t border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold uppercase tracking-widest mb-2">
                        <Wrench className="w-4 h-4 text-red-500" />
                        <span>Roster Optimization Directive</span>
                      </div>
                      <p className="text-xs text-slate-400 italic leading-relaxed">
                        {activePlayer.howToOptimize}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
