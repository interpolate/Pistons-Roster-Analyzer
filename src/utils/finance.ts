import { Player, DraftProspect, FreeAgent } from "../types";

export interface CBAConfig {
  salaryCap: number; // $155.1M for 2026-27
  luxuryTax: number; // $188.4M
  firstApron: number; // $195.9M
  secondApron: number; // $208.5M
  nonTaxpayerMLE: number; // $14.1M
  taxpayerMLE: number; // $5.6M
  roomMLE: number; // $8.4M
  biAnnualException: number; // $5.0M
}

export const CBA_LIMITS: CBAConfig = {
  salaryCap: 155.1,
  luxuryTax: 188.4,
  firstApron: 195.9,
  secondApron: 208.5,
  nonTaxpayerMLE: 14.1,
  taxpayerMLE: 5.6,
  roomMLE: 8.4,
  biAnnualException: 5.0
};

export interface MultiYearContract {
  playerId: string;
  playerName: string;
  position: string;
  salaries: {
    "2026-27": number;
    "2027-28": number;
    "2028-29": number;
    "2029-30": number;
  };
  statuses: {
    "2026-27": "Guaranteed" | "Qualifying Offer" | "Cap Hold";
    "2027-28": "Guaranteed" | "Player Option" | "Team Option" | "Non-Guaranteed" | "Qualifying Offer" | "UFA";
    "2028-29": "Guaranteed" | "Player Option" | "Team Option" | "Non-Guaranteed" | "Qualifying Offer" | "UFA";
    "2029-30": "Guaranteed" | "Player Option" | "Team Option" | "Non-Guaranteed" | "Qualifying Offer" | "UFA";
  };
  isCustom?: boolean;
}

// Initial standard Pistons contract schedule
export const BASE_ROSTER_CONTRACTS: { [id: string]: Omit<MultiYearContract, "playerId" | "playerName" | "position"> } = {
  "cade-cunningham": {
    salaries: { "2026-27": 35.1, "2027-28": 37.9, "2028-29": 40.7, "2029-30": 43.5 },
    statuses: { "2026-27": "Guaranteed", "2027-28": "Guaranteed", "2028-29": "Guaranteed", "2029-30": "Guaranteed" }
  },
  "tobias-harris": {
    salaries: { "2026-27": 25.3, "2027-28": 26.5, "2028-29": 27.7, "2029-30": 0 },
    statuses: { "2026-27": "Guaranteed", "2027-28": "Guaranteed", "2028-29": "Team Option", "2029-30": "UFA" }
  },
  "isaiah-stewart": {
    salaries: { "2026-27": 15.0, "2027-28": 15.0, "2028-29": 15.0, "2029-30": 0 },
    statuses: { "2026-27": "Guaranteed", "2027-28": "Guaranteed", "2028-29": "Team Option", "2029-30": "UFA" }
  },
  "ron-holland": {
    salaries: { "2026-27": 8.8, "2027-28": 9.2, "2028-29": 9.6, "2029-30": 12.2 },
    statuses: { "2026-27": "Guaranteed", "2027-28": "Guaranteed", "2028-29": "Team Option", "2029-30": "Qualifying Offer" }
  },
  "ausar-thompson": {
    salaries: { "2026-27": 8.4, "2027-28": 11.1, "2028-29": 14.8, "2029-30": 0 },
    statuses: { "2026-27": "Guaranteed", "2027-28": "Team Option", "2028-29": "Qualifying Offer", "2029-30": "UFA" }
  },
  "jaden-ivey": {
    salaries: { "2026-27": 8.0, "2027-28": 10.1, "2028-29": 13.5, "2029-30": 0 },
    statuses: { "2026-27": "Guaranteed", "2027-28": "Team Option", "2028-29": "Qualifying Offer", "2029-30": "UFA" }
  },
  "simone-fontecchio": {
    salaries: { "2026-27": 8.0, "2027-28": 8.0, "2028-29": 0, "2029-30": 0 },
    statuses: { "2026-27": "Guaranteed", "2027-28": "Non-Guaranteed", "2028-29": "UFA", "2029-30": "UFA" }
  },
  "ebuka-okorie": {
    salaries: { "2026-27": 6.2, "2027-28": 6.5, "2028-29": 6.8, "2029-30": 7.1 },
    statuses: { "2026-27": "Guaranteed", "2027-28": "Guaranteed", "2028-29": "Team Option", "2029-30": "Team Option" }
  },
  "malik-beasley": {
    salaries: { "2026-27": 6.0, "2027-28": 6.0, "2028-29": 0, "2029-30": 0 },
    statuses: { "2026-27": "Guaranteed", "2027-28": "Guaranteed", "2028-29": "UFA", "2029-30": "UFA" }
  },
  "jalen-duren": {
    salaries: { "2026-27": 5.1, "2027-28": 6.5, "2028-29": 8.5, "2029-30": 0 },
    statuses: { "2026-27": "Guaranteed", "2027-28": "Team Option", "2028-29": "Qualifying Offer", "2029-30": "UFA" }
  },
  "marcus-sasser": {
    salaries: { "2026-27": 2.7, "2027-28": 2.8, "2028-29": 4.2, "2029-30": 0 },
    statuses: { "2026-27": "Guaranteed", "2027-28": "Guaranteed", "2028-29": "Team Option", "2029-30": "UFA" }
  },
  "isaiah-joe": {
    salaries: { "2026-27": 12.0, "2027-28": 12.0, "2028-29": 12.0, "2029-30": 0 },
    statuses: { "2026-27": "Guaranteed", "2027-28": "Guaranteed", "2028-29": "Guaranteed", "2029-30": "UFA" }
  }
};

