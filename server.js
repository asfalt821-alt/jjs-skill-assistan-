import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "100kb" }));
app.use("/api/", rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a few minutes and try again." }
}));

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-6.2-astra";
const openai = apiKey ? new OpenAI({ apiKey }) : null;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(openai), webSearch: true });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        error: "OPENAI_API_KEY is not configured on the server. Add it to the .env file and restart the server."
      });
    }

    const message = String(req.body?.message || "").trim();
    const language = String(req.body?.language || "en").slice(0, 8);
    const moveset = String(req.body?.moveset || "No moveset loaded.").slice(0, 35000);

    if (!message) return res.status(400).json({ error: "Message is required." });
    if (message.length > 4000) return res.status(400).json({ error: "Message is too long (max 4000 characters)." });

    const languageNames = {
      en: "English", tr: "Turkish", es: "Spanish", pt: "Portuguese", ru: "Russian"
    };
    const languageName = languageNames[language] || "English";

    const instructions = `You are JJS Skill Assistant, specialized in the Roblox game Jujutsu Shenanigans.
Answer in ${languageName}, unless the user explicitly asks for another language.
Your main job is skill-build creation and analysis: KLUv character/moveset data, skill nodes, branches, hitboxes, combo routes, timing, stun, damage, and build design.
Use the supplied moveset data when relevant. Do not pretend to know undocumented node semantics. Do not invent current game updates, character properties, animation IDs, codes, or combo guarantees.
For current game facts, use web search when useful. Prefer reliable, recent sources; explain when sources disagree or information cannot be verified. Cite sources with clickable URLs in the answer when web search supplies them.
When suggesting a combo, explain the assumptions and distinguish a plausible route from a confirmed true combo. Ask for missing character/version details only when necessary.
Be concise but useful.`;

    const input = `${instructions}

Loaded moveset data (may be empty or truncated):
${moveset}

User question:
${message}`;

    const response = await openai.responses.create({
      model,
      tools: [{ type: "web_search", search_context_size: "medium" }],
      input
    });

    res.json({ answer: response.output_text || "I couldn't generate an answer. Please try again." });
  } catch (error) {
    console.error("AI request failed:", error?.message || error);
    const status = error?.status && Number.isInteger(error.status) ? error.status : 500;
    res.status(status >= 400 && status < 600 ? status : 500).json({
      error: status === 401
        ? "The API key was rejected. Check OPENAI_API_KEY in .env."
        : status === 429
          ? "The API rate limit or account quota was reached. Check API usage and billing."
          : "The AI request failed. Check the server terminal for details."
    });
  }
});

app.use(express.static(path.join(__dirname, "public")));
app.get("/{*splat}", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(port, () => {
  console.log(`JJS Skill Assistant running at http://localhost:${port}`);
  if (!openai) console.warn("OPENAI_API_KEY is missing. Add it to .env before using AI chat.");
});
