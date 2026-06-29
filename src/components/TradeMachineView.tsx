import React, { useState, useMemo, useEffect } from "react";
import { Player } from "../types";
import { 
  ArrowLeftRight, 
  Search, 
  Trash2, 
  Coins, 
  AlertCircle, 
  CheckCircle2, 
  CornerDownRight, 
  HelpCircle, 
  Info,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Zap,
  Users,
  Scale,
  ShieldAlert
} from "lucide-react";

const AVAILABLE_PISTONS_PICKS = [
  { id: "det-2027-1st", name: "DET 2027 1st Rd", value: 38, type: "1st" },
  { id: "det-2027-2nd", name: "DET 2027 2nd Rd", value: 12, type: "2nd" },
  { id: "det-2028-1st", name: "DET 2028 1st Rd", value: 32, type: "1st" },
  { id: "det-2028-2nd", name: "DET 2028 2nd Rd", value: 10, type: "2nd" },
  { id: "det-2029-1st", name: "DET 2029 1st Rd", value: 28, type: "1st" },
  { id: "det-2029-2nd", name: "DET 2029 2nd Rd", value: 8, type: "2nd" },
];

const AVAILABLE_TARGET_PICKS = [
  { id: "opp-2027-1st", name: "Partner 2027 1st Rd", value: 30, type: "1st" },
  { id: "opp-2027-2nd", name: "Partner 2027 2nd Rd", value: 10, type: "2nd" },
  { id: "opp-2028-1st", name: "Partner 2028 1st Rd", value: 25, type: "1st" },
  { id: "opp-2028-2nd", name: "Partner 2028 2nd Rd", value: 8, type: "2nd" },
];

// Mock external team players data suitable for high-fidelity trades
export interface TradeTarget {
  id: string;
  name: string;
  position: string;
  team: string;
  age: number;
  salary: number; // in Millions, e.g. 23.6
  ppg: number;
  rpg: number;
  apg: number;
  per: number;
  ts: number;
  epm: number; // Estimated Plus-Minus
  strengths: string[];
  benefit: "shooting" | "defense" | "playmaking" | "size" | "veteran_experience";
}

const mockTradeTargets: TradeTarget[] = [
  {
    id: "target-zach-lavine",
    name: "Zach LaVine",
    position: "SG / SF",
    team: "Chicago Bulls",
    age: 31,
    salary: 43.0,
    ppg: 21.5,
    rpg: 4.2,
    apg: 4.6,
    per: 18.1,
    ts: 58.5,
    epm: 1.8,
    strengths: ["Shot Creation", "Movement Spacing", "Athletic Finishing"],
    benefit: "shooting"
  },
  {
    id: "target-cam-johnson",
    name: "Cameron Johnson",
    position: "SF / PF",
    team: "Brooklyn Nets",
    age: 30,
    salary: 23.6,
    ppg: 14.8,
    rpg: 4.4,
    apg: 2.6,
    per: 15.2,
    ts: 61.2,
    epm: 1.1,
    strengths: ["Elite 3PT Catch-and-shoot", "Floor Mapping", "Fast Relocation"],
    benefit: "shooting"
  },
  {
    id: "target-anfernee-simons",
    name: "Anfernee Simons",
    position: "PG / SG",
    team: "Portland Trail Blazers",
    age: 26,
    salary: 25.9,
    ppg: 22.1,
    rpg: 2.7,
    apg: 5.5,
    per: 17.8,
    ts: 58.1,
    epm: 1.4,
    strengths: ["Pull-up Gravity", "Pick-and-Roll Score", "Deep Spacer"],
    benefit: "shooting"
  },
  {
    id: "target-walker-kessler",
    name: "Walker Kessler",
    position: "C",
    team: "Utah Jazz",
    age: 24,
    salary: 4.9,
    ppg: 8.5,
    rpg: 9.8,
    apg: 0.9,
    per: 19.4,
    ts: 65.2,
    epm: 2.2,
    strengths: ["Elite Rim Protection", "Defensive Positioning", "Lob Finisher"],
    benefit: "defense"
  },
  {
    id: "target-dorian-finney-smith",
    name: "Dorian Finney-Smith",
    position: "SF / PF",
    team: "Brooklyn Nets",
    age: 33,
    salary: 14.9,
    ppg: 9.2,
    rpg: 4.9,
    apg: 1.6,
    per: 11.8,
    ts: 55.8,
    epm: 0.8,
    strengths: ["Perimeter Containment", "Corner Spacing", "Defensive Versatility"],
    benefit: "defense"
  },
  {
    id: "target-trey-murphy",
    name: "Trey Murphy III",
    position: "SF",
    team: "New Orleans Pelicans",
    age: 25,
    salary: 14.2,
    ppg: 15.9,
    rpg: 4.8,
    apg: 2.2,
    per: 16.5,
    ts: 62.4,
    epm: 1.9,
    strengths: ["Deep Launch Shooting", "Generational Leaper", "On-ball Deflections"],
    benefit: "shooting"
  },
  {
    id: "target-chris-paul",
    name: "Chris Paul",
    position: "PG",
    team: "San Antonio Spurs",
    age: 41,
    salary: 10.4,
    ppg: 8.1,
    rpg: 3.4,
    apg: 7.9,
    per: 15.6,
    ts: 54.2,
    epm: 0.5,
    strengths: ["Hall-of-Fame Floor Command", "Pick-and-Roll Master", "Elite Core Leader"],
    benefit: "veteran_experience"
  },
  {
    id: "target-cole-anthony",
    name: "Cole Anthony",
    position: "PG",
    team: "Orlando Magic",
    age: 26,
    salary: 15.0,
    ppg: 11.6,
    rpg: 3.8,
    apg: 3.1,
    per: 14.9,
    ts: 54.8,
    epm: -0.2,
    strengths: ["Microwave Bench Scorer", "Vertical Rebounder", "Physical Slashing"],
    benefit: "playmaking"
  },
  {
    id: "target-jerami-grant",
    name: "Jerami Grant",
    position: "PF / SF",
    team: "Portland Trail Blazers",
    age: 32,
    salary: 29.8,
    ppg: 19.5,
    rpg: 3.5,
    apg: 2.8,
    per: 15.9,
    ts: 57.3,
    epm: 0.9,
    strengths: ["Isolation Wing Scorer", "Perimeter Length", "Versatile Switch Defense"],
    benefit: "defense"
  },
  {
    id: "target-donal-dieng",
    name: "Ousmane Dieng",
    position: "SF / PF",
    team: "Oklahoma City Thunder",
    age: 23,
    salary: 5.2,
    ppg: 7.4,
    rpg: 3.2,
    apg: 1.8,
    per: 12.1,
    ts: 53.4,
    epm: 0.1,
    strengths: ["Fluid Coordination", "Slick Floor Passing", "Developmental Wing Size"],
    benefit: "size"
  },
  {
    id: "target-keldon-johnson",
    name: "Keldon Johnson",
    position: "SF / PF",
    team: "San Antonio Spurs",
    age: 26,
    salary: 17.5,
    ppg: 15.5,
    rpg: 5.1,
    apg: 2.1,
    per: 15.0,
    ts: 56.4,
    epm: 0.4,
    strengths: ["Bully-ball Drive Slashing", "Catch-and-shoot Spacing", "Energetic Motor"],
    benefit: "shooting"
  },
  {
    id: "target-duop-reath",
    name: "Duop Reath",
    position: "C / PF",
    team: "Portland Trail Blazers",
    age: 29,
    salary: 2.0,
    ppg: 9.2,
    rpg: 3.7,
    apg: 1.0,
    per: 13.8,
    ts: 57.1,
    epm: -0.1,
    strengths: ["Pick-and-pop Spacing", "Highly Physical Pick Screen", "Bench Spark"],
    benefit: "shooting"
  }
];

