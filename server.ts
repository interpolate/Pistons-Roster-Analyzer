import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { currentRosterData, upcomingDraftPicks, draftProspectsData, freeAgentsData } from "./src/data";
import { calculateLineupSynergy, getPlayerArchetypes } from "./src/utils/chemistry";
import { validateCBAPayroll, CBA_LIMITS } from "./src/utils/finance";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// AI Chat Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, simulatedState } = req.body;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured. Please add it in the Settings > Secrets panel."
      });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid 'messages' format. Must be an array." });
    }

    // Format simulation sandbox state into strings
    let sandboxContext = "";
    if (simulatedState) {
      const { excludedIds = [], prospectIds = [], freeAgentIds = [] } = simulatedState;
      const excludedPlayers = currentRosterData.filter(p => excludedIds.includes(p.id));
      const draftedProspects = draftProspectsData.filter(p => prospectIds.includes(p.id));
      const signedFA = freeAgentsData.filter(p => freeAgentIds.includes(p.id));

      const activePlayers = [
        ...currentRosterData.filter(p => !excludedIds.includes(p.id)),
        ...draftedProspects,
        ...signedFA
      ];

      const chemistryAnalysis = calculateLineupSynergy(activePlayers);
      const cbaAnalysis = validateCBAPayroll(activePlayers, signedFA, draftedProspects, []);

      sandboxContext = `
ACTIVE ROSTER SANDBOX SIMULATION CONTEXT:
The user has made the following sandbox adjustments to the Detroit Pistons Roster:
- EXCLUDED/RELEASED PLAYERS (removed from current squad): ${excludedPlayers.length > 0 ? excludedPlayers.map(p => `${p.name} (${p.position})`).join(", ") : "None"}
- SIGNED DRAFT PROSPECTS (2026 Class additions): ${draftedProspects.length > 0 ? draftedProspects.map(p => `${p.name} (${p.position})`).join(", ") : "None"}
- SIGNED FREE AGENTS: ${signedFA.length > 0 ? signedFA.map(p => `${p.name} (${p.position})`).join(", ") : "None"}

--- RIGOROUS CBA FINANCIAL & LUXURY TAX MODELING ---
Pistons Financial Sheet Summary for 2026-27:
* Active Team Payroll: $${cbaAnalysis.payroll}M (Salary Cap: $${CBA_LIMITS.salaryCap}M | Luxury Tax Line: $${CBA_LIMITS.luxuryTax}M)
* Remaining Cap Space: $${cbaAnalysis.capSpace}M
* Apron Status: ${cbaAnalysis.apronStatus} (First Apron Limit: $${CBA_LIMITS.firstApron}M | Second Apron Limit: $${CBA_LIMITS.secondApron}M)
* Luxury Tax Overage/Obligations: $${cbaAnalysis.luxuryTaxOverage}M
* Exceptions Utilized: ${cbaAnalysis.exceptionsTriggered.length > 0 ? cbaAnalysis.exceptionsTriggered.join(", ") : "None"}
* Hard Cap Triggered: ${cbaAnalysis.hardCappedAt}
* Financial Legality Status: ${cbaAnalysis.isLegal ? "FULLY LEGAL AND AUTHORIZED UNDER CBA RULES" : "ILLEGAL OR TRIGGERED WARNINGS"}
* Financial Warnings & Constraints:
${cbaAnalysis.warnings.length > 0 ? cbaAnalysis.warnings.map(w => `  - ${w}`).join("\n") : "  - No payroll or roster construction constraints triggered!"}

--- REAL-TIME ON-COURT SYNERGY & CHEMISTRY METRICS ---
These metrics are calculated dynamically by our basketball analytics engine combining individual player DARKO/EPM plus-minus ratings with on-court synergy combinations:
* Simulated Net Court Rating: ${chemistryAnalysis.netRating > 0 ? "+" : ""}${chemistryAnalysis.netRating} (Offensive Rating: ${chemistryAnalysis.offensiveRating} | Defensive Rating: ${chemistryAnalysis.defensiveRating})
* Simulated Spacing & Gravity Rating: ${chemistryAnalysis.spacingRating}/10
* Active Synergy Boosts: ${chemistryAnalysis.synergyBoosts.length > 0 ? chemistryAnalysis.synergyBoosts.join(" | ") : "None"}
* Active Synergy Penalties: ${chemistryAnalysis.synergyPenalties.length > 0 ? chemistryAnalysis.synergyPenalties.join(" | ") : "None"}

--- SYSTEM-WIDE SKILL DEFICIENCY ALERTS ---
These warnings have been automatically flagged as potential roster vulnerabilities:
${chemistryAnalysis.alerts.length > 0 ? chemistryAnalysis.alerts.map(a => `- [${a.severity.toUpperCase()}] ${a.title}: ${a.description} (Solution: ${a.solution})`).join("\n") : "None (All core roles fully covered!)"}

--- PLAYER ROSTER BASKETBALL ARCHETYPES ---
Each player has been classified into a functional offensive and defensive style:
${activePlayers.map(p => {
  const arch = getPlayerArchetypes(p);
  return `- ${p.name}: Offense [${arch.offensive}], Defense [${arch.defensive}] (EPM: ${p.epm ?? 0}, DARKO: ${p.darko ?? 0})`;
}).join("\n")}
`;
    }

    // Construct the rich systems instruction
    const systemInstruction = `
You are the **Pistons Front Office AI Architect**, a world-class NBA General Manager strategist, scout, and executive coach specializing in basketball mechanics, salary cap management, and roster optimization. 
Your terminal is integrated into the "Pistons Roster Architect" platform, meaning you have real-time access to the complete 2025-26 Detroit Pistons physical squad roster, the 2026 NBA Draft class, the Free Agency prospects pool, and the user's active sandbox simulation adjustments.

### YOUR BEHAVIOR & GUIDELINES:
1. **Pistons DNA**: Speak with analytical authority, basketball wisdom, and executive polish. You want to restore Detroit's legendary grit, spacing, defense, and championship pride.
2. **Data-Driven Diagnostics**: Use precise physical dimensions, stats (PPG, RPG, APG, PER, TS%), strengths, and weaknesses of players when analyzed. Do not hallucinate or make up fake players - strictly use the roster, draft-class, and free agency data provided.
3. **Analyze Sandbox Simulation**: If the user has active draft prospects, free agents, or excluded roster members (provided in the active sandbox context), analyze their fit. Specifically look at how these choices resolve Detroit's key needs:
   - SHOOTING GRAVITY: Does it solve Detroit's perimeter spacing issues (adding snipers like AJ Dybantsa, Nate Ament, or elite free agents)?
   - DEFENSIVE VERSATILITY / RIM PROTECTION: Does it cover paint protection (e.g. adding Caleb Wilson, Xavion Staton, or a big veteran)?
   - SECONDARY PLAYMAKING: Does it take some handler load off Cade Cunningham (e.g., adding Darryn Peterson)?
   - SIZE / POWER FRONTCOURT: Does it reinforce our post bulk (e.g. adding Cameron Boozer or physical bigs)?
4. **Be highly concise and human**: Prefer clean, scannable responses with bold key terms, short paragraphs, and bullet points where useful. Avoid generic corporate speak. Be professional, supportive, and extremely insightful!

### INTERACTIVE RECOMMENDED SCENARIOS:
When you want to recommend a specific, multi-step strategic roster shift (e.g., releasing certain players, drafting a prospect, signing a free agent to unlock space or defense), populate the "recommendedScenario" field in the output JSON.
Ensure you use the EXACT IDs from the rosters provided below:
- Existing Pistons players (for releasingPlayerIds): e.g., "tobias-harris", "isaiah-joe", "tim-hardaway-jr", "malik-beasley", "paul-reed", "jalen-duren" etc.
- Draft prospects (for draftProspectIds): e.g., "prospect-aj-dybantsa", "prospect-cam-boozer", "prospect-ebuka-okorie", "prospect-darryn-peterson", "prospect-nate-ament", "prospect-caleb-wilson", "prospect-xavion-staton" etc.
- Free agents (for freeAgentIds): e.g., "fa-myles-turner", "fa-brandon-ingram", "fa-jimmy-butler", "fa-fred-vanvleet", "fa-naz-reid", "fa-bobby-portis" etc.

Only provide a "recommendedScenario" if you are recommending a specific set of moves. If you are just answering a general question or doing general analysis, do not include a "recommendedScenario" (set it to null).

### CURRENT DETROIT PISTONS ROSTER:
${JSON.stringify(currentRosterData, null, 2)}

### 2026 NBA DRAFT BOARD PROSPECTS:
${JSON.stringify(draftProspectsData, null, 2)}

### FREE AGENCY POOL TARGETS:
${JSON.stringify(freeAgentsData, null, 2)}

${sandboxContext}
`;

    // Map conversation elements to the required part structure of the @google/genai SDK
    // contents must be an array of: { role: "user" | "model", parts: [{ text: string }] }
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // Call generateContent
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "The primary conversational markdown response. Respond to the user's questions, analyze sandbox adjustments, and offer expert strategic front-office planning with Pistons DNA."
            },
            recommendedScenario: {
              type: Type.OBJECT,
              description: "An optional multi-step roster scenario matching the strategic advice. Provide this ONLY when you recommend concrete additions/subtractions to the active roster so the user can apply them with one click.",
              properties: {
                title: {
                  type: Type.STRING,
                  description: "A short, actionable title for this scenario, e.g., 'Apply AI's Win-Now Spacing Pivot'."
                },
                description: {
                  type: Type.STRING,
                  description: "A concise summary of what this scenario does (e.g., releases Tobias Harris, drafts AJ Dybantsa, and signs Myles Turner to unlock spacing)."
                },
                releasingPlayerIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "The exact player IDs to exclude/release from the current Pistons roster (e.g., ['tobias-harris'])."
                },
                draftProspectIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "The exact draft prospect IDs to select (e.g., ['prospect-aj-dybantsa'])."
                },
                freeAgentIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "The exact free agent IDs to sign (e.g., ['fa-myles-turner'])."
                }
              },
              required: ["title", "description", "releasingPlayerIds", "draftProspectIds", "freeAgentIds"]
            }
          },
          required: ["text"]
        }
      },
    });

    let data;
    try {
      data = JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse Gemini JSON output:", response.text);
      data = { text: response.text || "I was unable to structure my recommendation, but here is my analysis." };
    }

    res.json({
      text: data.text,
      recommendedScenario: data.recommendedScenario || null
    });
  } catch (error: any) {
    console.error("Gemini chat error:", error);
    res.status(500).json({ error: error.message || "An error occurred during your chat request." });
  }
});

// Start integration server
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
