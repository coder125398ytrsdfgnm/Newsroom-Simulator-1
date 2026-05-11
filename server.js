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

/* ============================ AI HELPER ============================ */

function tryParseJson(text) {
  if (!text) return null;
  let s = String(text).trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try { return JSON.parse(s); } catch {}
  const m = s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
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
    Tech: ["ai","software","app","startup","tech","silicon","cyber","crypto","chip","semiconductor","algorithm","robot","quantum","drone"],
    Politics: ["senator","mayor","governor","election","congress","vote","party","bill","political","lawmaker","cabinet","speaker","caucus"],
    Business: ["market","stock","earnings","quarter","ceo","ipo","acquisition","merger","bank","fund","share","profit","layoff"],
    Sports: ["game","match","championship","team","coach","season","overtime","playoff","tournament","goal","draft","rookie"],
    Crime: ["police","arrest","suspect","trial","murder","theft","fraud","prosecutor","felony","indict","sentenced"],
    Health: ["hospital","doctor","patient","disease","drug","vaccine","outbreak","clinic","health","medical","fda","epidemic"],
    Climate: ["climate","wildfire","flood","storm","hurricane","emissions","carbon","wildlife","ecosystem","drought","heatwave"],
    World: ["minister","embassy","treaty","border","foreign","international","summit","sanctions","kingdom","republic","ambassador"],
    Culture: ["film","album","novel","exhibit","artist","actor","director","celebrity","festival","fashion","gallery"],
    Local: ["downtown","neighborhood","council","resident","sidewalk","park","school district","library","zoning"],
  };
  let best = "Local", bestScore = 0;
  for (const [cat, keys] of Object.entries(map)) {
    const score = keys.reduce((acc, k) => acc + (t.includes(k) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

/* ============================ STORY CATALOG ============================ */
/* Realistic story seeds. Each is a real-feeling fictional starting point.    */
/* The AI uses these as foundations and writes them up properly.              */

const STORY_CATALOG = [
  // Politics
  { id: "p01", category: "Politics", beat: "City Hall", title: "Mayor proposes overhaul of zoning rules", hooks: ["affordable housing density", "neighborhood opposition", "developer lobbying", "5-year rollout"] },
  { id: "p02", category: "Politics", beat: "Politics", title: "Senator faces ethics inquiry over consulting payments", hooks: ["six-figure consulting fees", "state contracts", "denial from spokesperson", "previous probe in 2019"] },
  { id: "p03", category: "Politics", beat: "Politics", title: "Council deadlocks on surveillance camera expansion", hooks: ["ACLU opposition", "police chief support", "facial recognition concerns", "pilot in three neighborhoods"] },
  { id: "p04", category: "Politics", beat: "City Hall", title: "Mayoral race tightens as third candidate enters", hooks: ["independent run", "campaign finance disclosures", "polling within margin of error", "debate scheduled"] },
  { id: "p05", category: "Politics", beat: "Politics", title: "Whistleblower memo alleges contract steering at DOT", hooks: ["procurement officer fired", "favored vendor list", "FBI requests records", "agency denies wrongdoing"] },
  { id: "p06", category: "Politics", beat: "Politics", title: "Governor signs sweeping public records reform", hooks: ["72-hour response requirement", "fee caps", "transparency advocates praise", "agencies warn of backlog"] },

  // Business
  { id: "b01", category: "Business", beat: "Business", title: "Regional bank reports surprise quarterly loss", hooks: ["commercial real estate writedowns", "11% stock drop", "CEO calls it inflection point", "analysts had expected modest earnings"] },
  { id: "b02", category: "Business", beat: "Finance", title: "Crypto lender files for bankruptcy protection", hooks: ["customer withdrawal freeze", "$2B in liabilities", "regulators investigating", "founder unavailable for comment"] },
  { id: "b03", category: "Business", beat: "Business", title: "Manufacturing plant closure announced; 800 jobs lost", hooks: ["relocation to lower-cost region", "60-day notice", "union negotiating severance", "mayor pleads for reconsideration"] },
  { id: "b04", category: "Business", beat: "Business", title: "Coffee chain rolls out tipping reform after staff vote", hooks: ["base wage increase", "tip pool consolidation", "customer pushback", "competitors watching"] },
  { id: "b05", category: "Business", beat: "Finance", title: "Pension fund discloses $1.2B exposure to failed firm", hooks: ["board to convene emergency meeting", "consultants under scrutiny", "lawmakers demand testimony", "retiree groups alarmed"] },
  { id: "b06", category: "Business", beat: "Business", title: "Grocery merger blocked by federal antitrust suit", hooks: ["FTC chair statement", "$25B deal in jeopardy", "union supports block", "share price tumbles"] },

  // Tech
  { id: "t01", category: "Tech", beat: "Tech", title: "City pilots AI traffic signal system", hooks: ["18% commute reduction projected", "privacy concerns over cameras", "six-month trial", "regional vendor contract"] },
  { id: "t02", category: "Tech", beat: "Tech", title: "Researchers report battery density breakthrough", hooks: ["solid-state cells", "lab results pending peer review", "automaker partnership rumored", "commercialization 5+ years out"] },
  { id: "t03", category: "Tech", beat: "Tech", title: "Major social platform rolls back content rules", hooks: ["civil rights groups protest", "advertisers reconsidering", "CEO calls it free expression", "internal staff resignations"] },
  { id: "t04", category: "Tech", beat: "Tech", title: "Data breach exposes 4.2 million customer records", hooks: ["payment info compromised", "company learned weeks ago", "class action filed", "regulators notified"] },
  { id: "t05", category: "Tech", beat: "Tech", title: "AI chip startup acquired in $1.2B deal", hooks: ["earnout structure", "founder retains 40% stake", "talent retention clauses", "antitrust review expected"] },
  { id: "t06", category: "Tech", beat: "Tech", title: "Court ruling expands gig worker protections", hooks: ["companies must classify drivers as employees", "appeals expected", "industry trade group reaction", "wage and benefit implications"] },
  { id: "t07", category: "Tech", beat: "Tech", title: "Drone delivery pilot expands to three new neighborhoods", hooks: ["noise complaints", "FAA waiver", "20-minute delivery window", "retailer partnership"] },

  // Sports
  { id: "s01", category: "Sports", beat: "Sports", title: "Defending champions upset in overtime thriller", hooks: ["buzzer-beating three", "17-game win streak ended", "court stormed", "MVP candidate sidelined"] },
  { id: "s02", category: "Sports", beat: "Sports", title: "Star quarterback signs record extension", hooks: ["$420M total value", "no-trade clause", "incentive ladders", "salary cap implications"] },
  { id: "s03", category: "Sports", beat: "Sports", title: "Olympic hopeful suspended pending hearing", hooks: ["doping protocol violation", "sample taken in March", "appeal filed", "team reorganizing relay"] },
  { id: "s04", category: "Sports", beat: "Sports", title: "Hometown team announces new stadium financing plan", hooks: ["$1.4B project", "public funding share contested", "council vote next month", "concession workers organizing"] },
  { id: "s05", category: "Sports", beat: "Sports", title: "Rookie sensation breaks 30-year scoring record", hooks: ["41 points in debut month", "draft class watchers", "coach calls it generational", "marketing offers pouring in"] },

  // Crime
  { id: "c01", category: "Crime", beat: "Crime", title: "Police arrest suspect in string of warehouse burglaries", hooks: ["surveillance led to identification", "ten incidents linked", "second suspect at large", "arraignment Thursday"] },
  { id: "c02", category: "Crime", beat: "Investigations", title: "Federal indictment alleges $80M fraud scheme", hooks: ["fake investment fund", "200+ victims", "decade-long operation", "asset forfeiture pending"] },
  { id: "c03", category: "Crime", beat: "Crime", title: "Hate crime charges filed in vandalism case", hooks: ["community center targeted", "graffiti and broken windows", "second incident this year", "rally planned for Saturday"] },
  { id: "c04", category: "Crime", beat: "Investigations", title: "Cold case murder reopened after new DNA evidence", hooks: ["1997 victim", "lab reanalysis program", "family demands answers", "former detective questions handling"] },
  { id: "c05", category: "Crime", beat: "Crime", title: "Police union and city clash over reform proposal", hooks: ["body camera rules", "civilian review board powers", "contract negotiations stalled", "third public hearing"] },

  // Health
  { id: "h01", category: "Health", beat: "Health", title: "Hospital system rolls out new triage protocol", hooks: ["22% wait time reduction in pilot", "rapid-assessment nurse role", "state may recommend statewide", "training costs"] },
  { id: "h02", category: "Health", beat: "Health", title: "Recall expanded for popular cooking spray brand", hooks: ["contamination reports in 12 states", "affected lot numbers", "refund process", "company stock dips"] },
  { id: "h03", category: "Health", beat: "Health", title: "New respiratory illness cluster reported in three schools", hooks: ["dozens of students absent", "health dept investigating", "no hospitalizations so far", "parents concerned"] },
  { id: "h04", category: "Health", beat: "Health", title: "Insurer pulls out of state's exchange marketplace", hooks: ["140,000 affected enrollees", "rate hikes from competitors", "regulators scramble", "open enrollment looming"] },
  { id: "h05", category: "Health", beat: "Health", title: "Nurses ratify new contract after 3-week strike", hooks: ["staffing ratio guarantees", "wage increase", "no-strike clause", "union calls it a model"] },

  // Climate / Weather
  { id: "cl01", category: "Climate", beat: "Climate", title: "Storm system intensifies; flood watch issued", hooks: ["tropical depression upgrade", "low-lying neighborhoods", "shelter capacity strained", "utilities prepositioning crews"] },
  { id: "cl02", category: "Climate", beat: "Climate", title: "Wildfire jumps containment line; evacuations expanded", hooks: ["12% of containment lost overnight", "two communities ordered out", "air quality alerts", "federal aid request"] },
  { id: "cl03", category: "Climate", beat: "Climate", title: "Coastal town adopts managed retreat plan", hooks: ["50 properties to be acquired", "$120M federal grant", "homeowner reluctance", "model for other towns"] },
  { id: "cl04", category: "Climate", beat: "Climate", title: "Heat dome hits region; emergency cooling centers open", hooks: ["record overnight lows", "elderly outreach", "grid stress warnings", "school early dismissal"] },
  { id: "cl05", category: "Climate", beat: "Climate", title: "EPA proposes tightened air-quality rules for ports", hooks: ["industry opposition", "asthma rate data", "public comment period", "state implementation timeline"] },

  // World
  { id: "w01", category: "World", beat: "World", title: "Diplomatic talks collapse after leaked memo", hooks: ["closed-door session walkout", "third-party mediator suggested", "trade implications", "leaders trade barbs"] },
  { id: "w02", category: "World", beat: "World", title: "Foreign currency reserves hit decade low", hooks: ["IMF talks ongoing", "import restrictions", "fuel queues lengthen", "central bank intervention"] },
  { id: "w03", category: "World", beat: "World", title: "Election monitors flag irregularities in vote count", hooks: ["disputed precincts", "opposition party demands recount", "observers' preliminary report", "EU expresses concern"] },
  { id: "w04", category: "World", beat: "World", title: "Aid convoy reaches besieged region after weeks of blockade", hooks: ["20 trucks of food and medical supplies", "agreement details opaque", "more convoys expected", "civilian needs vast"] },

  // Culture
  { id: "cu01", category: "Culture", beat: "Culture", title: "Festival cancellation triggers refund chaos", hooks: ["headliner pullout", "vendor lawsuits", "city permit issues", "fan disappointment"] },
  { id: "cu02", category: "Culture", beat: "Arts", title: "Museum returns disputed artifacts to country of origin", hooks: ["150-year provenance dispute", "diplomatic ceremony", "scholarly debate", "future restitution policy"] },
  { id: "cu03", category: "Culture", beat: "Culture", title: "Streaming series sparks unexpected social debate", hooks: ["critic divisions", "viewership records", "creator interview goes viral", "production company defends choices"] },
  { id: "cu04", category: "Culture", beat: "Arts", title: "Independent bookstore reopens after community fundraiser", hooks: ["$78,000 raised in two months", "owner emotional at ribbon cutting", "new author event series", "rent agreement secured"] },

  // Local
  { id: "l01", category: "Local", beat: "Local", title: "Downtown bakery reopens after two-year renovation", hooks: ["kitchen fire closure", "$340,000 rebuild", "small-business grant", "long lines opening day"] },
  { id: "l02", category: "Local", beat: "Local", title: "School board approves new dress code policy", hooks: ["parent objections", "uniform supplier contract", "enforcement guidance", "September rollout"] },
  { id: "l03", category: "Local", beat: "Local", title: "Light rail extension breaks ground after 6-year planning", hooks: ["$890M project", "construction timeline", "ridership projections", "neighborhood impact studies"] },
  { id: "l04", category: "Local", beat: "Education", title: "School district faces budget shortfall, eyes program cuts", hooks: ["arts and athletics on the table", "state funding shortfall", "parent advocacy", "vote next Tuesday"] },
  { id: "l05", category: "Local", beat: "Local", title: "Public library expands hours after pilot success", hooks: ["weekend evening expansion", "$220K added budget", "community usage spike", "model for branches"] },
];

function pickCatalogStory(beat) {
  if (beat) {
    const beatMatches = STORY_CATALOG.filter(s => s.beat === beat || s.category === beat);
    if (beatMatches.length) return pick(beatMatches);
  }
  return pick(STORY_CATALOG);
}

/* ============================ REVIEW (heuristic) ============================ */

function simulateReview({ title, body }) {
  const wordCount = (body || "").trim().split(/\s+/).filter(Boolean).length;
  const titleLen = (title || "").trim().length;
  const hasNumbers = /\d/.test(body || "");
  const hasQuote = /["“”]/.test(body || "");
  const allCaps = (title || "") === (title || "").toUpperCase() && titleLen > 5;
  const clickbait = /(you won'?t believe|shocking|insane|this one trick|gone wrong|wait until you see)/i.test(title || "");
  const profanity = /(\b(ass|crap|damn|hell|wtf|stupid|shit|fuck|bitch)\b)/i.test((title||"") + " " + (body||""));
  const tiny = wordCount < 30;

  const writing = clamp(40 + Math.min(40, wordCount / 8) + (hasQuote ? 8 : 0) - (allCaps ? 12 : 0) - (profanity ? 10 : 0) - (tiny ? 35 : 0), 1, 99);
  const credibility = clamp(45 + (hasNumbers ? 15 : 0) + (hasQuote ? 10 : 0) - (clickbait ? 25 : 0) - (profanity ? 18 : 0) - (tiny ? 35 : 0) + rand(-8,8), 1, 99);
  const engagement = clamp(50 + (titleLen > 30 && titleLen < 80 ? 15 : 0) + (clickbait ? 18 : 0) + (profanity ? 8 : 0) - (tiny ? 25 : 0) + rand(-10,10), 1, 99);
  const sensational = clamp(30 + (clickbait ? 45 : 0) + (allCaps ? 20 : 0) + (profanity ? 22 : 0) + rand(-10,10), 1, 99);
  const originality = clamp(45 + rand(-15, 25) + (wordCount > 250 ? 10 : 0) - (tiny ? 30 : 0), 1, 99);

  const overall = Math.round(writing*0.3 + credibility*0.25 + engagement*0.25 + originality*0.2);
  const headline = clamp(40 + (titleLen > 25 && titleLen < 80 ? 25 : 0) + (clickbait ? 15 : -5) + rand(-10,10), 1, 99);
  const baseViews = Math.round(300 + engagement * 180 + headline * 60 + rand(-2000, 8000));

  return {
    category: detectCategory(title, body),
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
    viral_factor: clamp(Math.round(engagement * 0.5 + sensational * 0.5 + rand(-10, 10)), 0, 100),
    controversy: clamp(Math.round(sensational * 0.5 + (clickbait ? 30 : 0) + (profanity ? 20 : 0) + rand(-10,10)), 0, 100),
    critique: tiny
      ? "Far too short to qualify as reporting. The piece is a stub at best, with no sourcing, structure, or stakes established."
      : profanity
        ? "Crude language and unfocused writing keep this from being taken seriously."
        : clickbait
          ? "An entertaining read undercut by a headline that overpromises."
          : "A workmanlike entry that hits the basics. Stronger sourcing and a sharper lede would elevate it.",
    _simulated: true,
  };
}

/* ============================ MINIMAL COMMENT FALLBACK ============================ */

const MINIMAL_FALLBACK_COMMENTS = [
  { author: "@reader37", text: "Trying to understand what the actual takeaway is here. Anyone?" },
  { author: "L. Donnelly", text: "Decent reporting but I'd like to see who's quoted on the other side." },
  { author: "@following_along", text: "Saved this one to come back to once there's more info." },
];

/* ============================ ROUTES ============================ */

app.post("/api/review", async (req, res) => {
  const { title, body } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: "title and body required" });
  res.json(simulateReview({ title, body }));
});

app.post("/api/review-ai", async (req, res) => {
  const { title, body } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: "title and body required" });
  const prompt = `Rate this news article for a newsroom game. Return ONLY JSON. Schema: {"category":"Tech|Politics|Business|Sports|Culture|World|Local|Crime|Health|Climate","ratings":{"writing_quality":0-100,"factual_credibility":0-100,"engagement":0-100,"sensationalism":0-100,"originality":0-100},"overall_grade":"A+|A|A-|B+|B|B-|C+|C|C-|D|F","headline_score":0-100,"estimated_views":number 200-5000000,"tone":"short phrase","viral_factor":0-100,"controversy":0-100,"critique":"2-3 sentences in CJR style"}\n\nHEADLINE: ${title}\nARTICLE:\n${body.slice(0, 1500)}`;
  const ai = await aiJson(prompt, { timeoutMs: 26000 });
  if (ai && ai.ratings && ai.overall_grade) return res.json(ai);
  res.json(simulateReview({ title, body }));
});

/* Comments are 100% AI. Each call generates engaged, content-specific comments.
   Some can reference recent prior coverage (history). Personalities are an
   internal hint to the AI to vary the voice — we never expose the label to the player. */
app.post("/api/comments", async (req, res) => {
  const { title, body, count = 3, history = [] } = req.body || {};
  if (!title) return res.status(400).json({ error: "title required" });

  const historyHint = Array.isArray(history) && history.length
    ? `\nRecent prior coverage from this same newsroom (you may reference one of these in roughly one comment if it makes sense — by topic, not by name): ${history.slice(0, 4).map(h => `"${h}"`).join("; ")}`
    : "";

  const prompt = `Generate ${count} reader comments for a news article. They must be SPECIFIC to the article's actual content — quoting numbers, names, or claims from the piece. Vary the voices: include enthusiastic supporters, dismissive haters, conspiracy theorists, confused/oblivious readers, well-informed critics, and pure ragebait trolls. Mean comments should be ACTUAL ragebait that argues with the substance, not lazy "ratio L" replies — e.g. "what the hell do you mean AI traffic signals reduce commutes, you idiots are buying corporate propaganda again". Oblivious comments should completely miss the point or ask basic questions that show they didn't read. NEVER label personality in the text itself. Return ONLY JSON: {"comments":[{"author":"handle or full name","text":"1-3 sentences"}]}${historyHint}\n\nHEADLINE: ${title}\nARTICLE:\n${(body||"").slice(0, 900)}`;

  const ai = await aiJson(prompt, { timeoutMs: 22000, seed: Math.floor(Math.random()*100000) });
  if (ai && Array.isArray(ai.comments) && ai.comments.length) {
    // Strip any leaked personality labels the AI might add
    const cleaned = ai.comments.map(c => ({
      author: String(c.author || "anon").slice(0, 40),
      text: String(c.text || "").slice(0, 400),
    }));
    return res.json({ comments: cleaned });
  }
  res.json({ comments: MINIMAL_FALLBACK_COMMENTS.slice(0, count), _fallback: true });
});

/* Reporter article — seeded by the story catalog */
app.post("/api/reporter-article", async (req, res) => {
  const { reporterName, beat, newsroom, skill, tip } = req.body || {};
  const seed = pickCatalogStory(beat);
  const prompt = `Write a fictional news article for a newsroom game, based on this story seed (you must use it as the foundation but flesh it out fully). Return ONLY JSON: {"title":"max 90 chars","body":"220-360 words inverted pyramid with at least one quote and one specific number","category":"${seed.category}"}\n\nSEED TOPIC: ${seed.title}\nKEY HOOKS TO WEAVE IN: ${seed.hooks.join("; ")}\nReporter: ${reporterName || "junior"}\nReporter skill (0-100): ${skill ?? 50}\nBeat: ${beat || seed.beat}${tip ? `\nLead/tip from editor: ${tip}` : ""}`;
  const ai = await aiJson(prompt, { timeoutMs: 26000 });
  if (ai && ai.title && ai.body) return res.json({ ...ai, category: ai.category || seed.category });
  // Fallback: synthesize from the seed itself
  const body = `${seed.title}, sources confirmed today. ${seed.hooks.map(h => `Officials cited ${h}.`).join(" ")} "${pick(["This is overdue", "We're reviewing all options", "Residents deserve answers", "This will not stand", "Our community is watching"])}," said a spokesperson. Filed by ${reporterName || "Staff"}.`;
  res.json({ title: seed.title, body, category: seed.category });
});

/* Reporter pitches — the reporter brings YOU a story idea */
app.post("/api/reporter-pitch", async (req, res) => {
  const { reporterName, beat, recentHistory = [] } = req.body || {};
  const seed = pickCatalogStory(beat);
  const histStr = recentHistory.length ? `\nThings the newsroom has recently covered (avoid repeats): ${recentHistory.slice(0,3).join("; ")}` : "";
  const prompt = `A reporter named ${reporterName || "a junior reporter"} (beat: ${beat || "general"}) is pitching their editor a fresh story angle. Use this seed as inspiration: "${seed.title}" — hooks: ${seed.hooks.join("; ")}.${histStr}\n\nReturn ONLY JSON: {"pitch":"1-2 sentences as if the reporter is speaking informally to the editor","angle":"the specific angle or hook (under 12 words)","category":"${seed.category}"}`;
  const ai = await aiJson(prompt, { timeoutMs: 18000 });
  if (ai && ai.pitch) return res.json({ ...ai, category: ai.category || seed.category });
  res.json({
    pitch: `Hey — I've got a source on ${seed.title.toLowerCase()}. ${pick(["I think we can have this filed by tomorrow.","Want me to dig in?","It's got legs."])}`,
    angle: seed.hooks[0] || seed.title,
    category: seed.category,
  });
});

/* Breaking news */
app.post("/api/breaking-news", async (req, res) => {
  const { context } = req.body || {};
  const seed = pick(STORY_CATALOG);
  const prompt = `Generate one breaking news event for a newsroom game. Use this story seed as inspiration: "${seed.title}" hooks ${seed.hooks.join("; ")}. Return ONLY JSON: {"headline":"10-14 words","category":"${seed.category}","summary":"2-3 sentence neutral summary","urgency":"low|medium|high|critical"}\nContext: ${context || "general"}`;
  const ai = await aiJson(prompt, { timeoutMs: 22000 });
  if (ai && ai.headline) return res.json(ai);
  res.json({ headline: seed.title, category: seed.category, summary: `${seed.title}. ${seed.hooks.map(h => `Key factor: ${h}.`).join(" ")}`, urgency: pick(["low","medium","high"]) });
});

/* Competitor articles & headlines */
app.post("/api/competitor-article", async (req, res) => {
  const { outlet, personality } = req.body || {};
  const seed = pick(STORY_CATALOG);
  const styleGuide = personality === "tabloid"
    ? "sensationalist, all-caps allowed in headline, light on facts, gossip-heavy, dramatic verbs"
    : personality === "newswire" ? "terse, factual, just-the-facts wire style, no adjectives"
    : personality === "politicojuicy" ? "DC insider tone, anonymous sources, beltway jargon"
    : "serious broadsheet voice, measured, properly sourced";
  const prompt = `Draft a short fictional news article from rival paper "${outlet}" (style: ${styleGuide}) based on this seed: "${seed.title}" hooks ${seed.hooks.join("; ")}. Return ONLY JSON: {"title":"headline","body":"180-280 words","category":"${seed.category}","blurb":"1-sentence teaser"}`;
  const ai = await aiJson(prompt, { timeoutMs: 24000 });
  if (ai && ai.title && ai.body) return res.json({ outlet, ...ai, category: ai.category || seed.category });
  res.json({ outlet, title: seed.title, body: `${seed.title}. ${seed.hooks.map(h => `Reporting: ${h}.`).join(" ")}`, category: seed.category, blurb: seed.hooks[0] });
});

app.post("/api/competitor-headlines", async (req, res) => {
  const { competitors } = req.body || {};
  const list = Array.isArray(competitors) && competitors.length ? competitors : ["The Daily Ledger","Metro Wire"];
  const prompt = `Generate fictional rival-paper headlines for a newsroom game. Each headline must be inspired by one of these real story seeds (pick a different one for each outlet): ${STORY_CATALOG.slice(0, 20).map(s => `"${s.title}"`).join(", ")}.\n\nOutlets: ${list.join(", ")}\nMake tabloid-named outlets sensationalist. Serious outlets get measured headlines.\n\nReturn ONLY JSON: {"headlines":[{"outlet":"name","headline":"text","category":"Politics|Business|Tech|Sports|Culture|World|Local|Crime|Health|Climate","blurb":"1-sentence teaser"}]}`;
  const ai = await aiJson(prompt, { timeoutMs: 22000 });
  if (ai && Array.isArray(ai.headlines) && ai.headlines.length) return res.json(ai);
  res.json({ headlines: list.map(outlet => { const s = pick(STORY_CATALOG); return { outlet, headline: s.title, category: s.category, blurb: s.hooks[0] }; }) });
});

app.post("/api/show-review", async (req, res) => {
  const { showTitle, hostName, format, viewership } = req.body || {};
  const prompt = `Brief TV ratings commentary for fictional show "${showTitle}" hosted by ${hostName || "the host"}, format ${format || "news"}, viewership ${viewership || "moderate"}. Return ONLY JSON: {"rating":0-100,"verdict":"1-sentence verdict","trend":"rising|steady|falling"}`;
  const ai = await aiJson(prompt, { timeoutMs: 18000 });
  if (ai && typeof ai.rating === "number") return res.json(ai);
  const r = rand(40, 85);
  res.json({ rating: r, verdict: r > 70 ? "Strong ratings hold across demos." : r > 50 ? "Modest performance with room to grow." : "Sluggish opening week.", trend: pick(["rising","steady","falling"]) });
});

app.post("/api/owner-bid", async (req, res) => {
  const { newsroom, voluntary } = req.body || {};
  const ctxMsg = voluntary ? "The newsroom is being put up for sale voluntarily by an owner seeking better backing. Bids should be more generous than a distressed auction." : "The newsroom is in financial distress and is being auctioned.";
  const prompt = `Generate 3 fictional buyers for a newsroom "${newsroom || "The Daily"}". ${ctxMsg} Return ONLY JSON: {"bidders":[{"name":"buyer name","type":"billionaire|conglomerate|wire service|political interest|tech mogul|foundation","bid":number ${voluntary ? "150000-700000" : "50000-400000"},"demand":"1 sentence editorial demand (specific)","personality":"hands-off|meddling|ideological|profit-driven","monthly_budget":number ${voluntary ? "4000-18000" : "2000-12000"}}]}`;
  const ai = await aiJson(prompt, { timeoutMs: 24000 });
  if (ai && Array.isArray(ai.bidders) && ai.bidders.length) return res.json(ai);
  res.json({
    bidders: [
      { name: "Castellan Holdings", type: "conglomerate", bid: voluntary ? 280000 : 180000, demand: "Soften coverage of energy and finance firms in the portfolio.", personality: "meddling", monthly_budget: 8000 },
      { name: "Senator H. Voss Trust", type: "political interest", bid: voluntary ? 150000 : 95000, demand: "Editorial line favorable to the Voss platform and family interests.", personality: "ideological", monthly_budget: 5000 },
      { name: "Vance Reinhardt", type: "billionaire", bid: voluntary ? 400000 : 250000, demand: "Quadruple tech and innovation coverage; no profiles of competitors.", personality: "meddling", monthly_budget: 12000 },
    ],
  });
});

app.get("/api/health", (_req, res) => res.json({ ok: true, aiProvider: "pollinations.ai (free)", model: MODEL, catalogSize: STORY_CATALOG.length }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Newsroom Simulator running on http://localhost:${PORT}`);
  console.log(`AI: Pollinations.ai (${MODEL}). Story catalog: ${STORY_CATALOG.length} seeds.`);
});