interface CompletedTrade {
  id: string;
  timestamp: string;
  outgoingNames: string[];
  incomingNames: string[];
  netSalaryText: string;
  incomingTotalSalary: number;
  outgoingTotalSalary: number;
}

interface TradeMachineViewProps {
  roster: Player[];
  excludedPlayerIds: string[];
  onTogglePlayerExclude: (id: string) => void;
  onExecuteTrade: (outgoingIds: string[], incomingTargetPlayers: TradeTarget[]) => void;
  completedTrades: CompletedTrade[];
  onUndoTrade: (tradeId: string) => void;
  onResetTrades: () => void;
}

export default function TradeMachineView({
  roster,
  excludedPlayerIds,
  onTogglePlayerExclude,
  onExecuteTrade,
  completedTrades,
  onUndoTrade,
  onResetTrades
}: TradeMachineViewProps) {
  // Tabs within Trade Machine
  const [activeSubTab, setActiveSubTab] = useState<"machine" | "history">("machine");

  // Selection states
  const [selectedPistonsIds, setSelectedPistonsIds] = useState<string[]>([]);
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [selectedPistonsPicks, setSelectedPistonsPicks] = useState<string[]>([]);
  const [selectedTargetPicks, setSelectedTargetPicks] = useState<string[]>([]);
  const [forceOverride, setForceOverride] = useState(false);

  // Search & Filter state for target players
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [teamFilter, setTeamFilter] = useState("All");

  // Success modal indicator
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTradeSummary, setSuccessTradeSummary] = useState<{
    outgoing: string[];
    incoming: string[];
  } | null>(null);

  // Parse list of active Pistons representing candidates to trade away
  // Ensure we can only trade players who are NOT currently waived in other simulator setups
  const pistonsTradeCandidates = useMemo(() => {
    return roster.filter(player => !excludedPlayerIds.includes(player.id));
  }, [roster, excludedPlayerIds]);

  // Extract list of other team options
  const teamsList = useMemo(() => {
    return Array.from(new Set(mockTradeTargets.map(t => t.team))).sort();
  }, []);

  // Filtered target list
  const filteredTargets = useMemo(() => {
    return mockTradeTargets.filter((target) => {
      const matchesSearch = target.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            target.team.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPosition = positionFilter === "All" || target.position.includes(positionFilter);
      const matchesTeam = teamFilter === "All" || target.team === teamFilter;
      return matchesSearch && matchesPosition && matchesTeam;
    });
  }, [searchQuery, positionFilter, teamFilter]);

  // Summarize salaries
  const outgoingPistons = useMemo(() => {
    return roster.filter(p => selectedPistonsIds.includes(p.id));
  }, [roster, selectedPistonsIds]);

  const incomingTargets = useMemo(() => {
    return mockTradeTargets.filter(t => selectedTargetIds.includes(t.id));
  }, [selectedTargetIds]);

  const totalOutgoingSalaryText = outgoingPistons.reduce((sum, p) => {
    const val = parseFloat(p.salary.replace("$", "").replace("M", ""));
    return sum + val;
  }, 0);

  const totalIncomingSalaryText = incomingTargets.reduce((sum, t) => sum + t.salary, 0);

  // NBA CBA Trade math & verification
  // Rules are adapted around the current Pistons Cap Room
  // Baseline Cap Space: Detroit is currently under the salary cap by around $14.0M
  // Salary Cap Level = $140.5M, Current Core Salary = ~$126.5M (~$14M room)
  // If receiving salary exceeds outgoing salary, the net absorption cannot exceed Pistons cap room ($14.0M)
  // Otherwise, standard CBA trade rules require matched salaries within 125% + 100k
  const tradeAnalysis = useMemo(() => {
    const outgoing = totalOutgoingSalaryText;
    const incoming = totalIncomingSalaryText;
    const netSalaryDiff = +(incoming - outgoing).toFixed(1);
    const capSpaceRoom = 14.0; // Detroit cap cushion under $140.5M cap

    // Checks
    const isPistonsSelected = selectedPistonsIds.length > 0;
    const isTargetsSelected = selectedTargetIds.length > 0;

    if (!isPistonsSelected && !isTargetsSelected) {
      return {
        isCompliant: false,
        status: "Empty",
        alertText: "Select at least one current Piston and one external player to analyze trade compliance.",
        colorClass: "border-slate-800 text-slate-400 bg-slate-950/40",
        badgeClass: "bg-slate-900 border-slate-800 text-slate-500",
        netDifference: 0,
        explanation: "Selecting assets on both sides will trigger the NBA Salary Cap Trade Matcher engine."
      };
    }

    if (!isPistonsSelected) {
      return {
        isCompliant: false,
        status: "Pistons Missing",
        alertText: "Detroit must trade away at least one player to receive players in trade.",
        colorClass: "border-yellow-500/20 text-yellow-500 bg-yellow-500/5",
        badgeClass: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
        netDifference: netSalaryDiff,
        explanation: "NBA teams cannot absorb raw incoming player salaries without sending player assets or unless they utilize trade exceptions which require dedicated matching rules."
      };
    }

    if (!isTargetsSelected) {
      return {
        isCompliant: false,
        status: "Incoming Missing",
        alertText: "Choose players from other NBA teams to simulate an exchange.",
        colorClass: "border-yellow-500/20 text-yellow-500 bg-yellow-500/5",
        badgeClass: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
        netDifference: netSalaryDiff,
        explanation: "Provide outgoing Pistons compensation for targeted players."
      };
    }

    // Checking Roster size (Max 15 players)
    // Starting simulated count (usually 10 on active lists)
    const startingRosterSize = 10 - excludedPlayerIds.length;
    const finalRosterSize = startingRosterSize - selectedPistonsIds.length + selectedTargetIds.length;

    if (finalRosterSize > 15) {
      return {
        isCompliant: false,
        status: "Roster Overflow",
        alertText: "Trade rejected: This would exceed the 15-player Active Roster Limit (Detroit would reach " + finalRosterSize + " players).",
        colorClass: "border-red-500/20 text-red-500 bg-red-500/5",
        badgeClass: "bg-red-500/10 border-red-500/20 text-red-400",
        netDifference: netSalaryDiff,
        explanation: "DET must reduce incoming players or package extra players together to keep the active core roster size at or below the standard 15-player limit."
      };
    }

    // Cap Room Check
    // If Detroit absorbs salary, checks if the net increase sits comfortably within the cap room
    // If net salary diff <= capSpaceRoom = trade is legal regardless of outgoing size (using cap room space)
    if (netSalaryDiff <= capSpaceRoom) {
      return {
        isCompliant: true,
        status: "Approved",
        alertText: "Trade Approved ✅ (DET absorbs within Cap Room)",
        colorClass: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
        badgeClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        netDifference: netSalaryDiff,
        explanation: "Detroit has sufficient financial cap cushion ($14.0M) to absorb the unbalanced salary increase of $" + netSalaryDiff + "M without violating luxury tax or strict contract-matching constraints."
      };
    }

    // Standard Contract Matching Math
    // Incoming must be within limits: e.g. Incoming Total cannot exceed 125% of Outgoing + $0.1M
    const maxIncomingAllowed = outgoing * 1.25 + 0.1;
    const overage = +(incoming - maxIncomingAllowed).toFixed(1);

    if (incoming <= maxIncomingAllowed) {
      return {
        isCompliant: true,
        status: "Approved",
        alertText: "Trade Approved ✅ (CBA Compliant Matching)",
        colorClass: "border-emerald-500/35 text-emerald-400 bg-emerald-500/5",
        badgeClass: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
        netDifference: netSalaryDiff,
        explanation: "The incoming salary ($" + incoming + "M) is within the legal 125% allowance limit of the outgoing salary ($" + outgoing + "M). The trade is fully authorized under CBA guidelines."
      };
    } else {
      return {
        isCompliant: false,
        status: "Salary Out of Balance",
        alertText: "Trade Rejected ❌ (Salary match failure)",
        colorClass: "border-red-500/20 text-red-500 bg-red-500/5",
        badgeClass: "bg-red-500/10 border-red-500/20 text-red-400",
        netDifference: netSalaryDiff,
        explanation: "Detroit is receiving $" + incoming + "M but sending out just $" + outgoing + "M. Under NBA CBA guidelines, because Detroit exceeds their Cap Room by $" + (netSalaryDiff - capSpaceRoom).toFixed(1) + "M, they must increase outgoing salary by at least $" + overage + "M or find smaller targeted contracts."
      };
    }
  }, [selectedPistonsIds, selectedTargetIds, totalIncomingSalaryText, totalOutgoingSalaryText, excludedPlayerIds.length]);

  // Player Asset Value Calculation Helper
  const calculatePlayerAssetValue = (player: any) => {
    const epmVal = player.epm || 0;
    const salaryNum = typeof player.salary === "number" 
      ? player.salary 
      : parseFloat(player.salary.replace("$", "").replace("M", ""));
    const finalSalary = isNaN(salaryNum) ? 0 : salaryNum;

    // Production metrics
    const production = (epmVal * 15) + (player.per * 1.0) + (player.ppg * 0.8) + (player.rpg * 0.4) + (player.apg * 0.5);
    
    // Age/Potential Premium
    let potentialBonus = 0;
    if (player.age <= 22) potentialBonus = 22;
    else if (player.age <= 25) potentialBonus = 12;
    else if (player.age <= 29) potentialBonus = 4;
    else if (player.age >= 33) potentialBonus = -12;

    // Contract surplus/drag
    const expectedSalary = Math.max(2.0, production * 0.55);
    const contractSurplus = expectedSalary - finalSalary;

    const totalValue = Math.max(5, Math.round(production + potentialBonus + contractSurplus));
    
    return {
      totalValue,
      production: Math.round(production),
      potentialBonus,
      contractSurplus: Math.round(contractSurplus)
    };
  };

  const valuationAnalysis = useMemo(() => {
    const pistonsPlayersVal = outgoingPistons.reduce((sum, p) => sum + calculatePlayerAssetValue(p).totalValue, 0);
    const pistonsPicksVal = AVAILABLE_PISTONS_PICKS
      .filter(pick => selectedPistonsPicks.includes(pick.id))
      .reduce((sum, pick) => sum + pick.value, 0);
    const totalSentToPartner = pistonsPlayersVal + pistonsPicksVal;

    const targetPlayersVal = incomingTargets.reduce((sum, t) => sum + calculatePlayerAssetValue(t).totalValue, 0);
    const targetPicksVal = AVAILABLE_TARGET_PICKS
      .filter(pick => selectedTargetPicks.includes(pick.id))
      .reduce((sum, pick) => sum + pick.value, 0);
    const totalReceivedFromPartner = targetPlayersVal + targetPicksVal;

    // Guard against empty trades
    if (outgoingPistons.length === 0 && incomingTargets.length === 0) {
      return {
        grade: "N/A",
        partnerOpinion: "No Offer Selected",
        color: "text-slate-500",
        bg: "bg-slate-950/40",
        border: "border-slate-800",
        ratio: 1.0,
        suggestion: "Add assets to both sides to run the Smart Valuation scoring engine.",
        sentVal: 0,
        recVal: 0,
        pistonsPlayersVal: 0,
        pistonsPicksVal: 0,
        targetPlayersVal: 0,
        targetPicksVal: 0
      };
    }

    const ratio = totalSentToPartner / Math.max(1, totalReceivedFromPartner);

    let grade = "C";
    let partnerOpinion = "Rejected";
    let color = "text-red-400";
    let bg = "bg-red-500/5";
    let border = "border-red-500/20";
    let suggestion = "";

    if (ratio >= 1.20) {
      grade = "A+";
      partnerOpinion = "Instant Acceptance 🌟";
      color = "text-emerald-400 font-extrabold";
      bg = "bg-emerald-500/10";
      border = "border-emerald-500/30";
      suggestion = "The partner franchise accepts immediately. Detroit might be overpaying—consider removing a draft pick or player from your offer to balance the value.";
    } else if (ratio >= 1.05) {
      grade = "A";
      partnerOpinion = "Strongly Approved ✅";
      color = "text-emerald-400";
      bg = "bg-emerald-500/5";
      border = "border-emerald-500/20";
      suggestion = "Trade accepted! Outstanding value offered to the partner franchise.";
    } else if (ratio >= 0.94) {
      grade = "B+";
      partnerOpinion = "Fair Value Approved 🤝";
      color = "text-blue-400";
      bg = "bg-blue-500/10";
      border = "border-blue-500/20";
      suggestion = "Trade accepted! This is a highly balanced deal representing realistic, equitable value for both organizations.";
    } else if (ratio >= 0.84) {
      grade = "C";
      partnerOpinion = "Hesitant / Neutral ⚖️";
      color = "text-yellow-400";
      bg = "bg-yellow-500/5";
      border = "border-yellow-500/25";
      
      const diffPoints = totalReceivedFromPartner - totalSentToPartner;
      if (diffPoints <= 12) {
        suggestion = "Partner hesitating. To balance this deal, try adding a future 2nd-round draft pick sweetener.";
      } else {
        suggestion = "Partner is slightly short-changed. Detroit needs to add another minor rotation player or a pair of future draft picks.";
      }
    } else if (ratio >= 0.70) {
      grade = "D";
      partnerOpinion = "Rejected ❌";
      color = "text-orange-400";
      bg = "bg-orange-500/5";
      border = "border-orange-500/20";
      suggestion = "Rejected. The value is lopsided. Detroit must offer a future 1st-round draft pick or high-potential young prospect to satisfy the partner GM.";
    } else {
      grade = "F";
      partnerOpinion = "Outright Insult 🚫";
      color = "text-red-500 font-black";
      bg = "bg-red-500/10";
      border = "border-red-500/30";
      suggestion = "The other team's GM hung up the phone. Detroit is heavily underpaying. Add a premium first-round pick or key starter to restart negotiations.";
    }

    return {
      grade,
      partnerOpinion,
      color,
      bg,
      border,
      ratio,
      suggestion,
      sentVal: totalSentToPartner,
      recVal: totalReceivedFromPartner,
      pistonsPlayersVal,
      pistonsPicksVal,
      targetPlayersVal,
      targetPicksVal
    };
  }, [outgoingPistons, incomingTargets, selectedPistonsPicks, selectedTargetPicks]);

  // Handlers
  const handleTogglePistonSelection = (id: string) => {
    setSelectedPistonsIds((prev) => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
    setForceOverride(false);
  };

  const handleToggleTargetSelection = (id: string) => {
    setSelectedTargetIds((prev) => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
    setForceOverride(false);
  };

  const handleClearMachine = () => {
    setSelectedPistonsIds([]);
    setSelectedTargetIds([]);
    setSelectedPistonsPicks([]);
    setSelectedTargetPicks([]);
    setForceOverride(false);
  };

  const handleApplyTradeExecute = () => {
    if (!tradeAnalysis.isCompliant) return;

    // Collect targeted objects
    const outgoingPistonPlayers = roster.filter(p => selectedPistonsIds.includes(p.id));
    const incomingTargetPlayers = mockTradeTargets.filter(t => selectedTargetIds.includes(t.id));

    const outgoingPicksNames = AVAILABLE_PISTONS_PICKS
      .filter(p => selectedPistonsPicks.includes(p.id))
      .map(p => p.name);
    const incomingPicksNames = AVAILABLE_TARGET_PICKS
      .filter(t => selectedTargetPicks.includes(t.id))
      .map(t => t.name);

    // Save summary for success screen
    setSuccessTradeSummary({
      outgoing: [...outgoingPistonPlayers.map(p => p.name), ...outgoingPicksNames],
      incoming: [...incomingTargetPlayers.map(t => t.name), ...incomingPicksNames]
    });

    // Execute app transition
    onExecuteTrade(selectedPistonsIds, incomingTargetPlayers);

    // Reset machine state
    setSelectedPistonsIds([]);
    setSelectedTargetIds([]);
    setSelectedPistonsPicks([]);
    setSelectedTargetPicks([]);
    setForceOverride(false);
    setShowSuccessModal(true);
  };

  return (
    <div id="trade-machine-tab-view" className="flex-1 overflow-y-auto bg-slate-900 p-4 lg:p-8 pb-32 lg:pb-8 text-slate-100">
      
      {/* View Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ArrowLeftRight className="w-7 h-7 md:w-8 md:h-8 text-red-500 rotate-45" />
            <span>Interactive CBA Trade Machine</span>
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
            Package active Pistons and acquire assets from of other NBA roster cores. Test standard salary matching rules, net cap change, and dynamic team composition adjustments.
          </p>
        </div>

        {/* Sub-tab selections within Trade Engine */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto shrink-0 font-mono text-xs">
          <button
            onClick={() => setActiveSubTab("machine")}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
              activeSubTab === "machine" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Machine
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeSubTab === "history" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Trade Logs
            {completedTrades.length > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {completedTrades.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeSubTab === "history" ? (
        // Completed/Saved Trades Screen
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-4xl">
          <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Saved Trade Operations Log</h3>
              <p className="text-xs text-slate-400 mt-0.5">Below are all active trades successfully completed in this simulation.</p>
            </div>
            {completedTrades.length > 0 && (
              <button
                onClick={onResetTrades}
                className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Trades</span>
              </button>
            )}
          </div>

          {completedTrades.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="w-5 h-5 text-slate-600" />
              </div>
              <p className="font-bold text-sm">No saved trades found.</p>
              <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                Go to the <span className="text-blue-400 font-bold">Trade Machine</span> workspace tab, create a legally approved trade, and activate it to see it listed here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedTrades.map((trade) => (
                <div key={trade.id} className="bg-slate-900 p-5 rounded-xl border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{trade.timestamp}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold border border-emerald-500/15">
                        ACTIVE IN SIMULATOR
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-red-400 font-mono">Pistons Sent Out:</span>
                        <div className="mt-1 space-y-1">
                          {trade.outgoingNames.map((name, idx) => (
                            <p key={name} className="text-xs font-bold text-slate-300 flex items-center gap-1">
                              <span className="text-red-500">•</span> {name}
                            </p>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">Total Salary Value: ${trade.outgoingTotalSalary}M</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-blue-400 font-mono">Acquired Players:</span>
                        <div className="mt-1 space-y-1">
                          {trade.incomingNames.map((name, idx) => (
                            <p key={name} className="text-xs font-bold text-slate-300 flex items-center gap-1">
                              <span className="text-blue-500">•</span> {name}
                            </p>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-1 w-full">Total Salary Value: ${trade.incomingTotalSalary}M</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 shrink-0 flex flex-col gap-1 items-start md:items-end justify-center">
                    <span className="text-[11px] font-mono text-slate-400">NET EFFECT:</span>
                    <span className="text-sm font-mono font-extrabold text-white">{trade.netSalaryText}</span>
                    <button
                      onClick={() => onUndoTrade(trade.id)}
                      className="mt-3 px-3 py-1 rounded bg-slate-950 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-slate-850 text-xs font-semibold text-slate-400 cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revert Trade</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Core Interactive Trade Machine Interface
        <div className="space-y-6">
          
          {/* Main Workspace split into columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Lg Span 5: Pistons selection box (WHAT WE OFFER) */}
            <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 lg:p-5 shadow-xl flex flex-col h-[640px]">
              <div className="border-b border-slate-900 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-md font-extrabold text-white tracking-tight flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center font-black text-[9px] text-white">DET</div>
                    <span>DET Send Out</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-none mt-1">Select players to trade away</p>
                </div>
                <span className="text-xs bg-red-600/10 text-red-400 border border-red-500/10 px-2 py-0.5 rounded font-mono font-bold">
                  {selectedPistonsIds.length} Selected
                </span>
              </div>

              {/* Candidates List scroller */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {pistonsTradeCandidates.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 text-xs font-mono">
                    No active Pistons found. If players are benched in simulator, reactivate them first.
                  </div>
                ) : (
                  pistonsTradeCandidates.map((player) => {
                    const isSelected = selectedPistonsIds.includes(player.id);
                    return (
                      <div
                        key={player.id}
                        onClick={() => handleTogglePistonSelection(player.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer select-none transition-all ${
                          isSelected
                            ? "bg-red-950/25 border-red-500/40 shadow-sm"
                            : "bg-slate-900/40 border-slate-850 hover:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center border shrink-0 ${
                            isSelected ? "bg-red-600 text-white border-red-500" : "bg-slate-900 border-slate-800 text-slate-400"
                          }`}>
                            {player.number}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs text-slate-100 truncate">{player.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {player.position} • PPG: {player.ppg} • Age: {player.age}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-red-400">{player.salary}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Draft Picks Offered Sweetener List */}
              <div className="border-t border-slate-900 pt-3 mt-3">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  DET Draft Picks Offered:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                  {AVAILABLE_PISTONS_PICKS.map((pick) => {
                    const isSelected = selectedPistonsPicks.includes(pick.id);
                    return (
                      <button
                        key={pick.id}
                        type="button"
                        onClick={() => {
                          setSelectedPistonsPicks(prev => 
                            prev.includes(pick.id) ? prev.filter(id => id !== pick.id) : [...prev, pick.id]
                          );
                          setForceOverride(false);
                        }}
                        className={`px-2 py-1 rounded border text-[9px] font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-red-950/40 border-red-500/60 text-red-400"
                            : "bg-slate-900/60 border-slate-850 text-slate-500 hover:border-slate-800 hover:text-slate-350"
                        }`}
                      >
                        {isSelected ? "★ " : "+ "} {pick.name} (+{pick.value})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Offer total footer */}
              <div className="border-t border-slate-900 pt-3 mt-3 flex items-center justify-between font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase font-bold block">Total Outgoing:</span>
                  <span className="text-[9px] text-slate-400 mt-0.5 block">Assets: {valuationAnalysis.pistonsPlayersVal + valuationAnalysis.pistonsPicksVal} pts</span>
                </div>
                <span className="text-sm font-black text-red-400">${totalOutgoingSalaryText.toFixed(1)}M/yr</span>
              </div>
            </div>

            {/* Lg Span 8: Targets selection box (WHAT WE ACQUIRE) */}
            <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 lg:p-5 shadow-xl flex flex-col h-[640px]">
              
              {/* Header */}
              <div className="border-b border-slate-900 pb-3 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h3 className="text-md font-extrabold text-white tracking-tight flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Target NBA Players</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-none mt-1">Select players to add to Detroit</p>
                </div>
                
                {/* Search controller */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative bg-slate-900 border border-slate-800 rounded-lg py-1 px-2.5 flex items-center gap-2 min-w-[150px] sm:min-w-[180px]">
                    <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-xs text-white focus:outline-hidden w-full placeholder:text-slate-600"
                    />
                  </div>

                  {/* Position selector */}
                  <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] font-mono text-slate-400 focus:outline-hidden"
                  >
                    <option value="All">All Pos</option>
                    <option value="PG">PG</option>
                    <option value="SG">SG</option>
                    <option value="SF">SF</option>
                    <option value="PF">PF</option>
                    <option value="C">C</option>
                  </select>

                  {/* Team selector */}
                  <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] max-w-[124px] font-mono text-slate-400 focus:outline-hidden"
                  >
                    <option value="All">All Teams</option>
                    {teamsList.map(t => (
                      <option key={t} value={t}>{t.replace("Trail Blazers", "Blazers")}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scrollable list of options */}
              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                {filteredTargets.length === 0 ? (
                  <div className="col-span-1 sm:col-span-2 text-center py-16 text-slate-600 text-xs font-mono">
                    No matching trade targets found for "{searchQuery}".
                  </div>
                ) : (
                  filteredTargets.map((target) => {
                    const isSelected = selectedTargetIds.includes(target.id);
                    return (
                      <div
                        key={target.id}
                        onClick={() => handleToggleTargetSelection(target.id)}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 cursor-pointer select-none transition-all ${
                          isSelected
                            ? "bg-blue-950/20 border-blue-500/45 shadow-md shadow-blue-500/5"
                            : "bg-slate-900/40 border-slate-850 hover:border-slate-800 hover:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5 leading-tight">
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-tight">
                              {target.team.replace("Minnesota Timberwolves", "Timberwolves").replace("Trail Blazers", "Blazers")}
                            </span>
                            <h4 className="font-bold text-xs text-white truncate mt-0.5">{target.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {target.position} • Age: {target.age} • PPG: {target.ppg}
                            </p>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                            ${target.salary.toFixed(1)}M/yr
                          </span>
                        </div>

                        {/* Extra analysis pill */}
                        <div className="flex items-center justify-between border-t border-slate-900/40 pt-2 flex-wrap gap-1">
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-500">
                            EPM: <strong className="text-blue-400">{target.epm > 0 ? `+${target.epm}` : target.epm}</strong>
                          </span>
                          <span className="px-1.5 py-0.5 bg-slate-900/60 border border-slate-850 rounded text-[9px] font-mono font-bold text-slate-400 uppercase">
                            {target.benefit === "shooting" ? "🎯 Spacer" : target.benefit === "defense" ? "🛡️ Defender" : target.benefit === "playmaking" ? "⚡ Playmaker" : "💪 Size"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Draft Picks Received Sweetener List */}
              <div className="border-t border-slate-900 pt-3 mt-3">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Partner Draft Picks Included:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                  {AVAILABLE_TARGET_PICKS.map((pick) => {
                    const isSelected = selectedTargetPicks.includes(pick.id);
                    return (
                      <button
                        key={pick.id}
                        type="button"
                        onClick={() => {
                          setSelectedTargetPicks(prev => 
                            prev.includes(pick.id) ? prev.filter(id => id !== pick.id) : [...prev, pick.id]
                          );
                          setForceOverride(false);
                        }}
                        className={`px-2 py-1 rounded border text-[9px] font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-950/40 border-blue-500/60 text-blue-400"
                            : "bg-slate-900/60 border-slate-850 text-slate-500 hover:border-slate-800 hover:text-slate-355"
                        }`}
                      >
                        {isSelected ? "★ " : "+ "} {pick.name} (+{pick.value})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Offer total footer */}
              <div className="border-t border-slate-900 pt-3 mt-3 flex items-center justify-between font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase font-bold block">Total Incoming:</span>
                  <span className="text-[9px] text-slate-400 mt-0.5 block">Assets: {valuationAnalysis.targetPlayersVal + valuationAnalysis.targetPicksVal} pts</span>
                </div>
                <span className="text-sm font-black text-blue-400">${totalIncomingSalaryText.toFixed(1)}M/yr</span>
              </div>
            </div>

          </div>

          {/* Trade rule checks, cap matching calculator & execution bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950 border border-slate-800 rounded-3xl p-5 lg:p-7 shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 h-1.5 w-full ${tradeAnalysis.isCompliant ? 'bg-emerald-500' : 'bg-slate-800'}`} />
            
            {/* Left 6 Columns: CBA Math and Compliance Explanation */}
            <div className="lg:col-span-6 space-y-4">
              <div className={`p-5 rounded-2xl border h-full flex flex-col justify-between ${tradeAnalysis.colorClass}`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      CBA Financial Compliance
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${tradeAnalysis.badgeClass}`}>
                      {tradeAnalysis.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-200">{tradeAnalysis.alertText}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">{tradeAnalysis.explanation}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-900/40">
                      <span className="text-[9px] text-slate-500 block font-mono uppercase">Payroll Net Change:</span>
                      <span className={`text-sm font-bold font-mono block mt-0.5 ${tradeAnalysis.netDifference > 0 ? 'text-red-400' : tradeAnalysis.netDifference < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {tradeAnalysis.netDifference > 0 ? `+$${tradeAnalysis.netDifference}M` : tradeAnalysis.netDifference < 0 ? `-$${Math.abs(tradeAnalysis.netDifference)}M` : "$0M"}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-900/40">
                      <span className="text-[9px] text-slate-500 block font-mono uppercase">Roster slots:</span>
                      <span className="text-sm font-bold font-mono text-white block mt-0.5">
                        {10 - excludedPlayerIds.length - selectedPistonsIds.length + selectedTargetIds.length} / 15 slots
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 6 Columns: Smart Trade Realism & Asset-Value Evaluator */}
            <div className="lg:col-span-6 space-y-4">
              <div className={`p-5 rounded-2xl border h-full flex flex-col justify-between ${valuationAnalysis.bg} ${valuationAnalysis.border}`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-blue-400" />
                      Front-Office Asset Realism
                    </span>
                    <span className={`text-xl font-black font-mono px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 ${valuationAnalysis.color}`}>
                      {valuationAnalysis.grade}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Detroit Offered Value:</span>
                      <span className="font-mono font-bold text-red-400">{valuationAnalysis.sentVal} pts</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Partner Offered Value:</span>
                      <span className="font-mono font-bold text-blue-400">{valuationAnalysis.recVal} pts</span>
                    </div>
                    <div className="border-t border-slate-900/40 my-2 pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Opposition GM Response:</span>
                      <span className={`font-black uppercase tracking-tight text-xs ${valuationAnalysis.color}`}>{valuationAnalysis.partnerOpinion}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-3 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-900/40 font-sans">
                    {valuationAnalysis.suggestion}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom 12 Columns: Veto Override and Execution Controls */}
            <div className="lg:col-span-12 border-t border-slate-900 pt-5 mt-2 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {selectedPistonsIds.length > 0 && selectedTargetIds.length > 0 && 
                 (valuationAnalysis.grade === "C" || valuationAnalysis.grade === "D" || valuationAnalysis.grade === "F") ? (
                  <label className="inline-flex items-center gap-2.5 bg-yellow-400/5 hover:bg-yellow-400/10 border border-yellow-400/10 px-4 py-2.5 rounded-xl cursor-pointer transition-all select-none">
                    <input
                      type="checkbox"
                      checked={forceOverride}
                      onChange={(e) => setForceOverride(e.target.checked)}
                      className="rounded border-slate-800 text-yellow-500 focus:ring-yellow-500 bg-slate-900 w-4 h-4 cursor-pointer"
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-yellow-400 block flex items-center gap-1 leading-none">
                        <ShieldAlert className="w-3.5 h-3.5" /> Force Front-Office Override
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block leading-none">Bypass other team's GM veto & authorize deal</span>
                    </div>
                  </label>
                ) : (
                  <div className="text-xs text-slate-500 font-mono">
                    {selectedPistonsIds.length === 0 && selectedTargetIds.length === 0 ? (
                      "Select assets above to initiate front-office grading."
                    ) : (
                      "✓ Trade partner GMs approve. Veto override not required."
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <button
                  disabled={selectedPistonsIds.length === 0 && selectedTargetIds.length === 0}
                  onClick={handleClearMachine}
                  className="px-5 py-3.5 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 font-bold hover:text-white hover:border-slate-750 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-xs"
                >
                  Clear Offer
                </button>

                <button
                  disabled={
                    !tradeAnalysis.isCompliant || 
                    ((valuationAnalysis.grade === "C" || valuationAnalysis.grade === "D" || valuationAnalysis.grade === "F") && !forceOverride)
                  }
                  onClick={handleApplyTradeExecute}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-blue-600 to-indigo-600 text-white font-extrabold shadow-lg shadow-blue-500/10 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed transition-all cursor-pointer text-xs flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  <span>Execute & Save Trade</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Confetti celebration success overlay / modal */}
      {showSuccessModal && successTradeSummary && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 lg:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 h-1.5 w-full bg-linear-to-r from-red-500 via-blue-500 to-emerald-500" />
            
            {/* Visual Success Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl lg:text-2xl font-black text-white tracking-tight">Trade Approved & Executed!</h3>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              The Detroit Front Office has approved the deal! The CBA matcher authorized contracts and roster slot occupancy.
            </p>

            {/* Visual breakdown core */}
            <div className="my-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-850 text-left space-y-3.5">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-red-400 font-bold uppercase block">TRADED AWAY (Outgoing):</span>
                <p className="text-xs font-bold text-slate-300 mt-1">
                  {successTradeSummary.outgoing.join(", ")}
                </p>
              </div>
              <div className="border-t border-slate-900/60 pt-3">
                <span className="text-[10px] font-mono tracking-wider text-blue-400 font-bold uppercase block">ACQUIRED FROM TRADE:</span>
                <p className="text-xs font-bold text-slate-300 mt-1">
                  {successTradeSummary.incoming.join(", ")}
                </p>
              </div>
            </div>

            <p className="text-xs text-yellow-400 font-medium bg-yellow-400/5 border border-yellow-400/10 p-3 rounded-xl max-w-sm mx-auto mb-6 leading-relaxed">
              💡 Head over to the <strong className="text-white">Roster Simulator</strong> tab to see how acquiring this talent dynamic impacts your rotation needs & advanced analytics!
            </p>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                setSuccessTradeSummary(null);
              }}
              className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs cursor-pointer shadow-md shadow-blue-600/10 transition-colors w-full sm:w-auto"
            >
              Back to Simulator Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
