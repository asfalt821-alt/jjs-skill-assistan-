import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import { @Tavily/core } from "tavily-client";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "100kb" }));
app.use("/api/", rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a while and try again." }
}));

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-6.2-assistant";
const openai = apiKey ? new OpenAI({ apiKey }) : null;

const tavilyApiKey = process.env.TAVILY_API_KEY;
const tavily = tavilyApiKey ? new TavilyClient({ apiKey: tavilyApiKey }) : null;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(openai), webSearchConfigured: Boolean(tavily) });
});

// ... diğer rotaların (örneğin /api/chat) burada yer almalı ...
app.post("/api/chat", async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({ error: "OpenAI API key is not configured." });
    }

    const message = String(req.body.message || "").trim();
    const language = String(req.body.language || "en").trim();
    const moveset = String(req.body.moveset || "").trim();

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }
    if (message.length > 4000) {
      return res.status(400).json({ error: "Message is too long." });
    }

    const languageNames = {
      en: "English",
      tr: "Turkish",
      es: "Spanish",
      pt: "Portuguese"
    };
    const languageName = languageNames[language] || "English";

    let webContext = "";
    if (tavily) {
      try {
        const searchRes = await tavily.search({
          query: message,
          search_depth: "basic",
          max_results: 3
        });
        if (searchRes?.results?.length) {
          webContext = searchRes.results
            .map((r, i) => `[${i + 1}] ${r.title}: ${r.content}`)
            .join("\n");
        }
      } catch (searchErr) {
        console.error("Tavily search failed:", searchErr?.message || searchErr);
      }
    }

    const instructions = `You are JJS Skill Assistant.
Answer in ${languageName}, unless the user explicitly asks for another language.
Your main job is skill-build creation and analysis: combos, tech, cancel windows, knockback/ragdoll interactions, cooldowns, and counterplay.
Use the supplied moveset data when relevant. Do not invent fake frame data or unverified patch notes.
For current game facts, use web search results when provided.
When suggesting a combo, explain the assumptions and constraints clearly.
Be concise but useful.`;

    const input = `${instructions}

Loaded moveset data (may be empty or truncated):
${moveset}

Web search results:
${webContext || "No web search results available."}

User question:
${message}`;

    const response = await openai.responses.create({
      model,
      input
    });

    res.json({ answer: response.output_text || "" });
  } catch (error) {
    console.error("AI request failed:", error?.message || error);
    const status = error?.status ?? Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    res.status(status >= 400 && status < 600 ? status : 500).json({
      error: "The AI request failed. Check OPENAI_API_KEY and model access."
    });
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
    
