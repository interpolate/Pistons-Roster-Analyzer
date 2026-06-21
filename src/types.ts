export interface Player {
  id: string;
  name: string;
  number: string;
  position: string;
  age: number;
  height: string;
  weight: string;
  experience: string;
  ppg: number;
  rpg: number;
  apg: number;
  per: number; // Player Efficiency Rating
  ts: number;  // True Shooting % (as decimal or whole number, let's use percentage e.g., 58.2)
  impactGrade: "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D+" | "D" | "F";
  strengths: string[];
  weaknesses: string[];
  analysis: string;
  howToOptimize: string;
  salary: string;
  darko?: number;  // DARKO DPM advanced stat
  lebron?: number; // LEBRON advanced stat
  epm?: number;    // Estimated Plus-Minus advanced stat
}

export interface DraftPick {
  id: string;
  year: number;
  round: number;
  originalOwner: string;
  notes: string;
}

export interface DraftProspect {
  id: string;
  name: string;
  position: string;
  collegeOrTeam: string;
  age: number;
  height: string;
  scoutingGrade: string; // e.g. "93 (Elite)" or "A"
  projectedRange: string; // e.g. "Top 5", "Lottery"
  projectedPpg: number;
  projectedRpg: number;
  projectedApg: number;
  strengths: string[];
  weaknesses: string[];
  fitAnalysis: string;
  primaryBenefit: "shooting" | "defense" | "playmaking" | "size" | "veteran_experience";
  darko?: number;  // Projective DARKO DPM
  lebron?: number; // Projective LEBRON
  epm?: number;    // Projective EPM
}

export interface FreeAgent {
  id: string;
  name: string;
  position: string;
  currentTeam: string;
  age: number;
  tier: "Max Target" | "Premium Starter" | "Valued Role Player" | "Vet Minimum";
  projectedSalary: number; // in Millions, e.g. 24.5
  ppg: number;
  rpg: number;
  apg: number;
  strengths: string[];
  weaknesses: string[];
  fitAnalysis: string;
  primaryBenefit: "shooting" | "defense" | "playmaking" | "size" | "veteran_experience";
  darko?: number;  // DARKO DPM advanced stat
  lebron?: number; // LEBRON advanced stat
  epm?: number;    // Estimated Plus-Minus advanced stat
}

export interface TeamNeedsChecklist {
  perimeterShooting: boolean;
  rimProtection: boolean;
  vetLeadership: boolean;
  secondaryPlaymaking: boolean;
  wingDefense: boolean;
}

export interface SimulationState {
  simulatedRosterIds: string[]; // Initially starts with all current player ids
  addedProspectIds: string[];
  addedFreeAgentIds: string[];
}
