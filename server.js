import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import { Tavily } from "@tavily/core";
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
const model = process.env.OPENAI_MODEL || "gpt-4o";
const openai = apiKey ? new OpenAI({ apiKey }) : null;

const tavilyApiKey = process.env.TAVILY_API_KEY;
const tavily = tavilyApiKey ? new Tavily({ apiKey: tavilyApiKey }) : null;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(openai), webSearchConfigured: Boolean(tavily) });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({ error: "OpenAI API key is not configured." });
    }

    const message = String(req.body.message || "").trim();
    const language = String(req.body.language || "en").trim();
    