export interface CBAValidationResult {
  isLegal: boolean;
  warnings: string[];
  exceptionsTriggered: string[];
  hardCappedAt: "First Apron" | "Second Apron" | "None";
  payroll: number;
  capSpace: number;
  apronStatus: "Under Apron" | "Above First Apron" | "Above Second Apron";
  luxuryTaxOverage: number;
}

/**
 * Calculates current CBA status, tax obligations, apron status, hard cap triggers,
 * and outputs precise structural advice.
 */
export function validateCBAPayroll(
  activePlayers: any[],
  signedFreeAgents: FreeAgent[],
  draftedProspects: DraftProspect[],
  acquiredPlayers: any[],
  optionsOverrides: { [key: string]: { [year: string]: boolean } } = {}
): CBAValidationResult {
  // Let's compute actual active payroll for 2026-27
  let payroll = 0;

  activePlayers.forEach(p => {
    let salaryNum = 0;
    if (typeof p.salary === "number") {
      salaryNum = p.salary;
    } else if (typeof p.salary === "string") {
      salaryNum = parseFloat(p.salary.replace("$", "").replace("M", ""));
    } else if (p.projectedSalary) {
      salaryNum = p.projectedSalary;
    }
    if (!isNaN(salaryNum)) {
      payroll += salaryNum;
    }
  });

  // Calculate Draft Prospect scale salaries for active roster
  draftedProspects.forEach(dp => {
    // Standard Rookie Scale is around $4.5M - $6.5M depending on round
    const estimatedRookieSalary = dp.projectedRange?.toLowerCase().includes("top") ? 6.2 : 4.5;
    payroll += estimatedRookieSalary;
  });

  payroll = +payroll.toFixed(1);

  const capSpace = payroll < CBA_LIMITS.salaryCap 
    ? +(CBA_LIMITS.salaryCap - payroll).toFixed(1) 
    : 0;

  const warnings: string[] = [];
  const exceptionsTriggered: string[] = [];
  let hardCappedAt: "First Apron" | "Second Apron" | "None" = "None";

  // Check Exception triggers
  const isOperatingAboveCap = payroll > CBA_LIMITS.salaryCap;
  const hasVeteranAdditions = signedFreeAgents.some(fa => fa.tier === "Premium Starter" || fa.tier === "Valued Role Player");
  const hasMidLevelAdditions = signedFreeAgents.some(fa => fa.projectedSalary > 6.0 && fa.projectedSalary <= 14.1);

  if (isOperatingAboveCap) {
    if (hasMidLevelAdditions) {
      exceptionsTriggered.push("Non-Taxpayer Mid-Level Exception (MLE) - utilized up to $14.1M");
      hardCappedAt = "First Apron";
      warnings.push("Utilizing the Non-Taxpayer Mid-Level Exception hard-caps Detroit at the First Apron ($195.9M). No further acquisitions can exceed this limit.");
    } else if (hasVeteranAdditions) {
      exceptionsTriggered.push("Bi-Annual Exception (BAE) - utilized up to $5.0M");
      hardCappedAt = "First Apron";
      warnings.push("Using the Bi-Annual Exception triggers a hard cap at the First Apron ($195.9M).");
    } else {
      exceptionsTriggered.push("Minimum Player Salary Exceptions");
    }
  }

  // Check Aprons and Hard Cap Violations
  let apronStatus: "Under Apron" | "Above First Apron" | "Above Second Apron" = "Under Apron";
  let luxuryTaxOverage = 0;

  if (payroll > CBA_LIMITS.luxuryTax) {
    luxuryTaxOverage = +(payroll - CBA_LIMITS.luxuryTax).toFixed(1);
    warnings.push(`Pistons have exceeded the Luxury Tax Line ($188.4M) by $${luxuryTaxOverage}M. Tax penalties will apply.`);
  }

  if (payroll > CBA_LIMITS.secondApron) {
    apronStatus = "Above Second Apron";
    warnings.push("CRITICAL: Detroit exceeds the Second Luxury Tax Apron ($208.5M). Under the 2026 CBA, team loses MLE, trade aggregation, and sending cash in trades.");
  } else if (payroll > CBA_LIMITS.firstApron) {
    apronStatus = "Above First Apron";
    warnings.push("WARNING: Detroit exceeds the First Luxury Tax Apron ($195.9M). Cannot acquire players via sign-and-trade or absorb salary increases in trades.");
  }

  let isLegal = true;
  if (hardCappedAt === "First Apron" && payroll > CBA_LIMITS.firstApron) {
    isLegal = false;
    warnings.push("CBA RULE VIOLATION: Detroit has triggered a Hard Cap at the First Apron ($195.9M) but total payroll is $" + payroll + "M!");
  } else if (payroll > CBA_LIMITS.secondApron) {
    // Above Second Apron is legal but extremely punitive, let's flag as illegal if they try to sign players using cap room
    if (signedFreeAgents.length > 0 && capSpace === 0) {
      isLegal = false;
      warnings.push("CBA RULE VIOLATION: Cannot sign standard Free Agents without Cap Space or above Second Apron exception limits.");
    }
  }

  return {
    isLegal,
    warnings,
    exceptionsTriggered,
    hardCappedAt,
    payroll,
    capSpace,
    apronStatus,
    luxuryTaxOverage
  };
}

