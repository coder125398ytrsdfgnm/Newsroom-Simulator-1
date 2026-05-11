import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;
const MODEL = "claude-sonnet-4-6";

const REVIEWER_SYSTEM = `You are the editorial AI for a newsroom simulator game.
You evaluate the player's article and respond ONLY with strict JSON matching this schema:
{
  "ratings": {
    "writing_quality": 0-100,
    "factual_credibility": 0-100,
    "engagement": 0-100,
    "sensationalism": 0-100,
    "originality": 0-100
  },
  "overall_grade": "A+|A|A-|B+|B|B-|C+|C|C-|D|F",
  "headline_score": 0-100,
  "estimated_views": integer between 200 and 5000000,
  "tone": "one short phrase describing the tone",
  "comments": [
    { "author": "made-up username like @handle or FullName", "text": "1-2 sentences, varied opinions, some snarky, some supportive, some skeptical" }
  ],
  "critique": "A 2-3 sentence review from a media critic, in the style of a Columbia Journalism Review blurb"
}
Generate 5 comments. Be honest: short, low-effort, or empty articles get low scores and few views.
Reward strong leads, specific facts, and clear structure. Penalize clickbait without substance.
Do not include any prose outside the JSON. No markdown fences.`;

const REPORTER_SYSTEM = `You are an AI assistant that drafts a short news article on behalf of a junior reporter
for a newsroom simulator game. The article should feel newsworthy but lightly fictional.
Respond ONLY with strict JSON:
{
  "title": "punchy headline, max 90 chars",
  "body": "200-350 word article in inverted-pyramid style",
  "category": "Politics|Business|Tech|Sports|Culture|World|Local|Crime"
}
No markdown fences, no prose outside the JSON.`;

function tryParseJson(text) {
  if (!text) return null;
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}$/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    return null;
  }
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function rand(lo, hi) { return Math.floor(lo + Math.random() * (hi - lo + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function gradeFromScore(s) {
  if (s >= 95) return "A+";
  if (s >= 90) return "A";
  if (s >= 85) return "A-";
  if (s >= 80) return "B+";
  if (s >= 75) return "B";
  if (s >= 70) return "B-";
  if (s >= 65) return "C+";
  if (s >= 60) return "C";
  if (s >= 55) return "C-";
  if (s >= 45) return "D";
  return "F";
}

function simulateReview({ title, body }) {
  const wordCount = (body || "").trim().split(/\s+/).filter(Boolean).length;
  const titleLen = (title || "").trim().length;
  const hasNumbers = /\d/.test(body || "");
  const hasQuote = /["“”]/.test(body || "");
  const allCaps = (title || "") === (title || "").toUpperCase() && titleLen > 5;
  const clickbaity = /(you won'?t believe|shocking|insane|this one trick|gone wrong)/i.test(title || "");

  const writing = clamp(40 + Math.min(40, wordCount / 8) + (hasQuote ? 8 : 0) - (allCaps ? 12 : 0), 5, 99);
  const credibility = clamp(45 + (hasNumbers ? 15 : 0) + (hasQuote ? 10 : 0) - (clickbaity ? 25 : 0) + rand(-8, 8), 5, 99);
  const engagement = clamp(50 + (titleLen > 30 && titleLen < 80 ? 15 : 0) + (clickbaity ? 18 : 0) + rand(-10, 10), 5, 99);
  const sensational = clamp(30 + (clickbaity ? 45 : 0) + (allCaps ? 20 : 0) + rand(-10, 10), 1, 99);
  const originality = clamp(45 + rand(-15, 25) + (wordCount > 250 ? 10 : 0), 5, 99);

  const overall = Math.round((writing * 0.3 + credibility * 0.25 + engagement * 0.25 + originality * 0.2));
  const headline = clamp(40 + (titleLen > 25 && titleLen < 80 ? 25 : 0) + (clickbaity ? 15 : -5) + rand(-10, 10), 5, 99);
  const views = Math.round(500 + engagement * 200 + headline * 80 + rand(-2000, 8000));

  const handles = ["@truthseeker", "@news_junkie", "@randomguy42", "Margaret W.", "@hot_takes", "Dr. L. Chen", "@cynic", "Tom B.", "@redditrefugee", "Sarah K."];
  const supportive = ["Finally someone covered this.", "Great reporting, more like this please.", "Saved and shared.", "Refreshing to read actual journalism."];
  const skeptical = ["Sources?", "This reads like an opinion piece.", "Buried the lede.", "Where's the other side of the story?"];
  const snarky = ["My dog could write a better headline.", "Got bored halfway through.", "Cool story bro.", "This is what passes for news now?"];

  const comments = Array.from({ length: 5 }, () => {
    const pool = pick([supportive, skeptical, snarky, supportive, skeptical]);
    return { author: pick(handles), text: pick(pool) };
  });

  const critique = wordCount < 80
    ? "Thin and underdeveloped. The piece raises a topic but never delivers reporting to match the headline's promise."
    : clickbaity
      ? "An entertaining read undercut by a headline that overpromises. The reporting itself shows flashes of competence."
      : "A workmanlike entry that hits the basics. Stronger sourcing and a sharper lede would elevate it from filler to feature.";

  return {
    ratings: {
      writing_quality: Math.round(writing),
      factual_credibility: Math.round(credibility),
      engagement: Math.round(engagement),
      sensationalism: Math.round(sensational),
      originality: Math.round(originality),
    },
    overall_grade: gradeFromScore(overall),
    headline_score: Math.round(headline),
    estimated_views: Math.max(200, views),
    tone: clickbaity ? "tabloid" : (sensational > 60 ? "punchy" : "measured"),
    comments,
    critique,
    _simulated: true,
  };
}

function simulateReporterArticle(prompt, reporterName) {
  const categories = ["Politics", "Business", "Tech", "Sports", "Culture", "World", "Local", "Crime"];
  const topics = [
    { cat: "Tech", title: "City Pilots AI Traffic System on Main Street Corridor", body: "Officials announced Tuesday a six-month pilot of an AI-driven traffic signal system along Main Street, aiming to cut average commute times by an estimated 18%. The system, supplied by a regional vendor, adjusts signal timing in response to real-time congestion data. 'We expect measurable improvements within ninety days,' the transportation director said. Critics raised privacy questions about the cameras involved, which the city says do not record license plates." },
    { cat: "Local", title: "Downtown Bakery Reopens After Two-Year Renovation", body: "A neighborhood institution returned to business this morning as Halsted's Bakery reopened on Elm Avenue, ending a two-year closure prompted by a kitchen fire. Owner Marisol Halsted, 54, said the rebuild cost roughly $340,000 and was financed in part by a local small-business grant. Customers lined up around the block by 7 a.m. 'We never thought we'd see this place open again,' said longtime patron David Reyes." },
    { cat: "Business", title: "Regional Bank Posts Surprise Quarterly Loss", body: "Shares of MidState Financial fell 11% in pre-market trading after the bank reported a $42 million quarterly loss, driven largely by writedowns on its commercial real estate portfolio. Analysts had expected modest earnings. The bank's CEO described the quarter as 'an inflection point' and signaled a strategic review. The disclosure renews concern about regional bank exposure to office property." },
  ];
  const t = pick(topics);
  return {
    title: t.title,
    body: `${t.body}\n\nFiled by ${reporterName}.${prompt ? ` (Assigned topic: ${prompt}.)` : ""}`,
    category: t.cat,
  };
}

async function callClaudeJson(system, userText) {
  if (!client) return null;
  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: userText }],
    });
    const text = resp.content.map(b => (b.type === "text" ? b.text : "")).join("");
    return tryParseJson(text);
  } catch (err) {
    console.error("Claude API error:", err.message);
    return null;
  }
}

