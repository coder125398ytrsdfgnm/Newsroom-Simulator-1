import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Pollinations.ai - free text generation, no API key required.
const POLLINATIONS_URL = "https://text.pollinations.ai/";
const POLLINATIONS_MODEL = "openai";

/* ------------ system prompts ------------ */

const REVIEWER_SYSTEM = `You are the editorial AI for a newsroom simulator game.
You evaluate the player's article and respond ONLY with strict JSON (no markdown fences, no prose) matching this schema:
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
  "critique": "A 2-3 sentence review from a media critic in the style of a Columbia Journalism Review blurb",
  "viral_factor": 0-100,
  "controversy": 0-100
}
Generate 6 comments with varied voices. Be honest: short, low-effort, or empty articles get low scores and few views.
Reward strong leads, specific facts, sourcing, and clear structure. Penalize clickbait without substance.
The newsroom may have an "editorial slant" (sensationalist vs serious vs partisan). Factor that in.`;

const REPORTER_SYSTEM = `You are an AI assistant that drafts a short news article on behalf of a junior reporter for a newsroom simulator.
The article should feel newsworthy, plausible, and lightly fictional. Match the reporter's beat and skill level (low skill = simpler prose, fewer sources; high skill = sharper lede, more sourcing).
Respond ONLY with strict JSON (no markdown fences):
{
  "title": "punchy headline, max 90 chars",
  "body": "200-400 word article in inverted-pyramid style, with at least one quote",
  "category": "Politics|Business|Tech|Sports|Culture|World|Local|Crime|Health|Climate"
}`;

const BREAKING_SYSTEM = `You generate a single breaking-news event for a newsroom simulator game.
Respond ONLY with strict JSON (no markdown):
{
  "headline": "10-14 word breaking headline",
  "category": "Politics|Business|Tech|Sports|Culture|World|Local|Crime|Health|Climate",
  "summary": "2-3 sentence neutral summary a reporter could use as a tip",
  "urgency": "low|medium|high|critical"
}
Vary the topic each time. Make it specific enough to write a story from but fictional.`;

const COMPETITOR_SYSTEM = `You write fictional rival-newspaper headlines for a newsroom simulator.
Each outlet has a personality. Respond ONLY with strict JSON:
{ "headlines": [ { "outlet": "name", "headline": "string", "category": "string", "blurb": "1-sentence teaser" } ] }`;

/* ------------ AI helper ------------ */

function tryParseJson(text) {
  if (!text) return null;
  let s = String(text).trim();
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try { return JSON.parse(s); } catch { /* fallthrough */ }
  const m = s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* fallthrough */ } }
  return null;
}

async function callAI(system, user, { timeoutMs = 30000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(POLLINATIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        model: POLLINATIONS_MODEL,
        jsonMode: true,
      }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      console.warn("Pollinations non-OK:", resp.status);
      return null;
    }
    const text = await resp.text();
    return tryParseJson(text);
  } catch (err) {
    console.warn("Pollinations error:", err.message);
    return null;
  } finally {
    clearTimeout(t);
  }
}