/**
 * Generates dynamic Multi-Year cap sheet rows incorporating user simulation overrides
 * and transaction outcomes (Trades, Free Agents, Draft additions).
 */
export function generateDynamicCapSheet(
  activePlayers: any[],
  signedFreeAgents: FreeAgent[],
  draftedProspects: DraftProspect[],
  acquiredPlayers: any[],
  optionsOverrides: { [key: string]: { [year: string]: boolean } } = {}
): MultiYearContract[] {
  const finalSheet: MultiYearContract[] = [];

  // 1. Process base players that are still active
  Object.keys(BASE_ROSTER_CONTRACTS).forEach(id => {
    // If player is in activePlayers list (not excluded or traded)
    const isActive = activePlayers.some(p => p.id === id);
    if (!isActive) return;

    const baseContract = BASE_ROSTER_CONTRACTS[id];
    const playerObj = activePlayers.find(p => p.id === id);

    // Apply any dynamic options overrides from user toggles
    const updatedSalaries = { ...baseContract.salaries };
    const updatedStatuses = { ...baseContract.statuses } as any;

    // Option triggers
    ["2027-28", "2028-29", "2029-30"].forEach(year => {
      const isDeclined = optionsOverrides[id]?.[year] === false;
      if (isDeclined) {
        updatedSalaries[year as keyof typeof updatedSalaries] = 0;
        updatedStatuses[year] = "UFA";
      }
    });

    finalSheet.push({
      playerId: id,
      playerName: playerObj?.name || id,
      position: playerObj?.position || "G",
      salaries: updatedSalaries,
      statuses: updatedStatuses
    });
  });

  // 2. Process custom trade acquired players
  acquiredPlayers.forEach(ap => {
    const salaryVal = typeof ap.salary === "number" 
      ? ap.salary 
      : parseFloat(ap.salary.replace("$", "").replace("M", ""));

    finalSheet.push({
      playerId: ap.id,
      playerName: ap.name,
      position: ap.position || "G",
      salaries: {
        "2026-27": salaryVal,
        "2027-28": +(salaryVal * 1.05).toFixed(1),
        "2028-29": +(salaryVal * 1.10).toFixed(1),
        "2029-30": 0
      },
      statuses: {
        "2026-27": "Guaranteed",
        "2027-28": "Guaranteed",
        "2028-29": "Player Option",
        "2029-30": "UFA"
      },
      isCustom: true
    });
  });

  // 3. Process Free Agent signings
  signedFreeAgents.forEach(fa => {
    finalSheet.push({
      playerId: fa.id,
      playerName: fa.name,
      position: fa.position || "G",
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
      isCustom: true
    });
  });

  // 4. Process Draft Prospects (Rookie scale contracts)
  draftedProspects.forEach(dp => {
    const baseRookieSal = dp.projectedRange?.toLowerCase().includes("top") ? 6.2 : 4.5;
    finalSheet.push({
      playerId: dp.id,
      playerName: dp.name,
      position: dp.position || "G",
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
      isCustom: true
    });
  });

  return finalSheet;
}
