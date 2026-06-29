import React, { useState, useMemo } from "react";
import { Player, DraftProspect, FreeAgent } from "../types";
import { currentRosterData, draftProspectsData, freeAgentsData } from "../data";
import { BASE_ROSTER_CONTRACTS } from "../utils/finance";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine,
  Cell,
  ComposedChart,
  Area,
  Line
} from "recharts";
import { 
  Briefcase, 
  TrendingUp, 
  AlertTriangle, 
  Coins, 
  UserCheck, 
  ChevronRight, 
  ToggleLeft, 
  ToggleRight, 
  Info,
  DollarSign,
  PieChart,
  Activity
} from "lucide-react";

interface FinanceForecasterViewProps {
  excludedPlayerIds: string[];
  addedProspectIds: string[];
  addedFreeAgentIds: string[];
  tradedAwayPlayerIds: string[];
  acquiredPlayers: any[];
}

export default function FinanceForecasterView({
  excludedPlayerIds,
  addedProspectIds,
  addedFreeAgentIds,
  tradedAwayPlayerIds,
  acquiredPlayers,
}: FinanceForecasterViewProps) {
  
  // Extension toggles state
  const [extendCade, setExtendCade] = useState(false);
  const [extendDuren, setExtendDuren] = useState(false);
  const [extendIvey, setExtendIvey] = useState(false);
  const [declineTeamOptions, setDeclineTeamOptions] = useState(false);

  // Hardcoded CBA Limit Projections (assuming 10% standard annual salary cap increase)
  const financialProjectionsByYear = {
    "2026-27": { cap: 155.1, tax: 188.4, apron1: 195.9, apron2: 208.5 },
    "2027-28": { cap: 170.6, tax: 207.2, apron1: 215.5, apron2: 229.4 },
    "2028-29": { cap: 187.7, tax: 227.9, apron1: 237.1, apron2: 252.3 },
    "2029-30": { cap: 206.5, tax: 250.7, apron1: 260.8, apron2: 277.5 }
  };

  // Compile full Multi-Year spreadsheet rows
  const multiYearSheet = useMemo(() => {
    const sheet: any[] = [];

    // 1. Process base players that are still on the roster (not excluded or traded)
    currentRosterData.forEach((player) => {
      const isExcluded = excludedPlayerIds.includes(player.id) || tradedAwayPlayerIds.includes(player.id);
      if (isExcluded) return;

      const baseContract = BASE_ROSTER_CONTRACTS[player.id];
      if (!baseContract) return;

      const salaries = { ...baseContract.salaries };
      const statuses = { ...baseContract.statuses };

      // Apply Interactive Max Extension Overrides
      if (player.id === "cade-cunningham" && extendCade) {
        // Boost from standard extension to designated maximum supermax tier
        salaries["2027-28"] = 43.5;
        salaries["2028-29"] = 47.0;
        salaries["2029-30"] = 50.5;
        statuses["2027-28"] = "Guaranteed";
        statuses["2028-29"] = "Guaranteed";
        statuses["2029-30"] = "Guaranteed";
      }

      if (player.id === "jalen-duren" && extendDuren) {
        // Convert rookie options & qualifying offers to high-end max starter extension
        salaries["2027-28"] = 28.5; // Replaces team option of 6.5
        salaries["2028-29"] = 30.8; // Replaces qualifying offer of 8.5
        salaries["2029-30"] = 33.1; // Replaces UFA (0)
        statuses["2027-28"] = "Guaranteed";
        statuses["2028-29"] = "Guaranteed";
        statuses["2029-30"] = "Guaranteed";
      }

      if (player.id === "jaden-ivey" && extendIvey) {
        // Convert options to elite shooter starter extension
        salaries["2027-28"] = 24.0; // Replaces team option of 10.1
        salaries["2028-29"] = 25.9; // Replaces qualifying offer of 13.5
        salaries["2029-30"] = 27.8; // Replaces UFA (0)
        statuses["2027-28"] = "Guaranteed";
        statuses["2028-29"] = "Guaranteed";
        statuses["2029-30"] = "Guaranteed";
      }

      // Handle Team Option declines globally
      if (declineTeamOptions) {
        (["2027-28", "2028-29", "2029-30"] as const).forEach((yr) => {
          if (statuses[yr] === "Team Option") {
            salaries[yr] = 0;
            statuses[yr] = "UFA";
          }
        });
      }

      sheet.push({
        id: player.id,
        name: player.name,
        position: player.position,
        salaries,
        statuses,
        isNew: false
      });
    });

    // 2. Add draft picks scale contracts
    draftProspectsData
      .filter((d) => addedProspectIds.includes(d.id))
      .forEach((dp) => {
        const baseRookieSal = dp.projectedRange?.toLowerCase().includes("top") ? 6.2 : 4.5;
        sheet.push({
          id: dp.id,
          name: `${dp.name} (Draft Pick)`,
          position: dp.position,
          salaries: {
            "2026-27": baseRookieSal,
            "2027-28": +(baseRookieSal * 1.05).toFixed(1),
            "2028-29": +(baseRookieSal * 1.10).toFixed(1),
            "2029-30": +(baseRookieSal * 1.15).toFixed(1)
          },
          statuses: {
            "2026-27": "Guaranteed",
            "2027-28": "Guaranteed",
            "2028-29": "Team Option",
            "2029-30": "Team Option"
          },
          isNew: true
        });
      });

    // 3. Add Free Agent signings
    freeAgentsData
      .filter((f) => addedFreeAgentIds.includes(f.id))
      .forEach((fa) => {
        sheet.push({
          id: fa.id,
          name: `${fa.name} (Signed FA)`,
          position: fa.position,
          salaries: {
            "2026-27": fa.projectedSalary,
            "2027-28": +(fa.projectedSalary * 1.05).toFixed(1),
            "2028-29": +(fa.projectedSalary * 1.10).toFixed(1),
            "2029-30": 0
          },
          statuses: {
            "2026-27": "Guaranteed",
            "2027-28": "Guaranteed",
            "2028-29": "Player Option",
            "2029-30": "UFA"
          },
          isNew: true
        });
      });

    // 4. Add custom trade acquired players
    acquiredPlayers.forEach((ap) => {
      const salaryVal = typeof ap.salary === "number" 
        ? ap.salary 
        : parseFloat(ap.salary.replace("$", "").replace("M", ""));
      const finalSalary = isNaN(salaryVal) ? 8.0 : salaryVal;

      sheet.push({
        id: ap.id,
        name: `${ap.name} (Acquired)`,
        position: ap.position || "G",
        salaries: {
          "2026-27": finalSalary,
          "2027-28": +(finalSalary * 1.05).toFixed(1),
          "2028-29": +(finalSalary * 1.10).toFixed(1),
          "2029-30": 0
        },
        statuses: {
          "2026-27": "Guaranteed",
          "2027-28": "Guaranteed",
          "2028-29": "Player Option",
          "2029-30": "UFA"
        },
        isNew: true
      });
    });

    return sheet;
  }, [excludedPlayerIds, addedProspectIds, addedFreeAgentIds, tradedAwayPlayerIds, acquiredPlayers, extendCade, extendDuren, extendIvey, declineTeamOptions]);

  // Year-by-year cumulative financial metrics calculation
  const yearlySummaryMetrics = useMemo(() => {
    const years = ["2026-27", "2027-28", "2028-29", "2029-30"] as const;
    const summaries = years.map((yr) => {
      const limits = financialProjectionsByYear[yr];
      let payroll = 0;

      multiYearSheet.forEach((p) => {
        const sal = p.salaries[yr] || 0;
        payroll += sal;
      });

      payroll = +payroll.toFixed(1);
      const capSpace = payroll < limits.cap ? +(limits.cap - payroll).toFixed(1) : 0;
      const taxSpace = payroll < limits.tax ? +(limits.tax - payroll).toFixed(1) : 0;
      const taxOverage = payroll > limits.tax ? +(payroll - limits.tax).toFixed(1) : 0;

      let taxPenalty = 0;
      if (taxOverage > 0) {
        // Graduated NBA Luxury Tax Penalty estimation
        if (taxOverage <= 5.0) taxPenalty = taxOverage * 1.5;
        else if (taxOverage <= 10.0) taxPenalty = 5.0 * 1.5 + (taxOverage - 5.0) * 1.75;
        else taxPenalty = 5.0 * 1.5 + 5.0 * 1.75 + (taxOverage - 10.0) * 2.5;
        taxPenalty = +taxPenalty.toFixed(1);
      }

      let apronLevel: "Under Apron" | "Above First" | "Above Second" = "Under Apron";
      if (payroll > limits.apron2) {
        apronLevel = "Above Second";
      } else if (payroll > limits.apron1) {
        apronLevel = "Above First";
      }

      return {
        year: yr,
        committedPayroll: payroll,
        salaryCap: limits.cap,
        luxuryTaxLine: limits.tax,
        firstApron: limits.apron1,
        secondApron: limits.apron2,
        capSpace,
        taxSpace,
        taxOverage,
        taxPenalty,
        apronLevel
      };
    });

    return summaries;
  }, [multiYearSheet]);

  // Map Summary data into Recharts-friendly timeline data format
  const chartData = useMemo(() => {
    return yearlySummaryMetrics.map((m) => ({
      year: m.year,
      "Committed Payroll": m.committedPayroll,
      "Salary Cap": m.salaryCap,
      "Luxury Tax Line": m.luxuryTaxLine,
      "First Apron": m.firstApron,
      "Second Apron": m.secondApron,
      "Cap Space Envelope": m.capSpace,
    }));
  }, [yearlySummaryMetrics]);

  return (
    <div id="finance-forecaster-container" className="flex-1 overflow-y-auto bg-slate-900 p-4 lg:p-8 pb-32 lg:pb-8 text-slate-100">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Coins className="w-8 h-8 text-emerald-500 animate-pulse" />
            <span>Multi-Year Salary Cap Forecaster</span>
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
            Model Detroit's finances over the next 4 seasons. Toggle player extensions, options, and track luxury tax limits in real-time.
          </p>
        </div>

        {/* Global Warnings State */}
        <div className="flex items-center gap-3">
          {yearlySummaryMetrics.some(m => m.committedPayroll > m.luxuryTaxLine) ? (
            <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2 text-xs text-red-400 font-bold animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>TAX PENALTIES TRIGGERED IN FORECAST</span>
            </div>
          ) : (
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2 text-xs text-emerald-400 font-bold">
              <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>TAX COMPLIANT & FLEXIBLE</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* LEFT COLUMN: Controls & Forecasting Timeline Chart (8 cols) */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* INTERACTIVE TOGGLE CONTROLS BLOCK */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl">
            <h3 className="text-sm font-extrabold text-white tracking-wider uppercase border-b border-slate-900 pb-3.5 mb-5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Simulate Strategic Salary Scenarios</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Cade Cunningham Extension Toggle */}
              <button
                onClick={() => setExtendCade(!extendCade)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  extendCade 
                    ? "bg-blue-600/10 border-blue-500 text-slate-100" 
                    : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Cunningham Max</span>
                    {extendCade ? <ToggleRight className="w-5 h-5 text-blue-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Elevate from standard rookie contract to full 30% designated max scale starting 2027-28.
                  </p>
                </div>
                <span className="text-[10px] font-mono mt-3.5 block font-bold text-blue-400">
                  {extendCade ? "+$5.6M / yr added" : "Click to apply Max"}
                </span>
              </button>

              {/* Jalen Duren Extension Toggle */}
              <button
                onClick={() => setExtendDuren(!extendDuren)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  extendDuren 
                    ? "bg-blue-600/10 border-blue-500 text-slate-100" 
                    : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Duren Max Starter</span>
                    {extendDuren ? <ToggleRight className="w-5 h-5 text-blue-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Convert 2027 Team Option and Qualifying Offer to a maximum starter scale (~$28.5M).
                  </p>
                </div>
                <span className="text-[10px] font-mono mt-3.5 block font-bold text-emerald-400">
                  {extendDuren ? "+$22.0M committed" : "Click to apply Max"}
                </span>
              </button>

              {/* Jaden Ivey Extension Toggle */}
              <button
                onClick={() => setExtendIvey(!extendIvey)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  extendIvey 
                    ? "bg-blue-600/10 border-blue-500 text-slate-100" 
                    : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Ivey Extension</span>
                    {extendIvey ? <ToggleRight className="w-5 h-5 text-blue-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Simulate a 4-year $100M veteran extension instead of team options and UFA.
                  </p>
                </div>
                <span className="text-[10px] font-mono mt-3.5 block font-bold text-yellow-400">
                  {extendIvey ? "+$13.9M committed" : "Click to apply"}
                </span>
              </button>

              {/* Decline Team Options Toggle */}
              <button
                onClick={() => setDeclineTeamOptions(!declineTeamOptions)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  declineTeamOptions 
                    ? "bg-red-600/10 border-red-500 text-slate-100" 
                    : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Decline Team Options</span>
                    {declineTeamOptions ? <ToggleRight className="w-5 h-5 text-red-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Decline options on players like Ausar Thompson, Jaden Ivey, and Ebuka Okorie.
                  </p>
                </div>
                <span className="text-[10px] font-mono mt-3.5 block font-bold text-red-400">
                  {declineTeamOptions ? "Cap space cleared!" : "Decline option years"}
                </span>
              </button>

            </div>
          </div>

          {/* RECHARTS MULTI-YEAR CHART CONTAINER */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Cap Sheet Outlook</span>
                <h4 className="text-base font-extrabold text-white mt-0.5">Salary Books vs. CBA Threshold Limits</h4>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Hover lines for thresholds</span>
              </div>
            </div>

            {/* Recharts Chart Canvas */}
            <div className="w-full h-[320px] md:h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="year" 
                    stroke="#64748b" 
                    fontSize={11} 
                    fontFamily="JetBrains Mono"
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    fontFamily="JetBrains Mono"
                    tickFormatter={(v) => `$${v}M`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconSize={12}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'Inter', color: '#94a3b8' }}
                  />
                  
                  {/* Under cap area fill */}
                  <Area 
                    type="monotone" 
                    dataKey="Cap Space Envelope" 
                    fill="#10b981" 
                    stroke="#10b981" 
                    fillOpacity={0.05} 
                    name="Available Cap Space Envelope" 
                  />

                  {/* Committed Roster Payroll */}
                  <Bar 
                    dataKey="Committed Payroll" 
                    name="Committed Payroll ($M)" 
                    fill="#3b82f6" 
                    radius={[8, 8, 0, 0]}
                  >
                    {chartData.map((entry, index) => {
                      const yr = entry.year as "2026-27" | "2027-28" | "2028-29" | "2029-30";
                      const overTax = entry["Committed Payroll"] > entry["Luxury Tax Line"];
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={overTax ? "#f43f5e" : "#3b82f6"} 
                        />
                      );
                    })}
                  </Bar>

                  {/* CBA Limits Lines */}
                  <Line 
                    type="monotone" 
                    dataKey="Salary Cap" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    name="Salary Cap ($M)" 
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Luxury Tax Line" 
                    stroke="#eab308" 
                    strokeWidth={2.5} 
                    name="Luxury Tax Line ($M)" 
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="First Apron" 
                    stroke="#f97316" 
                    strokeWidth={1.5} 
                    strokeDasharray="3 3" 
                    name="First Apron ($M)" 
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Second Apron" 
                    stroke="#ef4444" 
                    strokeWidth={1.5} 
                    strokeDasharray="2 2" 
                    name="Second Apron ($M)" 
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Year-by-Year Spending Capacity Card Envelopes (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl space-y-5">
            <h3 className="text-sm font-extrabold text-white tracking-wider uppercase border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Cap Space Envelopes</span>
            </h3>

            {/* Timelines list */}
            <div className="space-y-4">
              {yearlySummaryMetrics.map((summary) => {
                const isUnderCap = summary.capSpace > 0;
                
                return (
                  <div 
                    key={summary.year} 
                    className="p-4 bg-slate-900 border border-slate-850 rounded-2xl space-y-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white font-mono">{summary.year} Summer</span>
                      <span className={`text-[10px] px-2.5 py-0.5 font-bold rounded-full ${
                        summary.committedPayroll > summary.luxuryTaxLine 
                          ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                          : summary.committedPayroll > summary.salaryCap 
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" 
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {summary.apronLevel === "Above Second" 
                          ? "2nd Apron" 
                          : summary.apronLevel === "Above First" 
                            ? "1st Apron" 
                            : summary.committedPayroll > summary.luxuryTaxLine 
                              ? "Tax Team" 
                              : isUnderCap 
                                ? "Cap Room" 
                                : "Over Cap / Tax Safe"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Total Committed</span>
                        <span className="text-base font-extrabold text-slate-200">${summary.committedPayroll}M</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">
                          {isUnderCap ? "Free Agent Spending" : "Overage above Cap"}
                        </span>
                        <span className={`text-base font-extrabold block ${isUnderCap ? "text-emerald-400" : "text-yellow-500"}`}>
                          {isUnderCap ? `$${summary.capSpace}M` : `$${+(summary.committedPayroll - summary.salaryCap).toFixed(1)}M`}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Envelope */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            summary.committedPayroll > summary.luxuryTaxLine 
                              ? "bg-red-500" 
                              : summary.committedPayroll > summary.salaryCap 
                                ? "bg-yellow-500" 
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min((summary.committedPayroll / summary.secondApron) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-500">
                        <span>Salary Cap (${summary.salaryCap}M)</span>
                        <span>Apron (${summary.secondApron}M)</span>
                      </div>
                    </div>

                    {/* Exceptions / Spending capacity explanations */}
                    <div className="border-t border-slate-850 pt-2 text-[10.5px] text-slate-400 leading-relaxed space-y-1 bg-slate-950/40 p-2 rounded-xl">
                      {isUnderCap ? (
                        <p className="flex items-start gap-1">
                          <span className="text-emerald-400">✓</span>
                          <span>Can absorb up to <strong className="text-slate-200">${summary.capSpace}M</strong> directly via cap room. Standard Room Exception ($8.4M) available.</span>
                        </p>
                      ) : (
                        <div className="space-y-1">
                          <p className="flex items-start gap-1">
                            <span className="text-yellow-400">⚠</span>
                            <span>Limited to Exceptions. Non-Taxpayer Mid-Level Exception (MLE) of <strong className="text-slate-200">$14.1M</strong> and Bi-Annual of <strong className="text-slate-200">$5.0M</strong> available.</span>
                          </p>
                          {summary.committedPayroll > summary.luxuryTaxLine && (
                            <p className="text-red-400 text-[10px] font-mono">
                              Luxury Tax overage is <strong>${summary.taxOverage}M</strong>. Projected luxury tax penalty is <strong>${summary.taxPenalty}M</strong>.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: Detailed multi-year contract spreadsheets rows */}
      <div className="mt-8 bg-slate-950 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-4 mb-5 gap-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Individual Sheet Accounts</span>
            <h4 className="text-base font-extrabold text-white mt-0.5">Player Contract Projections Ledger</h4>
          </div>
          <div className="text-xs text-slate-400">
            Showing <strong className="text-white">{multiYearSheet.length} roster players</strong>
          </div>
        </div>

        {/* Spreadsheet Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-900 text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Pos</th>
                <th className="py-3 px-4 text-right">2026-27 ($M)</th>
                <th className="py-3 px-4 text-right">2027-28 ($M)</th>
                <th className="py-3 px-4 text-right">2028-29 ($M)</th>
                <th className="py-3 px-4 text-right">2029-30 ($M)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-xs">
              {multiYearSheet.map((row) => (
                <tr 
                  key={row.id} 
                  className={`hover:bg-slate-900/40 transition-colors ${
                    row.isNew ? "bg-blue-900/5" : ""
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-2">
                    <span>{row.name}</span>
                    {row.isNew && (
                      <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 rounded uppercase font-mono font-bold shrink-0">
                        New
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{row.position}</td>
                  
                  {/* Years cells */}
                  {(["2026-27", "2027-28", "2028-29", "2029-30"] as const).map((yr) => {
                    const sal = row.salaries[yr];
                    const status = row.statuses[yr] || "UFA";
                    
                    return (
                      <td key={yr} className="py-3 px-4 text-right font-mono">
                        {sal > 0 ? (
                          <div>
                            <span className="text-white font-semibold">${sal.toFixed(1)}M</span>
                            <span className={`block text-[8.5px] leading-none mt-1 ${
                              status === "Team Option" 
                                ? "text-yellow-500 font-bold" 
                                : status === "Player Option" 
                                  ? "text-blue-400 font-bold" 
                                  : status === "Qualifying Offer" 
                                    ? "text-purple-400" 
                                    : "text-slate-500"
                            }`}>
                              {status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
