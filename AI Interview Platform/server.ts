import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const resolvedFilename = typeof __filename !== "undefined"
  ? __filename
  : (import.meta?.url ? fileURLToPath(import.meta.url) : "");
const resolvedDirname = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(resolvedFilename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Session files logic
const DATA_DIR = path.join(resolvedDirname, "data");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(SESSIONS_FILE)) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]), "utf-8");
}

function getSessions() {
  try {
    const data = fs.readFileSync(SESSIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveSessions(sessions: any[]) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write sessions file:", err);
  }
}

let deepseekOutofCredits = false;

// Dual-engine AI generator with automatic Gemini multi-model sequential fallback on DeepSeek failures (e.g. 402 Insufficient Balance or rate-limiting)
async function callAIModel(systemInstruction: string, promptText: string, temperature: number = 0.7, preferredEngine: "Auto" | "Gemini" | "DeepSeek" = "Auto"): Promise<string> {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!deepseekKey && !geminiKey) {
    throw new Error("Neither DEEPSEEK_API_KEY nor GEMINI_API_KEY environment variables are defined. Please configure at least one API key in the Settings > Secrets configuration hub.");
  }

  const tryDeepSeek = preferredEngine === "DeepSeek" || (preferredEngine === "Auto" && !!deepseekKey && !deepseekOutofCredits);
  const tryGemini = preferredEngine === "Gemini" || (preferredEngine === "Auto" && !!geminiKey);

  // 1. Try DeepSeek API first if the key exists and wasn't explicitly bypassed or cached as exhausted
  if (tryDeepSeek && deepseekKey) {
    try {
      console.log("Attempting generation using DeepSeek model...");
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: promptText }
          ],
          response_format: {
            type: "json_object"
          },
          temperature
        })
      });

      if (response.ok) {
        const data: any = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          console.log("DeepSeek generation succeeded.");
          return text;
        }
      } else {
        if (response.status === 402) {
          deepseekOutofCredits = true;
          console.log("Note: DeepSeek balance is exhausted (status 402). Successfully transitioning to Gemini fallback...");
          if (preferredEngine === "DeepSeek") {
            throw new Error("DeepSeek balance is exhausted (status 402). Please add credits to your DeepSeek account or switch the engine to Gemini.");
          }
        } else {
          const errorBody = await response.text().catch(() => "");
          console.log(`DeepSeek API returned status ${response.status}: ${errorBody || response.statusText}. Using Gemini fallback...`);
          if (preferredEngine === "DeepSeek") {
            throw new Error(`DeepSeek API returned status ${response.status}: ${errorBody || response.statusText}`);
          }
        }
      }
    } catch (err: any) {
      console.log(`DeepSeek API connection helper notice: ${err.message || err}. Using Gemini fallback...`);
      if (preferredEngine === "DeepSeek") {
        throw err;
      }
    }
  }

  // 2. Fallback to Gemini if Gemini key exists, trying multiple models in sequence to bypass capacity errors
  if (tryGemini && geminiKey) {
    // Sequential list of model candidates to try
    const modelCandidates = [
      "gemini-2.5-flash",
      "gemini-1.5-flash",
      "gemini-2.5-pro",
      "gemini-3.5-flash"
    ];
    
    const errors: string[] = [];
    
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    for (const model of modelCandidates) {
      try {
        console.log(`Processing request with Gemini fallback model: ${model}...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature,
          }
        });

        const textOutput = response.text;
        if (textOutput) {
          console.log(`Gemini generation succeeded with model: ${model}`);
          return textOutput;
        }
        throw new Error(`Model ${model} returned empty response text.`);
      } catch (geminiErr: any) {
        const errMsg = geminiErr?.message || String(geminiErr);
        console.warn(`Gemini model ${model} failed:`, errMsg);
        errors.push(`${model}: ${errMsg}`);
      }
    }

    // If all Gemini models failed
    throw new Error(`AI generation failed on all fallback channels.\nDeepSeek failed/was unavailable.\nGemini models errors:\n- ${errors.join("\n- ")}`);
  }

  throw new Error("Specified AI generation failed, and no valid fallback GEMINI_API_KEY is configured in Settings > Secrets.");
}

// ---------------- API ENDPOINTS ----------------

// Fetch all sessions (history)
app.get("/api/sessions", (req, res) => {
  try {
    const sessions = getSessions();
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Save a new or edited session
app.post("/api/sessions", (req, res) => {
  try {
    const session = req.body;
    if (!session || !session.id) {
      return res.status(400).json({ error: "Missing session or session ID" });
    }
    const sessions = getSessions();
    const existingIndex = sessions.findIndex((s: any) => s.id === session.id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = { ...sessions[existingIndex], ...session };
    } else {
      sessions.push(session);
    }
    saveSessions(sessions);
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch single session
app.get("/api/sessions/:id", (req, res) => {
  try {
    const { id } = req.params;
    const sessions = getSessions();
    const session = sessions.find((s: any) => s.id === id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete session
app.delete("/api/sessions/:id", (req, res) => {
  try {
    const { id } = req.params;
    let sessions = getSessions();
    const beforeLength = sessions.length;
    sessions = sessions.filter((s: any) => s.id !== id);
    if (sessions.length === beforeLength) {
      return res.status(404).json({ error: "Session not found" });
    }
    saveSessions(sessions);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle bookmark
app.post("/api/sessions/:id/bookmark", (req, res) => {
  try {
    const { id } = req.params;
    const sessions = getSessions();
    const session = sessions.find((s: any) => s.id === id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    session.bookmarked = !session.bookmarked;
    saveSessions(sessions);
    res.json({ success: true, bookmarked: session.bookmarked });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Questions with DeepSeek
app.post("/api/generate-questions", async (req, res) => {
  try {
    const { topic, language, difficulty, aiEngine } = req.body;
    if (!topic || !language || !difficulty) {
      return res.status(400).json({ error: "Missing topic, language, or difficulty parameters" });
    }

    const systemInstruction = 
      "You are a professional, world-class technical interviewer conducting mock programming evaluations. " +
      "Generate exactly 5 highly relevant, realistic, and challenging coding and conceptual interview questions tailored to the requested topic, programming language, and difficulty level. " +
      "Always answer in complete, valid, structured JSON output containing a 'questions' key which points to a JSON array of exactly 5 elements. Provide deep, accurate answers with space/time complexity explanations.";

    const promptText = `Generate exactly 5 different tech interview questions for:
- Topic: ${topic}
- Language: ${language}
- Difficulty: ${difficulty}

You MUST return a JSON object with this exact structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Detailed question text, problem context, or theoretical scenario.",
      "answer": "Deep and comprehensive explanation of the answer, explaining trade-offs, optimal best practices, and standard coding architectures.",
      "followUp": "A high-quality follow-up question that pushes the candidate deeper into the topic.",
      "codingChallenge": {
        "problem": "A targeted coding challenge statement, e.g., 'Write a function that reverses...'",
        "starterCode": "A clear starter template/stub block of code in the designated language for the candidate to fill.",
        "solution": "The optimal fully-functional reference solution code."
      }
    }
  ]
}

Ensure the questions assess real core knowledge in depth. Return valid array of 5 unique items matching the schema.`;

    const textOutput = await callAIModel(systemInstruction, promptText, 0.85, aiEngine || "Auto");
    if (!textOutput) {
      throw new Error("No response output returned from the AI model.");
    }

    const parsedJson = JSON.parse(textOutput.trim());
    const questionsArray = parsedJson.questions || parsedJson;
    res.json(questionsArray);
  } catch (error: any) {
    console.error("Error in generate-questions:", error);
    res.status(550).json({ error: error.message || "An error occurred during AI prompt processing." });
  }
});

// Evaluate User's Submitted Code
app.post("/api/evaluate-code", async (req, res) => {
  try {
    const { code, topic, language, difficulty, problem, aiEngine } = req.body;
    if (!code || !language || !problem) {
      return res.status(400).json({ error: "Missing required inputs (code, language, or problem description)" });
    }

    const systemInstruction = 
      "You are a senior compiler engineer and elite technical interviewer assessing a candidate's code attempt. " +
      "Evaluate the user's code for syntactical correctness, logic, time/space complexity, edge cases, and best practices. " +
      "Return a complete, valid JSON output detailing the score (0-100), passed (boolean), feedback (string), timeComplexity (string), spaceComplexity (string), suggestions (string array), and improvedCode (string).";

    const promptText = `Review this candidate's code submission for:
- Topic: ${topic || "Coding Assessment"}
- Language: ${language}
- Difficulty: ${difficulty || "Medium"}
- Problem Statement: ${problem}

Candidate's Code Attempt:
\`\`\`${language}
${code}
\`\`\`

Return a JSON object with this exact structure:
{
  "score": number,
  "passed": boolean,
  "feedback": "detailed critique",
  "timeComplexity": "Big-O runtime",
  "spaceComplexity": "Big-O memory",
  "suggestions": ["suggestion 1", "suggestion 2"],
  "improvedCode": "fully refactored version of user's code"
}

Evaluate now.`;

    const textOutput = await callAIModel(systemInstruction, promptText, 0.4, aiEngine || "Auto");
    if (!textOutput) {
      throw new Error("No evaluation response got from the AI model.");
    }

    const evalResult = JSON.parse(textOutput.trim());
    res.json(evalResult);
  } catch (error: any) {
    console.error("Error in evaluate-code:", error);
    res.status(500).json({ error: error.message || "An error occurred during AI code evaluation." });
  }
});

// Vite middleware integration for asset serving & SPA Routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
