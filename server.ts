import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { currentRosterData, upcomingDraftPicks, draftProspectsData, freeAgentsData } from "./src/data";

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

      sandboxContext = `
ACTIVE ROSTER SANDBOX SIMULATION CONTEXT:
The user has made the following sandbox adjustments to the Detroit Pistons Roster:
- EXCLUDED/RELEASED PLAYERS (removed from current squad): ${excludedPlayers.length > 0 ? excludedPlayers.map(p => `${p.name} (${p.position})`).join(", ") : "None"}
- SIGNED DRAFT PROSPECTS (2026 Class additions): ${draftedProspects.length > 0 ? draftedProspects.map(p => `${p.name} (${p.position})`).join(", ") : "None"}
- SIGNED FREE AGENTS: ${signedFA.length > 0 ? signedFA.map(p => `${p.name} (${p.position})`).join(", ") : "None"}
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
      },
    });

    res.json({ text: response.text });
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
