import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const POLLINATIONS = "https://text.pollinations.ai";
const MODEL = "openai-fast";

/* ---------- AI helper (uses GET endpoint - more reliable than POST) ---------- */

function tryParseJson(text) {
  if (!text) return null;
  let s = String(text).trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try { return JSON.parse(s); } catch { /* fall through */ }
  const m = s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* fall through */ } }
  return null;
}

async function aiJson(prompt, { timeoutMs = 28000, seed } = {}) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    const url = `${POLLINATIONS}/${encodeURIComponent(prompt)}?model=${MODEL}&json=true${seed ? `&seed=${seed}` : ""}`;
    const resp = await fetch(url, { signal: c.signal });
    if (!resp.ok) return null;
    const text = await resp.text();
    return tryParseJson(text);
  } catch { return null; }
  finally { clearTimeout(t); }
}

/* ---------- heuristic fallbacks ---------- */

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const rand = (lo, hi) => Math.floor(lo + Math.random() * (hi - lo + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];

function gradeFromScore(s) {
  if (s >= 95) return "A+"; if (s >= 90) return "A"; if (s >= 85) return "A-";
  if (s >= 80) return "B+"; if (s >= 75) return "B"; if (s >= 70) return "B-";
  if (s >= 65) return "C+"; if (s >= 60) return "C"; if (s >= 55) return "C-";
  if (s >= 45) return "D"; return "F";
}

function detectCategory(title, body) {
  const t = ((title || "") + " " + (body || "")).toLowerCase();
  const map = {
    Tech: ["ai","software","app","startup","tech","silicon","cyber","crypto","chip","semiconductor","algorithm","robot"],
    Politics: ["senator","mayor","governor","election","congress","vote","party","bill","political","lawmaker","cabinet"],
    Business: ["market","stock","earnings","quarter","ceo","ipo","acquisition","merger","bank","fund","share","profit"],
    Sports: ["game","match","championship","team","coach","season","overtime","playoff","tournament","goal","draft"],
    Crime: ["police","arrest","suspect","trial","murder","theft","fraud","prosecutor","felony","indict"],
    Health: ["hospital","doctor","patient","disease","drug","vaccine","outbreak","clinic","health","medical","fda"],
    Climate: ["climate","wildfire","flood","storm","hurricane","emissions","carbon","wildlife","ecosystem","drought"],
    World: ["minister","embassy","treaty","border","foreign","international","summit","sanctions","kingdom","republic"],
    Culture: ["film","album","novel","exhibit","artist","actor","director","celebrity","festival","fashion"],
    Local: ["downtown","neighborhood","council","resident","sidewalk","park","school district","library"],
  };
  let best = "Local", bestScore = 0;
  for (const [cat, keys] of Object.entries(map)) {
    const score = keys.reduce((acc, k) => acc + (t.includes(k) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

function simulateReview({ title, body }) {
  const wordCount = (body || "").trim().split(/\s+/).filter(Boolean).length;
  const titleLen = (title || "").trim().length;
  const hasNumbers = /\d/.test(body || "");
  const hasQuote = /["“”]/.test(body || "");
  const allCaps = (title || "") === (title || "").toUpperCase() && titleLen > 5;
  const clickbait = /(you won'?t believe|shocking|insane|this one trick|gone wrong|wait until you see)/i.test(title || "");
  const profanity = /(\b(ass|crap|damn|hell|wtf|stupid)\b)/i.test((title||"") + " " + (body||""));
  const tiny = wordCount < 30;

  const writing = clamp(40 + Math.min(40, wordCount / 8) + (hasQuote ? 8 : 0) - (allCaps ? 12 : 0) - (profanity ? 10 : 0) - (tiny ? 35 : 0), 1, 99);
  const credibility = clamp(45 + (hasNumbers ? 15 : 0) + (hasQuote ? 10 : 0) - (clickbait ? 25 : 0) - (profanity ? 18 : 0) - (tiny ? 35 : 0) + rand(-8,8), 1, 99);
  const engagement = clamp(50 + (titleLen > 30 && titleLen < 80 ? 15 : 0) + (clickbait ? 18 : 0) + (profanity ? 8 : 0) - (tiny ? 25 : 0) + rand(-10,10), 1, 99);
  const sensational = clamp(30 + (clickbait ? 45 : 0) + (allCaps ? 20 : 0) + (profanity ? 22 : 0) + rand(-10,10), 1, 99);
  const originality = clamp(45 + rand(-15, 25) + (wordCount > 250 ? 10 : 0) - (tiny ? 30 : 0), 1, 99);

  const overall = Math.round(writing*0.3 + credibility*0.25 + engagement*0.25 + originality*0.2);
  const headline = clamp(40 + (titleLen > 25 && titleLen < 80 ? 25 : 0) + (clickbait ? 15 : -5) + rand(-10,10), 1, 99);
  const baseViews = Math.round(300 + engagement * 180 + headline * 60 + rand(-2000, 8000));
  const viral_factor = clamp(Math.round(engagement * 0.5 + sensational * 0.5 + rand(-10, 10)), 0, 100);
  const controversy = clamp(Math.round(sensational * 0.5 + (clickbait ? 30 : 0) + (profanity ? 20 : 0) + rand(-10,10)), 0, 100);

  const category = detectCategory(title, body);

  return {
    category,
    ratings: {
      writing_quality: Math.round(writing),
      factual_credibility: Math.round(credibility),
      engagement: Math.round(engagement),
      sensationalism: Math.round(sensational),
      originality: Math.round(originality),
    },
    overall_grade: gradeFromScore(overall),
    headline_score: Math.round(headline),
    estimated_views: Math.max(200, baseViews),
    tone: profanity ? "crass" : clickbait ? "tabloid" : sensational > 60 ? "punchy" : "measured",
    viral_factor,
    controversy,
    critique: tiny
      ? "Far too short to qualify as reporting. The piece is a stub at best, with no sourcing, structure, or stakes established."
      : profanity
        ? "Crude language and unfocused writing keep this from being taken seriously. The premise is unclear and the prose reads as a rant."
        : clickbait
          ? "An entertaining read undercut by a headline that overpromises. The reporting shows flashes of competence."
          : "A workmanlike entry that hits the basics. Stronger sourcing and a sharper lede would elevate it from filler to feature.",
    _simulated: true,
  };
}

/* ---------- comment personalities ---------- */

const COMMENT_TEMPLATES = {
  supportive: [
    "Finally someone covered this. {name}",
    "Great reporting. Saved for later.",
    "Refreshing to see actual journalism.",
    "Sharing with my friends. Thank you for this.",
    "{name} is doing the work nobody else will.",
  ],
  mean: [
    "Whoever wrote this should be fired. Genuinely awful.",
    "My dog wrote a better essay in second grade.",
    "Imagine getting paid to produce slop like this.",
    "Just unsubscribed. Worst article I've read all week.",
    "Embarrassing. Take it down.",
    "Cannot believe this passed editing. Garbage.",
    "{name} you should pick a new career.",
  ],
  oblivious: [
    "So when does it start? I didn't see a date.",
    "Wait, is this about taxes? I'm confused.",
    "Did anyone else read this twice? I missed the point.",
    "Cool but what does it mean for me?",
    "First!",
    "Where can I buy one?",
  ],
  skeptical: [
    "Sources? You can't just say things.",
    "Smells like a press release rewritten.",
    "Buried the lede.",
    "Where's the other side of this story?",
    "Convenient timing on this story.",
    "Show me the data, not vibes.",
  ],
  conspiracy: [
    "Funny how this comes out RIGHT NOW. Coincidence??",
    "Follow the money on this one.",
    "They don't want you to read between the lines.",
    "I've been saying this for years. WAKE UP.",
    "This is exactly what THEY want you to think.",
  ],
  troll: [
    "ratio + L + didn't read",
    "ok and?",
    "boring. next.",
    "midwit take",
    "🤡🤡🤡",
  ],
  specific: [
    "Curious about the funding source — anyone know which agency is picking this up?",
    "Worth noting the previous attempt at this in 2019 fell apart for similar reasons.",
    "Quote from Chen is interesting given her vote last year on the related bill.",
    "Eighteen months is ambitious for a project this size.",
    "How does this compare to the program in the neighboring county?",
  ],
};

const COMMENT_AUTHORS = {
  supportive: ["Margaret W.","Tom B.","@first_amendment","Dr. L. Chen","Sarah K.","Jordan P.","@news_junkie"],
  mean: ["@cynic","@hot_takes","@redditrefugee","@deletethis","DisgustedReader","@unsub_now"],
  oblivious: ["@randomguy42","ConfusedDad","@first_time_here","Linda R.","@huh","@whatever"],
  skeptical: ["@truthseeker","@show_me_data","Helen G.","@askingquestions","FactCheckThis"],
  conspiracy: ["@WAKEUP","@redpilled","DeepStateWatcher","@coincidence_nope"],
  troll: ["@ratiomachine","@LOL_OK","@grokenjoyer","@touchgrass"],
  specific: ["Prof. Daniel Reyes","@policywonk","Marisol H.","@civicnerd","D. Whitmore"],
};

function generateHeuristicComments(article, count) {
  const personalities = ["supportive","mean","oblivious","skeptical","conspiracy","troll","specific"];
  // Bias the distribution based on article qualities
  const sens = article.review?.ratings?.sensationalism || 30;
  const cont = article.review?.controversy || 30;
  const weights = {
    supportive: 25 - cont/8,
    mean: 12 + cont/4,
    oblivious: 18,
    skeptical: 15 + cont/10,
    conspiracy: 5 + cont/8,
    troll: 10 + sens/10,
    specific: 15,
  };
  const out = [];
  for (let i = 0; i < count; i++) {
    const tot = Object.values(weights).reduce((a,b)=>a+b,0);
    let r = Math.random() * tot;
    let chosen = "supportive";
    for (const p of personalities) {
      r -= weights[p];
      if (r <= 0) { chosen = p; break; }
    }
    const tmpl = pick(COMMENT_TEMPLATES[chosen]);
    const text = tmpl.replace("{name}", article.author || "the writer");
    out.push({ author: pick(COMMENT_AUTHORS[chosen]), text, personality: chosen });
  }
  return out;
}

/* ---------- reporter draft fallback ---------- */

function simulateReporterArticle(beat, reporterName) {
  const topics = [
    { title: "City Pilots AI Traffic System on Main Street Corridor", body: "Officials announced Tuesday a six-month pilot of an AI-driven traffic signal system along Main Street, aiming to cut average commute times by an estimated 18 percent. The system, supplied by a regional vendor, adjusts signal timing in response to real-time congestion data. \"We expect measurable improvements within ninety days,\" the transportation director said. Critics raised privacy questions about the cameras involved." },
    { title: "Downtown Bakery Reopens After Two-Year Renovation", body: "A neighborhood institution returned to business this morning as Halsted's Bakery reopened on Elm Avenue, ending a two-year closure prompted by a kitchen fire. Owner Marisol Halsted, 54, said the rebuild cost roughly 340,000 dollars and was financed in part by a local small-business grant. \"We never thought we'd see this place open again,\" said longtime patron David Reyes." },
    { title: "Regional Bank Posts Surprise Quarterly Loss", body: "Shares of MidState Financial fell 11 percent in pre-market trading after the bank reported a 42 million dollar quarterly loss, driven largely by writedowns on its commercial real estate portfolio. The bank's CEO described the quarter as an inflection point and signaled a strategic review." },
    { title: "Hospital System Rolls Out New Triage Protocol", body: "Three regional hospitals will adopt a revised emergency-room triage protocol next month, following a six-month pilot that administrators say cut average wait times by 22 percent. \"It's not magic, it's resourcing,\" said Dr. Helena Park." },
    { title: "Senator Faces Ethics Probe Over Consulting Payments", body: "A senate ethics committee has opened a preliminary review of payments senator Hugh Carver received from a consulting firm with state contracts. Carver denied wrongdoing. \"This is a transparent attempt to smear,\" his spokesperson said." },
  ];
  const t = pick(topics);
  return {
    title: t.title,
    body: `${t.body}\n\nFiled by ${reporterName}.${beat ? ` (Assigned beat: ${beat}.)` : ""}`,
  };
}

/* ---------- breaking news fallback ---------- */

function simulateBreaking() {
  const events = [
    { headline: "Power outage cascades across three neighborhoods", category: "Local", summary: "A substation failure has left roughly 40,000 homes without power. Utility crews are on scene; cause unclear.", urgency: "high" },
    { headline: "Whistleblower alleges contract steering at city DOT", category: "Politics", summary: "A former procurement officer claims contracts were routed to favored vendors over five years.", urgency: "high" },
    { headline: "AI startup acquired in surprise 1.2B deal", category: "Tech", summary: "A regional AI firm was acquired this morning by a multinational. Terms include 300M earnout.", urgency: "medium" },
    { headline: "Storm system intensifies overnight, flood watch issued", category: "Climate", summary: "Forecasters upgraded the system to a tropical depression. Low-lying neighborhoods are under flood watch.", urgency: "critical" },
    { headline: "Underdog team upsets defending champions in overtime", category: "Sports", summary: "A buzzer-beating three pointer ended a 17-game win streak.", urgency: "low" },
    { headline: "Recall expanded for popular cooking-spray brand", category: "Health", summary: "Regulators expanded a recall after additional contamination reports.", urgency: "medium" },
    { headline: "Senator's chief of staff resigns amid leaked memo", category: "Politics", summary: "The aide stepped down hours after a leaked internal memo went public.", urgency: "high" },
    { headline: "Wildfire jumps containment line, evacuations expanded", category: "Climate", summary: "Crews lost roughly 12 percent of containment overnight. Two additional communities ordered to evacuate.", urgency: "critical" },
  ];
  return pick(events);
}

function simulateCompetitorArticle(outlet, personality) {
  const tabloids = [
    { title: "YOU WON'T BELIEVE WHAT MAYOR JUST SAID ON HOT MIC", body: "A jaw-dropping moment caught on a still-live microphone has sent shockwaves through city hall. Insiders are calling it the biggest political flub of the year. Aides scrambled to contain the fallout.", category: "Politics" },
    { title: "CELEBRITY'S SHOCKING NEW LOOK HAS FANS LOSING IT", body: "Photos surfaced overnight showing the A-lister in an outfit nobody saw coming. Fan accounts are melting down across social media.", category: "Culture" },
  ];
  const serious = [
    { title: "City Budget Faces 80M Shortfall as Tax Receipts Slip", body: "Comptroller projections published this week show the city facing an 80 million dollar gap in the next fiscal year, driven by softer sales-tax receipts and rising debt-service costs. Officials say a hiring freeze is on the table.", category: "Politics" },
    { title: "Regional Hospital Network Cuts 220 Administrative Jobs", body: "The hospital system informed staff Tuesday that 220 administrative positions will be eliminated over the next quarter, citing a 60 million dollar operating loss.", category: "Business" },
  ];
  const pick1 = personality === "tabloid" ? pick(tabloids) : pick(serious);
  return { outlet, ...pick1, blurb: pick1.body.slice(0, 110) + "…" };
}

/* ---------- routes ---------- */

app.post("/api/review", async (req, res) => {
  const { title, body, author, newsroom } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: "title and body required" });
  // Return heuristic immediately - the AI version comes in via /api/review-ai
  const baseline = simulateReview({ title, body });
  res.json(baseline);
});

app.post("/api/review-ai", async (req, res) => {
  const { title, body, author, newsroom } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: "title and body required" });
  const prompt = `Rate this news article for a newsroom game. Return ONLY JSON. Schema: {"category":"Tech|Politics|Business|Sports|Culture|World|Local|Crime|Health|Climate","ratings":{"writing_quality":0-100,"factual_credibility":0-100,"engagement":0-100,"sensationalism":0-100,"originality":0-100},"overall_grade":"A+|A|A-|B+|B|B-|C+|C|C-|D|F","headline_score":0-100,"estimated_views":number 200-5000000,"tone":"short phrase","viral_factor":0-100,"controversy":0-100,"critique":"2-3 sentences in CJR style"}\n\nHEADLINE: ${title}\nARTICLE:\n${body.slice(0, 1500)}`;
  const ai = await aiJson(prompt, { timeoutMs: 26000 });
  if (ai && ai.ratings && ai.overall_grade) return res.json(ai);
  res.json(simulateReview({ title, body }));
});

app.post("/api/comments", async (req, res) => {
  const { title, body, author, count = 3 } = req.body || {};
  if (!title) return res.status(400).json({ error: "title required" });
  const personalities = ["supportive","mean","oblivious","skeptical","conspiracy","troll","specific"];
  const prompt = `Generate ${count} short reader comments on this article for a newsroom game. Mix personalities from: ${personalities.join(", ")}. Mean and troll comments should actually be rude/insulting. Oblivious ones should miss the point. Return ONLY JSON: {"comments":[{"author":"made-up handle","text":"1-2 sentences","personality":"one of the listed personalities"}]}\n\nHEADLINE: ${title}\nEXCERPT: ${(body||"").slice(0, 400)}`;
  const ai = await aiJson(prompt, { timeoutMs: 20000, seed: Math.floor(Math.random()*100000) });
  if (ai && Array.isArray(ai.comments) && ai.comments.length) return res.json(ai);
  res.json({ comments: generateHeuristicComments({ title, author, review: req.body.review }, count), _simulated: true });
});

app.post("/api/reporter-article", async (req, res) => {
  const { reporterName, beat, newsroom, skill, tip } = req.body || {};
  const prompt = `Draft a short fictional news article for a newsroom game. Return ONLY JSON: {"title":"max 90 chars","body":"200-350 words, inverted pyramid, at least one quote","category":"Politics|Business|Tech|Sports|Culture|World|Local|Crime|Health|Climate"}\n\nReporter: ${reporterName || "junior"}\nSkill (0-100): ${skill ?? 50}\nBeat: ${beat || "general"}${tip ? `\nLead: ${tip}` : ""}`;
  const ai = await aiJson(prompt, { timeoutMs: 26000 });
  if (ai && ai.title && ai.body) return res.json(ai);
  res.json(simulateReporterArticle(beat, reporterName || "Staff Reporter"));
});

app.post("/api/breaking-news", async (req, res) => {
  const { context } = req.body || {};
  const prompt = `Generate one breaking news event for a newsroom game. Return ONLY JSON: {"headline":"10-14 words","category":"Politics|Business|Tech|Sports|Culture|World|Local|Crime|Health|Climate","summary":"2-3 sentence neutral summary a reporter could use","urgency":"low|medium|high|critical"}\nVary the topic. Context: ${context || "general"}`;
  const ai = await aiJson(prompt, { timeoutMs: 22000 });
  if (ai && ai.headline) return res.json(ai);
  res.json(simulateBreaking());
});

app.post("/api/competitor-article", async (req, res) => {
  const { outlet, personality } = req.body || {};
  const styleGuide = personality === "tabloid"
    ? "sensationalist, all-caps allowed in headline, light on facts, gossip-heavy"
    : personality === "newswire" ? "terse, factual, just-the-facts wire style"
    : personality === "politicojuicy" ? "DC insider tone, anonymous-sources style"
    : "serious broadsheet voice, measured, sourced";
  const prompt = `Draft a short fictional news article from a rival paper "${outlet}" (style: ${styleGuide}) for a newsroom game. Return ONLY JSON: {"title":"headline","body":"180-280 words","category":"Politics|Business|Tech|Sports|Culture|World|Local|Crime|Health|Climate","blurb":"1-sentence teaser"}`;
  const ai = await aiJson(prompt, { timeoutMs: 24000 });
  if (ai && ai.title && ai.body) return res.json({ outlet, ...ai });
  res.json(simulateCompetitorArticle(outlet, personality));
});

app.post("/api/competitor-headlines", async (req, res) => {
  const { competitors } = req.body || {};
  const list = Array.isArray(competitors) && competitors.length ? competitors : ["The Daily Ledger","Metro Wire"];
  const prompt = `Generate fictional rival-paper headlines for a newsroom game. Return ONLY JSON: {"headlines":[{"outlet":"name","headline":"text","category":"Politics|Business|Tech|Sports|Culture|World|Local|Crime|Health|Climate","blurb":"1-sentence teaser"}]}\n\nOutlets (use each exactly once): ${list.join(", ")}\nMake tabloid-named outlets sensationalist; Post/Tribune/Ledger should be serious.`;
  const ai = await aiJson(prompt, { timeoutMs: 22000 });
  if (ai && Array.isArray(ai.headlines) && ai.headlines.length) return res.json(ai);
  // fallback heuristic
  res.json({
    headlines: list.map(outlet => simulateCompetitorArticle(outlet, /tabloid/i.test(outlet) ? "tabloid" : "serious")),
  });
});

app.post("/api/show-review", async (req, res) => {
  const { showTitle, hostName, format, viewership } = req.body || {};
  const prompt = `Brief TV ratings commentary for a fictional show "${showTitle}" hosted by ${hostName || "the host"}, format ${format || "news"}, projected viewership ${viewership || "moderate"}. Return ONLY JSON: {"rating":0-100,"verdict":"1-sentence verdict","trend":"rising|steady|falling"}`;
  const ai = await aiJson(prompt, { timeoutMs: 18000 });
  if (ai && typeof ai.rating === "number") return res.json(ai);
  const r = rand(40, 85);
  res.json({ rating: r, verdict: r > 70 ? "Strong ratings hold across demos." : r > 50 ? "Modest performance with room to grow." : "Sluggish opening week.", trend: pick(["rising","steady","falling"]), _simulated: true });
});

app.post("/api/owner-bid", async (req, res) => {
  const { newsroom } = req.body || {};
  const prompt = `Generate 3 fictional buyers for a struggling newsroom "${newsroom || "The Daily"}" being auctioned. Return ONLY JSON: {"bidders":[{"name":"buyer name","type":"billionaire|conglomerate|wire service|political interest|tech mogul","bid":number 50000-500000,"demand":"1 sentence editorial demand","personality":"hands-off|meddling|ideological|profit-driven","monthly_budget":number 2000-15000}]}\nMix the types. Demands should be specific (e.g. "softer coverage of tech giants", "more crime stories", "anti-incumbent editorial slant").`;
  const ai = await aiJson(prompt, { timeoutMs: 24000 });
  if (ai && Array.isArray(ai.bidders) && ai.bidders.length) return res.json(ai);
  res.json({
    bidders: [
      { name: "Castellan Holdings", type: "conglomerate", bid: 180000, demand: "Less critical coverage of energy and finance firms in the portfolio.", personality: "meddling", monthly_budget: 8000 },
      { name: "Senator H. Voss Trust", type: "political interest", bid: 95000, demand: "Editorial line favorable to the Voss platform and family interests.", personality: "ideological", monthly_budget: 5000 },
      { name: "Vance Reinhardt", type: "billionaire", bid: 250000, demand: "Quadruple the tech-and-innovation coverage; no profiles of competitors.", personality: "meddling", monthly_budget: 12000 },
    ],
    _simulated: true,
  });
});

app.get("/api/health", (_req, res) => res.json({ ok: true, aiProvider: "pollinations.ai (free)", model: MODEL }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Newsroom Simulator running on http://localhost:${PORT}`);
  console.log(`AI: Pollinations.ai (${MODEL}) - instant heuristic baseline + AI streams in over time`);
});
