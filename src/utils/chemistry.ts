import { Player, DraftProspect, FreeAgent } from "../types";

export interface ArchetypeInfo {
  offensive: string;
  defensive: string;
}

/**
 * Classifies any player, draft prospect, or free agent into specific offensive and defensive basketball archetypes.
 */
export function getPlayerArchetypes(player: any): ArchetypeInfo {
  const name = player.name || "";
  const id = player.id || "";
  const strengths = (player.strengths || []).map((s: string) => s.toLowerCase());
  const weaknesses = (player.weaknesses || []).map((w: string) => w.toLowerCase());
  const primaryBenefit = player.primaryBenefit || player.benefit || "";
  const pos = player.position || "";

  let offensive = "Low-Usage Connector";
  let defensive = "Help-Side Interceptor";

  // 1. Offensive Archetype
  if (
    id === "cade-cunningham" || 
    name.includes("Cunningham") || 
    name.includes("Chris Paul") || 
    name.includes("McConnell") ||
    id.includes("okorie") || 
    id.includes("peterson") || 
    id.includes("sasser") ||
    strengths.some((s: string) => s.includes("pick-and-roll") || s.includes("playmaking") || s.includes("court vision") || s.includes("handler"))
  ) {
    offensive = "High-Frequency P&R Handler";
  } else if (
    id === "jalen-duren" || 
    name.includes("Kessler") || 
    name.includes("Maluach") || 
    name.includes("Staton") || 
    name.includes("Hayes") || 
    strengths.some((s: string) => s.includes("lob") || s.includes("rim run") || s.includes("dunk") || s.includes("vertical spacer"))
  ) {
    offensive = "Vertical Lob Threat";
  } else if (
    id === "malik-beasley" || 
    name.includes("Beasley") || 
    name.includes("Fontecchio") || 
    name.includes("Ament") || 
    name.includes("Kennard") || 
    primaryBenefit === "shooting" ||
    strengths.some((s: string) => s.includes("shooting") || s.includes("3pt") || s.includes("spacer") || s.includes("catch-and-shoot") || s.includes("perimeter spacing"))
  ) {
    offensive = "Catch-and-Shoot Specialist";
  } else if (
    id === "jaden-ivey" || 
    id === "ron-holland" || 
    name.includes("Ivey") || 
    name.includes("Holland") || 
    name.includes("Bailey") ||
    strengths.some((s: string) => s.includes("transition") || s.includes("motor") || s.includes("first step") || s.includes("slashing") || s.includes("athletic"))
  ) {
    if (primaryBenefit === "shooting" || name.includes("Bailey") || id === "jaden-ivey") {
      offensive = "Three-Level Shot Creator";
    } else {
      offensive = "Transition-Play Initiator";
    }
  } else if (
    name.includes("Dybantsa") || 
    name.includes("Thomas") || 
    id === "tobias-harris" ||
    name.includes("Harris") ||
    primaryBenefit === "scoring" ||
    strengths.some((s: string) => s.includes("shot-creation") || s.includes("scoring") || s.includes("isolation"))
  ) {
    offensive = "Three-Level Shot Creator";
  }

  // 2. Defensive Archetype
  if (
    id === "ausar-thompson" || 
    name.includes("Thompson") || 
    name.includes("Derrick Jones") || 
    name.includes("McConnell") || 
    strengths.some((s: string) => s.includes("point-of-attack") || s.includes("wing stopping") || s.includes("on-ball") || s.includes("lockdown") || s.includes("perimeter defense") || s.includes("perimeter wing lockdown"))
  ) {
    defensive = "Point-of-Attack (POA) Defender";
  } else if (
    id === "jalen-duren" || 
    name.includes("Turner") || 
    name.includes("Kessler") || 
    name.includes("Maluach") || 
    name.includes("Staton") ||
    strengths.some((s: string) => s.includes("rim protection") || s.includes("shot blocking") || s.includes("anchor") || s.includes("rim protector"))
  ) {
    defensive = "Rim Protection Anchor";
  } else if (
    id === "isaiah-stewart" || 
    name.includes("Stewart") || 
    name.includes("Wilson") || 
    strengths.some((s: string) => s.includes("switch") || s.includes("versat") || s.includes("multi-positional"))
  ) {
    defensive = "Versatile Switch Defender";
  } else if (
    id === "ron-holland" || 
    name.includes("Holland") || 
    name.includes("Boozer") || 
    strengths.some((s: string) => s.includes("help") || s.includes("motor") || s.includes("interceptor") || s.includes("rebounding"))
  ) {
    defensive = "Help-Side Interceptor";
  }

  return { offensive, defensive };
}

export interface SkillDeficiencyAlert {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "optimized";
  solution: string;
}

export interface LineupSynergyAnalysis {
  netRating: number;
  offensiveRating: number;
  defensiveRating: number;
  spacingRating: number; // 2 to 10
  synergyBoosts: string[];
  synergyPenalties: string[];
  alerts: SkillDeficiencyAlert[];
  archetypesBreakdown: { [key: string]: number };
}