/* ------------ heuristic fallback ------------ */

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function rand(lo, hi) { return Math.floor(lo + Math.random() * (hi - lo + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function gradeFromScore(s) {
  if (s >= 95) return "A+"; if (s >= 90) return "A"; if (s >= 85) return "A-";
  if (s >= 80) return "B+"; if (s >= 75) return "B"; if (s >= 70) return "B-";
  if (s >= 65) return "C+"; if (s >= 60) return "C"; if (s >= 55) return "C-";
  if (s >= 45) return "D"; return "F";
}

function simulateReview({ title, body, slant }) {
  const wordCount = (body || "").trim().split(/\s+/).filter(Boolean).length;
  const titleLen = (title || "").trim().length;
  const hasNumbers = /\d/.test(body || "");
  const hasQuote = /["“”]/.test(body || "");
  const allCaps = (title || "") === (title || "").toUpperCase() && titleLen > 5;
  const clickbaity = /(you won'?t believe|shocking|insane|this one trick|gone wrong|wait until you see)/i.test(title || "");
  const slantBias = slant === "tabloid" ? 18 : slant === "serious" ? -8 : 0;

  const writing = clamp(40 + Math.min(40, wordCount / 8) + (hasQuote ? 8 : 0) - (allCaps ? 12 : 0), 5, 99);
  const credibility = clamp(45 + (hasNumbers ? 15 : 0) + (hasQuote ? 10 : 0) - (clickbaity ? 25 : 0) - (slant === "tabloid" ? 12 : 0) + rand(-8, 8), 5, 99);
  const engagement = clamp(50 + (titleLen > 30 && titleLen < 80 ? 15 : 0) + (clickbaity ? 18 : 0) + slantBias + rand(-10, 10), 5, 99);
  const sensational = clamp(30 + (clickbaity ? 45 : 0) + (allCaps ? 20 : 0) + slantBias + rand(-10, 10), 1, 99);
  const originality = clamp(45 + rand(-15, 25) + (wordCount > 250 ? 10 : 0), 5, 99);

  const overall = Math.round((writing * 0.3 + credibility * 0.25 + engagement * 0.25 + originality * 0.2));
  const headline = clamp(40 + (titleLen > 25 && titleLen < 80 ? 25 : 0) + (clickbaity ? 15 : -5) + rand(-10, 10), 5, 99);
  const views = Math.round(500 + engagement * 200 + headline * 80 + rand(-2000, 8000));

  const handles = ["@truthseeker","@news_junkie","@randomguy42","Margaret W.","@hot_takes","Dr. L. Chen","@cynic","Tom B.","@redditrefugee","Sarah K.","@first_amendment","Jordan P."];
  const supportive = ["Finally someone covered this.","Great reporting, more like this please.","Saved and shared.","Refreshing to read actual journalism.","Bookmarking for later."];
  const skeptical = ["Sources?","This reads like an opinion piece.","Buried the lede.","Where's the other side of the story?","Smells like a press release."];
  const snarky = ["My dog could write a better headline.","Got bored halfway through.","Cool story bro.","This is what passes for news now?","Imagine getting paid for this."];
  const comments = Array.from({ length: 6 }, () => {
    const pool = pick([supportive, skeptical, snarky, supportive, skeptical]);
    return { author: pick(handles), text: pick(pool) };
  });
  const critique = wordCount < 80
    ? "Thin and underdeveloped. The piece raises a topic but never delivers reporting to match the headline's promise."
    : clickbaity
      ? "An entertaining read undercut by a headline that overpromises. The reporting shows flashes of competence."
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
    viral_factor: Math.round(engagement * 0.6 + sensational * 0.4),
    controversy: Math.round(sensational * 0.5 + (clickbaity ? 30 : 0) + rand(-10, 10)),
    _simulated: true,
  };
}

function simulateReporterArticle(beat, reporterName) {
  const topics = [
    { cat: "Tech", title: "City Pilots AI Traffic System on Main Street Corridor", body: "Officials announced Tuesday a six-month pilot of an AI-driven traffic signal system along Main Street, aiming to cut average commute times by an estimated 18%. The system, supplied by a regional vendor, adjusts signal timing in response to real-time congestion data. \"We expect measurable improvements within ninety days,\" the transportation director said. Critics raised privacy questions about the cameras involved, which the city says do not record license plates." },
    { cat: "Local", title: "Downtown Bakery Reopens After Two-Year Renovation", body: "A neighborhood institution returned to business this morning as Halsted's Bakery reopened on Elm Avenue, ending a two-year closure prompted by a kitchen fire. Owner Marisol Halsted, 54, said the rebuild cost roughly $340,000 and was financed in part by a local small-business grant. Customers lined up around the block by 7 a.m. \"We never thought we'd see this place open again,\" said longtime patron David Reyes." },
    { cat: "Business", title: "Regional Bank Posts Surprise Quarterly Loss", body: "Shares of MidState Financial fell 11% in pre-market trading after the bank reported a $42 million quarterly loss, driven largely by writedowns on its commercial real estate portfolio. Analysts had expected modest earnings. The bank's CEO described the quarter as \"an inflection point\" and signaled a strategic review. The disclosure renews concern about regional bank exposure to office property." },
    { cat: "Health", title: "Hospital System Rolls Out New Triage Protocol After Pilot", body: "Three regional hospitals will adopt a revised emergency-room triage protocol next month, following a six-month pilot that administrators say cut average wait times by 22%. The protocol relies on early-warning vitals scoring and a dedicated rapid-assessment nurse. \"It's not magic, it's resourcing,\" said Dr. Helena Park, who led the pilot. The state health department is reviewing whether to recommend the model statewide." },
  ];
  const t = pick(topics);
  return {
    title: t.title,
    body: `${t.body}\n\nFiled by ${reporterName}.${beat ? ` (Assigned beat: ${beat}.)` : ""}`,
    category: t.cat,
  };
}

function simulateBreaking() {
  const events = [
    { headline: "Power outage cascades across three neighborhoods", category: "Local", summary: "A substation failure has left roughly 40,000 homes without power. Utility crews are on scene; cause unclear.", urgency: "high" },
    { headline: "Whistleblower alleges contract steering at city DOT", category: "Politics", summary: "A former procurement officer claims contracts were routed to favored vendors over five years. Records request pending.", urgency: "high" },
    { headline: "AI startup acquired in surprise $1.2B deal", category: "Tech", summary: "A regional AI firm was acquired this morning by a multinational. Terms include $300M earnout.", urgency: "medium" },
    { headline: "Storm system intensifies overnight, flood watch issued", category: "Climate", summary: "Forecasters upgraded the system to a tropical depression. Low-lying neighborhoods are under flood watch.", urgency: "critical" },
    { headline: "Underdog team upsets defending champions in overtime", category: "Sports", summary: "A buzzer-beating three pointer ended a 17-game win streak. Crowd stormed the court.", urgency: "low" },
    { headline: "Recall expanded for popular cooking-spray brand", category: "Health", summary: "Regulators expanded a recall after additional contamination reports. Affected lot numbers posted online.", urgency: "medium" },
  ];
  return pick(events);
}

function simulateCompetitorHeadlines(competitors) {
  const samples = {
    "The Daily Ledger": [
      { headline: "Mayor Proposes Sweeping Zoning Overhaul", category: "Politics", blurb: "Plan would rezone six neighborhoods over five years." },
      { headline: "Lawmakers Spar Over Surveillance Bill", category: "Politics", blurb: "Civil-liberties groups warn of overreach; sponsors cite public safety." },
    ],
    "Metro Wire": [
      { headline: "Tech Giant Slashes 4,000 Jobs Amid Restructuring", category: "Business", blurb: "Stock jumps 9% on the news; severance terms disclosed." },
      { headline: "Crypto Lender Files for Bankruptcy", category: "Business", blurb: "Customers facing months-long withdrawal freeze." },
    ],
    "Capital Post": [
      { headline: "Internal Memo Reveals Cabinet Tensions", category: "Politics", blurb: "Senior aides have clashed over fiscal strategy, sources say." },
      { headline: "Senator Faces Ethics Probe", category: "Politics", blurb: "Committee will examine consulting payments dating to 2022." },
    ],
    "Tribune North": [
      { headline: "Champions Stumble in Overtime Thriller", category: "Sports", blurb: "Defending champs upset on a buzzer-beater." },
      { headline: "Wildfire Smoke Worsens Air Quality Statewide", category: "Climate", blurb: "Three counties under air-quality alert." },
    ],
    "The Tabloid Times": [
      { headline: "YOU WON'T BELIEVE WHAT THIS POLITICIAN JUST SAID", category: "Politics", blurb: "Audio leak detonates online; party scrambles." },
      { headline: "Celebrity Spotted in Bizarre New Look", category: "Culture", blurb: "Fans are LOSING it. Photos inside." },
    ],
  };
  return {
    headlines: competitors.map(c => {
      const pool = samples[c] || [
        { headline: "Local Council Debates Late-Night Permits", category: "Local", blurb: "Residents split on noise concerns." },
        { headline: "Researchers Report Breakthrough in Battery Density", category: "Tech", blurb: "Lab results pending peer review." },
      ];
      return { outlet: c, ...pick(pool) };
    }),
  };
}

/* ------------ routes ------------ */

app.post("/api/review", async (req, res) => {
  const { title, body, author, newsroom, slant } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: "title and body required" });
  const userText = `Newsroom: ${newsroom || "Unknown"}\nReporter: ${author || "Unknown"}\nEditorial slant: ${slant || "balanced"}\n\nHEADLINE: ${title}\n\nARTICLE:\n${body}`;
  const ai = await callAI(REVIEWER_SYSTEM, userText);
  const ok = ai && ai.ratings && typeof ai.estimated_views === "number";
  res.json(ok ? ai : simulateReview({ title, body, slant }));
});

app.post("/api/reporter-article", async (req, res) => {
  const { reporterName, beat, newsroom, skill, tip } = req.body || {};
  const userText = `Newsroom: ${newsroom || "The Daily"}\nReporter: ${reporterName || "a junior reporter"}\nSkill level (0-100): ${skill ?? 50}\nBeat: ${beat || "general assignment"}${tip ? `\nLead/tip: ${tip}` : ""}\n\nDraft the article now.`;
  const ai = await callAI(REPORTER_SYSTEM, userText);
  const ok = ai && ai.title && ai.body;
  res.json(ok ? ai : simulateReporterArticle(beat, reporterName || "Staff Reporter"));
});

app.post("/api/breaking-news", async (req, res) => {
  const { context } = req.body || {};
  const ai = await callAI(BREAKING_SYSTEM, `Context: ${context || "general world events"}\nGenerate one breaking event now.`);
  const ok = ai && ai.headline;
  res.json(ok ? ai : simulateBreaking());
});

app.post("/api/competitor-headlines", async (req, res) => {
  const { competitors } = req.body || {};
  const list = Array.isArray(competitors) && competitors.length ? competitors : ["The Daily Ledger","Metro Wire","Capital Post","Tribune North","The Tabloid Times"];
  const ai = await callAI(COMPETITOR_SYSTEM, `Outlets and their personalities:\n${list.map(o => `- ${o}`).join("\n")}\n\nGenerate one headline per outlet. Tabloid-named outlets should be sensationalist; Post/Tribune/Ledger should be serious.`);
  if (ai && Array.isArray(ai.headlines) && ai.headlines.length) return res.json(ai);
  res.json(simulateCompetitorHeadlines(list));
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiProvider: "pollinations.ai (free)", model: POLLINATIONS_MODEL });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Newsroom Simulator running on http://localhost:${PORT}`);
  console.log(`AI: Pollinations.ai (free, no key) - fallback to local heuristics if unreachable`);
});