app.post("/api/review", async (req, res) => {
  const { title, body, author, newsroom } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: "title and body required" });

  const userText = `Newsroom: ${newsroom || "Unknown"}\nReporter: ${author || "Unknown"}\n\nHEADLINE: ${title}\n\nARTICLE:\n${body}`;
  const ai = await callClaudeJson(REVIEWER_SYSTEM, userText);
  const review = ai && ai.ratings ? ai : simulateReview({ title, body });
  res.json(review);
});

app.post("/api/reporter-article", async (req, res) => {
  const { reporterName, beat, newsroom } = req.body || {};
  const prompt = `Newsroom: ${newsroom || "The Daily"}\nReporter: ${reporterName || "a junior reporter"}\nBeat / assignment: ${beat || "general assignment"}\n\nDraft an article in the requested JSON format.`;
  const ai = await callClaudeJson(REPORTER_SYSTEM, prompt);
  const draft = ai && ai.title && ai.body ? ai : simulateReporterArticle(beat, reporterName || "Staff Reporter");
  res.json(draft);
});

app.post("/api/competitor-headlines", async (req, res) => {
  const { competitors } = req.body || {};
  const list = Array.isArray(competitors) && competitors.length ? competitors : ["The Daily Ledger", "Metro Wire", "Capital Post"];
  if (client) {
    const sys = `You generate fictional competing-newspaper headlines for a newsroom simulator. Respond ONLY with JSON:
{ "headlines": [{ "outlet": "name", "headline": "string", "category": "string" }] }
One headline per outlet provided. No markdown fences.`;
    const ai = await callClaudeJson(sys, `Outlets: ${list.join(", ")}`);
    if (ai && Array.isArray(ai.headlines)) return res.json(ai);
  }
  const samples = [
    { headline: "Mayor Proposes Sweeping Zoning Overhaul", category: "Local" },
    { headline: "Tech Giant Slashes 4,000 Jobs Amid Restructuring", category: "Business" },
    { headline: "Storm System to Bring Heavy Rain Through Weekend", category: "Weather" },
    { headline: "Champions Stumble in Overtime Thriller", category: "Sports" },
    { headline: "Lawmakers Spar Over Surveillance Bill", category: "Politics" },
    { headline: "New Study Links Sleep Patterns to Productivity", category: "Health" },
  ];
  res.json({ headlines: list.map(outlet => ({ outlet, ...pick(samples) })) });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiEnabled: Boolean(client), model: client ? MODEL : null });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Newsroom Simulator running on http://localhost:${PORT}`);
  console.log(`AI reviewer: ${client ? "ENABLED (" + MODEL + ")" : "SIMULATED (no ANTHROPIC_API_KEY)"}`);
});