/**
 * Calculates full on-court chemistry, spacing gravity, synergy bonuses/penalties,
 * and skill deficiency alerts for any simulated squad.
 */
export function calculateLineupSynergy(players: any[]): LineupSynergyAnalysis {
  const archetypes = players.map(p => ({
    player: p,
    archetype: getPlayerArchetypes(p)
  }));

  // Count archetypes
  const offensiveCount: { [key: string]: number } = {};
  const defensiveCount: { [key: string]: number } = {};

  archetypes.forEach(({ archetype }) => {
    offensiveCount[archetype.offensive] = (offensiveCount[archetype.offensive] || 0) + 1;
    defensiveCount[archetype.defensive] = (defensiveCount[archetype.defensive] || 0) + 1;
  });

  // Advanced Plus-Minus aggregation (EPM and DARKO)
  // We look at the top 8 rotation players (or all active if fewer) to establish the team baseline
  const sortedRotation = [...players].sort((a, b) => {
    const aVal = (a.epm ?? a.darko ?? 0);
    const bVal = (b.epm ?? b.darko ?? 0);
    return bVal - aVal;
  }).slice(0, 8);

  const avgEPM = sortedRotation.length > 0 
    ? sortedRotation.reduce((sum, p) => sum + (p.epm ?? 0), 0) / sortedRotation.length
    : 0;

  const avgDARKO = sortedRotation.length > 0 
    ? sortedRotation.reduce((sum, p) => sum + (p.darko ?? 0), 0) / sortedRotation.length
    : 0;

  // Baseline ratings
  // Standard NBA Average is 110.0 for Offense/Defense, Net Rating is Offense - Defense
  // Average team EPM is 0. Each +1.0 in average rotation EPM correlates to roughly +3.0 in net rating.
  let netRating = +(avgEPM * 3.5 + avgDARKO * 1.5).toFixed(2);
  let offensiveRating = +(110.0 + avgEPM * 2.0).toFixed(1);
  let defensiveRating = +(110.0 - avgEPM * 1.5).toFixed(1);

  const synergyBoosts: string[] = [];
  const synergyPenalties: string[] = [];
  const alerts: SkillDeficiencyAlert[] = [];

  // --- 1. SPACING & GRAVITY CALCULATION ---
  const shootCount = offensiveCount["Catch-and-Shoot Specialist"] || 0;
  const creatorCount = offensiveCount["Three-Level Shot Creator"] || 0;
  
  // Count non-shooters in top 8
  const nonShooters = sortedRotation.filter(p => {
    const weaknesses = (p.weaknesses || []).map((w: string) => w.toLowerCase());
    return weaknesses.some((w: string) => w.includes("3pt") || w.includes("shooting") || w.includes("spacing"));
  }).length;

  // Stretch big bonus (Center or PF who is Catch-and-Shoot Specialist)
  const hasStretchBig = players.some(p => {
    const arch = getPlayerArchetypes(p);
    const pos = p.position || "";
    return (pos.includes("C") || pos.includes("PF")) && arch.offensive === "Catch-and-Shoot Specialist";
  });

  let spacingRating = 4.0 + (shootCount * 1.5) + (creatorCount * 0.8);
  if (hasStretchBig) {
    spacingRating += 1.2;
    synergyBoosts.push("Five-Out Stretch: Stretch-big pulling shot-blockers out of the paint (+1.2 Spacing)");
  }
  spacingRating -= (nonShooters * 0.8);
  spacingRating = Math.min(10, Math.max(2, +spacingRating.toFixed(1)));

  // Spacing Net Impact
  if (spacingRating >= 8.5) {
    netRating += 1.8;
    offensiveRating += 2.0;
    synergyBoosts.push("Elite Spacing Gravity: Wide driving lanes maximize Cunningham/Ivey slash value (+1.8 Net Rating)");
  } else if (spacingRating < 4.5) {
    netRating -= 2.2;
    offensiveRating -= 2.5;
    synergyPenalties.push("Clogged Driving Lanes: Opponents drop into the paint, stalling pick-and-roll drives (-2.2 Net Rating)");
  }

  // --- 2. CHEMISTRY & SYNERGY COMBINATIONS ---
  const hasPRHandler = offensiveCount["High-Frequency P&R Handler"] > 0;
  const hasLobThreat = offensiveCount["Vertical Lob Threat"] > 0;
  const hasPOADefender = defensiveCount["Point-of-Attack (POA) Defender"] > 0;
  const hasRimAnchor = defensiveCount["Rim Protection Anchor"] > 0;
  const hasSwitchDef = defensiveCount["Versatile Switch Defender"] > 0;
  const hasTransition = offensiveCount["Transition-Play Initiator"] > 0;

  // Lob Threat Synergy
  if (hasPRHandler && hasLobThreat) {
    netRating += 1.2;
    offensiveRating += 1.5;
    synergyBoosts.push("Lob City Pick-and-Roll: Dynamic vertical spacer opens up easy roll-man alley-oops (+1.2 Net Rating)");
  }

  // Lockdown Defense Synergy
  if (hasPOADefender && hasRimAnchor) {
    netRating += 1.8;
    defensiveRating -= 2.2;
    synergyBoosts.push("POA-to-Anchor Funnel: Ball-handlers forced into elite paint shot-blockers (-2.2 Defensive Rating)");
  } else if (hasRimAnchor) {
    netRating += 0.8;
    defensiveRating -= 1.0;
    synergyBoosts.push("Rim Protection Anchor: Elite interior paint security active (-1.0 Defensive Rating)");
  }

  // Switchability Synergy
  if (hasSwitchDef && hasPOADefender) {
    netRating += 1.0;
    defensiveRating -= 1.2;
    synergyBoosts.push("Modern Switch Defense: Perimeter screens neutralized via clean physical handoffs (-1.2 Defensive Rating)");
  }

  // Primary Handler Fatigue Mitigation
  const isCadeActive = players.some(p => p.id === "cade-cunningham");
  const secondaryHandlers = (offensiveCount["High-Frequency P&R Handler"] || 0) + (offensiveCount["Three-Level Shot Creator"] || 0);
  
  if (isCadeActive && secondaryHandlers < 2) {
    netRating -= 1.5;
    offensiveRating -= 1.8;
    synergyPenalties.push("Cunningham Overload: Lack of secondary playmaking forces excessive usage and fatigue (-1.5 Net Rating)");
  } else if (isCadeActive && secondaryHandlers >= 2) {
    netRating += 0.8;
    offensiveRating += 1.0;
    synergyBoosts.push("Playmaking Burden Relieved: Cunningham preserved for elite crunch-time execution (+0.8 Net Rating)");
  }

  // --- 3. SKILL DEFICIENCY ALERTS ---
  // Perimeter Shooting Deficit
  if (shootCount < 2) {
    alerts.push({
      id: "deficit-shooting",
      title: "Perimeter Shooting Deficit",
      description: "Fewer than 2 Catch-and-Shoot Specialists. Detroit's young drives will be constantly contested by collapsing help defenders.",
      severity: "critical",
      solution: "Add a premium spacer (e.g., draft Nate Ament, or sign Malik Beasley/Luke Kennard)."
    });
  }

  // POA Defender Deficit
  if (!hasPOADefender) {
    alerts.push({
      id: "deficit-poa",
      title: "No Point-of-Attack Defender",
      description: "Missing a shutdown perimeter stopper. Opposing elite guards will penetrate deep into your defense at will.",
      severity: "critical",
      solution: "Ensure Ausar Thompson is active, draft Jasper Johnson, or sign Derrick Jones Jr."
    });
  }

  // Rim Protection Deficit
  if (!hasRimAnchor) {
    alerts.push({
      id: "deficit-rim",
      title: "Rim Protection Deficiency",
      description: "No dedicated paint-swatting anchor active on the simulated roster. Inside defense will suffer heavily.",
      severity: "warning",
      solution: "Ensure Jalen Duren is active, draft Khaman Maluach/Xavion Staton, or sign Myles Turner."
    });
  }

  // Transition Deficit
  if (!hasTransition) {
    alerts.push({
      id: "deficit-transition",
      title: "No Transition Play Initiator",
      description: "Missing a player who can grab defensive rebounds and immediately push the ball to jumpstart early offense.",
      severity: "warning",
      solution: "Keep Jaden Ivey or Ron Holland II active, or draft Ace Bailey."
    });
  }

  // Cade Cunningham Isolation fatigue
  if (isCadeActive && secondaryHandlers < 2) {
    alerts.push({
      id: "deficit-secondary-playmaker",
      title: "Playmaking Overload on Cunningham",
      description: "Cade Cunningham is acting as your sole half-court initiator. High turnovers and fourth-quarter fatigue will limit efficiency.",
      severity: "warning",
      solution: "Add a secondary ball-handler (e.g., draft Ebuka Okorie/Darryn Peterson, or sign T.J. McConnell/Chris Paul)."
    });
  }

  // Build the archetypes count breakdown for simple UI display
  const archetypesBreakdown: { [key: string]: number } = {};
  Object.keys(offensiveCount).forEach(k => { archetypesBreakdown[k] = offensiveCount[k]; });
  Object.keys(defensiveCount).forEach(k => { archetypesBreakdown[k] = (archetypesBreakdown[k] || 0) + defensiveCount[k]; });

  return {
    netRating: +netRating.toFixed(2),
    offensiveRating: +offensiveRating.toFixed(1),
    defensiveRating: +defensiveRating.toFixed(1),
    spacingRating,
    synergyBoosts,
    synergyPenalties,
    alerts,
    archetypesBreakdown
  };
}
