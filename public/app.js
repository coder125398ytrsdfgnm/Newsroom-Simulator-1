"use strict";

const STORAGE_KEY = "newsroom-sim-state-v2";

const FIRST_NAMES = ["Alex","Riley","Jordan","Sam","Casey","Morgan","Taylor","Jamie","Drew","Avery","Cameron","Reese","Quinn","Devon","Harper","Skyler","Logan","Rowan","Sasha","Emerson","Marisol","Diego","Priya","Yusuf","Wen","Kai","Noor","Tomás","Ines","Aki","Beatrice","Cyrus","Olive","Hank","Greta","Mateo","Imani","Otto","Linnea","Rafael"];
const LAST_NAMES = ["Carter","Brooks","Vega","Patel","Nguyen","Cohen","Okafor","Rivera","Hughes","Martin","Sato","Khan","Andersen","Romano","Bauer","Park","Velasquez","Singh","Müller","Marsh","Holloway","Ortiz","Petrov","Hayashi","Bennett","Diallo","Goss","Whitcomb","Sandoval","Toledo"];
const BEATS = ["City Hall","Tech","Business","Crime","Sports","Culture","World","Investigations","Climate","Health","Politics","Education","Arts","Finance"];

/* ---------- Bureaus ---------- */
const BUREAUS = [
  { id: "metroville",  name: "Metroville HQ",  flag: "🏙️", desc: "Your home base. General-assignment coverage.",                  unlocks: ["Local","Culture"],                  cost: 0 },
  { id: "new-haven",   name: "New Haven",      flag: "🏛️", desc: "Capital city. Politicians, lobbyists, hearings.",               unlocks: ["Politics","World"],                cost: 8000 },
  { id: "silicon-bay", name: "Silicon Bay",    flag: "💻", desc: "Tech hub. Startups, IPOs, hardware leaks.",                       unlocks: ["Tech","Business"],                 cost: 12000 },
  { id: "gotham-east", name: "Gotham East",    flag: "🚨", desc: "Crime beat. Courts, precincts, mob trials.",                      unlocks: ["Crime","Investigations"],          cost: 10000 },
  { id: "port-royal",  name: "Port Royal",     flag: "⚓", desc: "Trade and finance. Banks, ports, regulators.",                    unlocks: ["Finance","Business"],              cost: 14000 },
  { id: "sunset-isle", name: "Sunset Isle",    flag: "🎬", desc: "Entertainment industry. Studios, festivals, scandals.",           unlocks: ["Culture","Arts"],                  cost: 9000 },
  { id: "kilimanjaro", name: "Kilimanjaro Desk", flag: "🌍", desc: "Foreign correspondence. War, diplomacy, climate.",              unlocks: ["World","Climate"],                 cost: 18000 },
  { id: "olympia",     name: "Olympia",        flag: "🏟️", desc: "Sports central. Drafts, trades, championships.",                 unlocks: ["Sports"],                          cost: 7000 },
];

/* ---------- Competitor personalities ---------- */
const COMPETITORS_BASE = [
  { id: "ledger",   name: "The Daily Ledger",  logo: "🗞️", bio: "Establishment broadsheet. Big on politics and policy.",     personality: "serious",       baseShare: 22 },
  { id: "wire",     name: "Metro Wire",        logo: "📡", bio: "Wire service. Fast, factual, sometimes thin.",              personality: "newswire",      baseShare: 18 },
  { id: "post",     name: "Capital Post",      logo: "🏛️", bio: "DC-style political insider. Loves leaks.",                  personality: "politicojuicy", baseShare: 16 },
  { id: "tribune",  name: "Tribune North",     logo: "🧭", bio: "Regional paper of record. Sports, climate, courts.",        personality: "broadsheet",    baseShare: 14 },
  { id: "tabloid",  name: "The Tabloid Times", logo: "🔥", bio: "Pure sensationalism. Clickbait, gossip, ALL CAPS.",         personality: "tabloid",       baseShare: 20 },
];

/* ---------- Achievements ---------- */
const ACHIEVEMENTS = [
  { id: "first_article", title: "First Byline",       icon: "✍️", desc: "Publish your first article.",          test: s => s.articles.length >= 1 },
  { id: "ten_articles",  title: "Cub Reporter",       icon: "📝", desc: "Publish 10 articles.",                  test: s => s.articles.length >= 10 },
  { id: "hundred_arts",  title: "Beat Veteran",       icon: "📚", desc: "Publish 100 articles.",                 test: s => s.articles.length >= 100 },
  { id: "viral",         title: "Going Viral",        icon: "🚀", desc: "An article projects over 100k views.",   test: s => s.articles.some(a => (a.review.estimated_views||0) >= 100000) },
  { id: "pulitzer",      title: "Pulitzer Pulse",     icon: "🏆", desc: "Earn an A+ on any article.",             test: s => s.articles.some(a => a.review.overall_grade === "A+") },
  { id: "millionaire",   title: "Press Mogul",        icon: "💰", desc: "Reach $50,000 in cash.",                 test: s => s.stats.cash >= 50000 },
  { id: "staffed",       title: "Staffed Up",         icon: "👥", desc: "Hire 5 reporters.",                       test: s => s.reporters.length >= 5 },
  { id: "global",        title: "Going Global",       icon: "🌍", desc: "Own 4 or more bureaus.",                 test: s => s.bureaus.filter(b => b.owned).length >= 4 },
  { id: "high_rep",      title: "Trusted Source",     icon: "📰", desc: "Reach 85 reputation.",                    test: s => s.stats.reputation >= 85 },
  { id: "market_leader", title: "Market Leader",      icon: "👑", desc: "Reach 30% market share.",                test: s => s.stats.marketShare >= 30 },
  { id: "tabloid_king",  title: "King of Sleaze",     icon: "🌶️", desc: "Publish 5 articles with 70+ sensationalism.", test: s => s.articles.filter(a => (a.review.ratings?.sensationalism||0) >= 70).length >= 5 },
  { id: "principled",    title: "Principled Press",   icon: "⚖️", desc: "Publish 5 articles with 85+ credibility.",     test: s => s.articles.filter(a => (a.review.ratings?.factual_credibility||0) >= 85).length >= 5 },
];

/* ---------- State ---------- */
let state = loadState();

function defaultState() {
  return {
    onboarded: false,
    version: 2,
    newsroom: { name: "The Daily", logo: "📰", motto: "All the news that fits.", founded: Date.now(), city: "metroville", themeColor: "#cc0000", slant: 50, density: 50 },
    player: { name: "You" },
    stats: { cash: 5000, reputation: 50, totalViews: 0, marketShare: 5 },
    reporters: [],
    pendingApprovals: [],
    articles: [],
    candidatePool: [],
    bureaus: BUREAUS.map((b, i) => ({ ...b, owned: i === 0 })),
    competitors: COMPETITORS_BASE.map(c => ({ ...c, share: c.baseShare })),
    competitorHeadlines: [],
    breaking: null,
    achievements: {}, // id -> unlocked timestamp
    notifications: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const def = defaultState();
    // shallow merge with default to handle schema additions
    return {
      ...def,
      ...parsed,
      newsroom: { ...def.newsroom, ...(parsed.newsroom || {}) },
      stats: { ...def.stats, ...(parsed.stats || {}) },
      bureaus: mergeBureaus(parsed.bureaus, def.bureaus),
      competitors: parsed.competitors || def.competitors,
      achievements: parsed.achievements || {},
    };
  } catch {
    return defaultState();
  }
}
function mergeBureaus(saved, defaults) {
  if (!Array.isArray(saved)) return defaults;
  return defaults.map(d => {
    const s = saved.find(x => x.id === d.id);
    return s ? { ...d, owned: !!s.owned } : d;
  });
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const fmtNum = n => Math.round(n).toLocaleString("en-US");
const fmtCash = n => "$" + Math.round(n).toLocaleString("en-US");
const uid = () => Math.random().toString(36).slice(2, 10);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const randInt = (lo, hi) => Math.floor(lo + Math.random() * (hi - lo + 1));
function initials(name) { return name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0,2).join("").toUpperCase() || "?"; }
function classifyScore(s) { return s >= 75 ? "good" : s >= 50 ? "warn" : "bad"; }
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c])); }
function slantLabel(v) {
  if (v < 20) return "Hard news";
  if (v < 40) return "Serious";
  if (v < 60) return "Balanced";
  if (v < 80) return "Punchy";
  return "Tabloid";
}
function angleSlantToString(v) {
  if (v < 33) return "serious";
  if (v < 66) return "balanced";
  return "tabloid";
}
function gradeToNumber(g) {
  const m = { "A+":98,"A":92,"A-":88,"B+":82,"B":78,"B-":72,"C+":68,"C":62,"C-":58,"D":48,"F":35 };
  return m[g] ?? 60;
}

/* ---------- theme ---------- */
function applyTheme() {
  const c = state.newsroom.themeColor || "#cc0000";
  document.documentElement.style.setProperty("--accent", c);
  document.documentElement.style.setProperty("--accent-dark", shade(c, -20));
  const dense = state.newsroom.density;
  if (typeof dense === "number") {
    const pad = 14 + Math.round(dense / 100 * 16); // 14–30
    document.documentElement.style.setProperty("--pad", pad + "px");
  }
}
function shade(hex, percent) {
  const m = hex.replace("#","").match(/.{1,2}/g);
  if (!m) return hex;
  const [r,g,b] = m.map(h => parseInt(h, 16));
  const adjust = v => Math.max(0, Math.min(255, Math.round(v + (percent/100)*255)));
  return "#" + [r,g,b].map(v => adjust(v).toString(16).padStart(2,"0")).join("");
}

/* ---------- toasts ---------- */
function toast({ title, text, kind = "info", timeout = 4000 }) {
  const host = $("#toasts");
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.innerHTML = `<div class="toast-title">${escapeHtml(title)}</div><div class="toast-text">${escapeHtml(text)}</div>`;
  host.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity 0.4s"; setTimeout(() => el.remove(), 400); }, timeout);
}

/* ---------- onboarding ---------- */
function showOnboardingIfNeeded() {
  if (state.onboarded) { $("#onboarding").classList.add("hidden"); $("#app").classList.remove("hidden"); return; }
  $("#onboarding").classList.remove("hidden");
  $("#app").classList.add("hidden");

  // theme swatches
  $$("#onboarding .swatch").forEach(b => b.addEventListener("click", () => {
    const c = b.dataset.color;
    state.newsroom.themeColor = c;
    $$("#onboarding .swatch").forEach(x => x.classList.toggle("selected", x === b));
    applyTheme();
  }));

  const slant = $("#ob-slant"), readout = $("#ob-slant-readout");
  slant.addEventListener("input", () => readout.textContent = slantLabel(+slant.value));

  $("#ob-start").addEventListener("click", finishOnboarding);
}
function finishOnboarding() {
  state.player.name = $("#ob-player").value.trim() || "Alex Carter";
  state.newsroom.name = $("#ob-newsroom").value.trim() || "The Daily";
  state.newsroom.logo = $("#ob-logo").value.trim() || "📰";
  state.newsroom.motto = $("#ob-motto").value.trim() || "All the news that fits.";
  state.newsroom.city = $("#ob-city").value;
  state.newsroom.slant = +$("#ob-slant").value;
  state.onboarded = true;
  state.candidatePool = generateCandidates(3);
  // pre-pick HQ bureau
  const hq = state.bureaus.find(b => b.id === state.newsroom.city);
  if (hq) hq.owned = true;
  saveState();
  $("#onboarding").classList.add("hidden");
  $("#app").classList.remove("hidden");
  applyTheme();
  refreshAll();
  refreshCompetitorWire();
  toast({ title: "Welcome aboard", text: `${state.newsroom.name} is live. Hit Write to publish your first story.`, kind: "success" });
}

/* ---------- navigation ---------- */
function setupNav() {
  $$(".nav-btn").forEach(btn => btn.addEventListener("click", () => {
    const v = btn.dataset.view;
    $$(".nav-btn").forEach(b => b.classList.toggle("active", b === btn));
    $$(".view").forEach(s => s.classList.toggle("active", s.dataset.view === v));
    if (v === "public") renderPublicSite();
    if (v === "competitors") renderCompetitors();
    if (v === "bureaus") renderBureaus();
    if (v === "achievements") renderAchievements();
  }));
}

/* ---------- masthead ---------- */
function renderBrand() {
  $("#brand-logo").textContent = state.newsroom.logo;
  $("#brand-name").textContent = state.newsroom.name.toUpperCase();
  $("#brand-motto").textContent = state.newsroom.motto;
  $("#public-logo").textContent = state.newsroom.logo;
  $("#public-title").textContent = state.newsroom.name.toUpperCase();
  $("#public-motto").textContent = state.newsroom.motto;
  const slug = state.newsroom.name.toLowerCase().replace(/[^a-z0-9]+/g, "");
  $("#public-url").textContent = `https://${slug || "yournewsroom"}.example/`;
}

function setStat(name, value, formatted) {
  const el = document.querySelector(`[data-stat="${name}"]`);
  if (!el) return;
  const prev = el.dataset.prev || "";
  const next = formatted ?? String(value);
  if (prev !== next) {
    el.textContent = next;
    el.dataset.prev = next;
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
  }
}

function renderStats() {
  setStat("articles", state.articles.length, fmtNum(state.articles.length));
  setStat("views", state.stats.totalViews, fmtNum(state.stats.totalViews));
  setStat("rep", state.stats.reputation, fmtNum(state.stats.reputation));
  setStat("cash", state.stats.cash, fmtCash(state.stats.cash));
  setStat("reporters", state.reporters.length, fmtNum(state.reporters.length));
  setStat("share", state.stats.marketShare, state.stats.marketShare.toFixed(1) + "%");

  const badge = $("#approvals-badge");
  if (state.pendingApprovals.length > 0) { badge.textContent = state.pendingApprovals.length; badge.classList.remove("hidden"); }
  else badge.classList.add("hidden");

  const unlocked = Object.keys(state.achievements).length;
  const aBadge = $("#ach-badge");
  aBadge.textContent = `${unlocked}/${ACHIEVEMENTS.length}`;
  aBadge.classList.remove("hidden");
}

/* ---------- dashboard ---------- */
function renderDashboard() {
  const recent = state.articles.slice().reverse().slice(0, 8);
  const host = $("#dash-recent");
  if (recent.length === 0) host.innerHTML = `<div class="public-empty">No articles yet. Hit <strong>Write</strong> to publish your first piece.</div>`;
  else {
    host.innerHTML = recent.map(a => `
      <div class="article-row" data-id="${a.id}">
        <div class="grade">${a.review.overall_grade}</div>
        <div class="meta-block">
          <p class="row-title">${escapeHtml(a.title)}</p>
          <p class="row-meta">${escapeHtml(a.category)} · ${escapeHtml(a.author)} · ${fmtNum(a.review.estimated_views)} views · ${a.review.tone || ""}</p>
        </div>
      </div>`).join("");
    $$("#dash-recent .article-row").forEach(r => r.addEventListener("click", () => openArticleModal(r.dataset.id)));
  }

  const wire = $("#dash-competitors");
  if (state.competitorHeadlines.length === 0) wire.innerHTML = `<div class="public-empty">Wire loading…</div>`;
  else {
    wire.innerHTML = state.competitorHeadlines.map(h => `
      <div class="wire-item">
        <div class="wire-outlet">${escapeHtml(h.outlet)}</div>
        <div class="wire-headline">${escapeHtml(h.headline)}</div>
        ${h.blurb ? `<div class="wire-blurb">${escapeHtml(h.blurb)}</div>` : ""}
      </div>`).join("");
  }
  if (state.competitorHeadlines.length) {
    $("#ticker").textContent = state.competitorHeadlines.map(h => `${h.outlet}: ${h.headline}`).join("   •   ");
  }

  // pulse
  const grades = state.articles.slice(-10).map(a => gradeToNumber(a.review.overall_grade));
  const avg = grades.length ? Math.round(grades.reduce((a,b)=>a+b,0)/grades.length) : 0;
  const ownedBureaus = state.bureaus.filter(b => b.owned).length;
  const beats = Array.from(new Set(state.bureaus.filter(b => b.owned).flatMap(b => b.unlocks)));
  $("#pulse-panel").innerHTML = `
    <div class="pulse-item"><div class="pulse-label">Avg grade (last 10)</div><div class="pulse-value">${avg || "—"}</div></div>
    <div class="pulse-item"><div class="pulse-label">Bureaus</div><div class="pulse-value">${ownedBureaus}/${state.bureaus.length}</div></div>
    <div class="pulse-item"><div class="pulse-label">Beats unlocked</div><div class="pulse-value" style="font-size:13px;font-family:inherit;line-height:1.4;">${beats.join(", ")}</div></div>
    <div class="pulse-item"><div class="pulse-label">Editorial slant</div><div class="pulse-value" style="font-size:16px;font-family:inherit;">${slantLabel(state.newsroom.slant)}</div></div>
  `;

  // market share
  const rows = [{ name: state.newsroom.name, share: state.stats.marketShare, you: true }, ...state.competitors.map(c => ({ name: c.name, share: c.share, you: false }))]
    .sort((a,b) => b.share - a.share);
  $("#market-share").innerHTML = rows.map(r => `
    <div class="share-row">
      <span class="share-name">${escapeHtml(r.name)}</span>
      <span class="share-bar"><span class="share-fill ${r.you ? "you" : ""}" style="width:${Math.min(100, r.share)}%"></span></span>
      <span class="share-pct">${r.share.toFixed(1)}%</span>
    </div>`).join("");
}

/* ---------- writer ---------- */
function setupWriter() {
  const body = $("#writer-body"), count = $("#writer-wordcount");
  body.addEventListener("input", () => {
    const w = body.value.trim().split(/\s+/).filter(Boolean).length;
    count.textContent = `${w} word${w === 1 ? "" : "s"}`;
  });
  $("#writer-publish").addEventListener("click", onPublish);
  // populate category options based on owned beats
}

function refreshCategoryDropdown() {
  const sel = $("#writer-category");
  const cats = Array.from(new Set(state.bureaus.filter(b => b.owned).flatMap(b => b.unlocks)));
  if (!cats.length) cats.push("Local");
  sel.innerHTML = cats.map(c => `<option>${c}</option>`).join("");
}

async function onPublish() {
  const title = $("#writer-title").value.trim();
  const bodyText = $("#writer-body").value.trim();
  const category = $("#writer-category").value;
  const angle = +$("#writer-angle").value;
  if (!title || !bodyText) { alert("Both a headline and article body are required."); return; }
  const btn = $("#writer-publish");
  btn.disabled = true;
  const result = $("#writer-result");
  result.classList.remove("hidden");
  result.innerHTML = `<div><span class="spinner"></span> Submitting to editorial AI for review…</div>`;
  try {
    const review = await fetchReview({ title, body: bodyText, author: state.player.name, slant: angleSlantToString(angle) });
    const article = saveArticle({ title, body: bodyText, author: state.player.name, category, review });
    result.innerHTML = renderReviewPanel(article);
    animateBars(result);
    streamComments(result);
    $("#writer-title").value = "";
    $("#writer-body").value = "";
    $("#writer-wordcount").textContent = "0 words";
    toast({ title: "Published", text: `${title.slice(0, 40)}${title.length>40?"…":""} — Grade ${review.overall_grade}`, kind: "success" });
  } catch (e) {
    result.innerHTML = `<div style="color: var(--accent)">Review failed: ${escapeHtml(e.message)}</div>`;
  } finally {
    btn.disabled = false;
  }
}

async function fetchReview({ title, body, author, slant }) {
  const resp = await fetch("/api/review", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body, author, newsroom: state.newsroom.name, slant: slant || angleSlantToString(state.newsroom.slant) }),
  });
  if (!resp.ok) throw new Error("Server error");
  return resp.json();
}

function saveArticle({ title, body, author, category, review }) {
  const article = { id: uid(), title, body, author, category, review, publishedAt: Date.now() };
  state.articles.push(article);
  state.stats.totalViews += review.estimated_views || 0;
  const repDelta = Math.round((gradeToNumber(review.overall_grade) - 60) / 6);
  state.stats.reputation = Math.max(0, Math.min(100, state.stats.reputation + repDelta));
  state.stats.cash += Math.round((review.estimated_views || 0) * 0.02);
  // market share shifts a little based on how the article performed vs competitors
  const performance = (gradeToNumber(review.overall_grade) - 60) / 100;
  state.stats.marketShare = Math.max(0.5, Math.min(60, state.stats.marketShare + performance * 1.5));
  state.competitors.forEach(c => {
    c.share = Math.max(0.5, c.share - performance * (c.share / 100) * 0.6);
  });
  saveState();
  renderStats();
  renderDashboard();
  checkAchievements();
  return article;
}

function renderReviewPanel(article) {
  const r = article.review;
  const bar = (label, score) => `<div class="rating-row">
    <div class="rating-label"><span>${label}</span><span>${score}</span></div>
    <div class="bar"><div class="bar-fill ${classifyScore(score)}" data-target="${score}" style="width:0%"></div></div>
  </div>`;
  const comments = (r.comments || []).map((c,i) => `
    <div class="comment" style="animation-delay:${i*120}ms"><span class="comment-author">${escapeHtml(c.author)}</span><span class="comment-text">${escapeHtml(c.text)}</span></div>
  `).join("");
  const extras = [
    r.viral_factor != null ? `Viral ${r.viral_factor}` : null,
    r.controversy != null ? `Controversy ${r.controversy}` : null,
  ].filter(Boolean).join(" · ");
  return `
    <div class="review-grade">
      <div class="big-grade">${r.overall_grade}</div>
      <div class="grade-meta">
        <div><strong>${fmtNum(r.estimated_views)}</strong> views projected</div>
        <div>Headline score: <strong>${r.headline_score}</strong> · Tone: <strong>${escapeHtml(r.tone || "—")}</strong></div>
        ${extras ? `<div>${extras}${r._simulated ? " · <em>simulated</em>" : ""}</div>` : (r._simulated ? "<div><em>simulated reviewer</em></div>" : "")}
      </div>
    </div>
    <div class="rating-bars">
      ${bar("Writing", r.ratings.writing_quality)}
      ${bar("Credibility", r.ratings.factual_credibility)}
      ${bar("Engagement", r.ratings.engagement)}
      ${bar("Sensationalism", r.ratings.sensationalism)}
      ${bar("Originality", r.ratings.originality)}
    </div>
    <div class="critic-block">${escapeHtml(r.critique || "")}</div>
    <div class="comments-block"><h3 class="comments-h">Reader comments</h3>${comments}</div>
  `;
}

function animateBars(scope) {
  requestAnimationFrame(() => {
    $$(".bar-fill[data-target]", scope).forEach(b => {
      b.style.width = (+b.dataset.target) + "%";
    });
  });
}
function streamComments(scope) {
  // CSS handles the delays, nothing else needed
}

/* ---------- reporters / hiring ---------- */
function generateCandidates(n) {
  return Array.from({ length: n }, () => {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const skill = randInt(20, 95);
    const salary = 200 + Math.round(skill * 12);
    return { id: uid(), name, skill, salary, beat: pick(BEATS) };
  });
}
function renderReporters() {
  const staffHost = $("#staff-list");
  if (state.reporters.length === 0) staffHost.innerHTML = `<div class="public-empty">You're a one-person operation. Hire reporters to expand coverage.</div>`;
  else {
    staffHost.innerHTML = state.reporters.map(r => `
      <div class="staff-row" data-id="${r.id}">
        <div class="avatar">${initials(r.name)}</div>
        <div class="staff-meta">
          <div class="staff-name">${escapeHtml(r.name)}</div>
          <div class="staff-sub">
            <span class="skill-pill">Skill ${r.skill}</span>
            <span class="skill-pill">${escapeHtml(r.beat)}</span>
            <span class="skill-pill">${fmtCash(r.salary)}/article</span>
          </div>
        </div>
        <div class="staff-actions">
          <button class="primary-btn assign-btn" data-id="${r.id}">Assign</button>
          <button class="reject-btn fire-btn" data-id="${r.id}">Fire</button>
        </div>
      </div>`).join("");
    $$(".assign-btn").forEach(b => b.addEventListener("click", () => assignStory(b.dataset.id)));
    $$(".fire-btn").forEach(b => b.addEventListener("click", () => fireReporter(b.dataset.id)));
  }
  const hireHost = $("#hire-pool");
  if (state.candidatePool.length === 0) state.candidatePool = generateCandidates(3);
  hireHost.innerHTML = state.candidatePool.map(c => `
    <div class="hire-row" data-id="${c.id}">
      <div class="avatar">${initials(c.name)}</div>
      <div class="staff-meta">
        <div class="staff-name">${escapeHtml(c.name)}</div>
        <div class="staff-sub">
          <span class="skill-pill">Skill ${c.skill}</span>
          <span class="skill-pill">${escapeHtml(c.beat)}</span>
          <span class="skill-pill">${fmtCash(c.salary)}/article</span>
        </div>
      </div>
      <div class="staff-actions">
        <button class="primary-btn hire-btn" data-id="${c.id}">Hire (${fmtCash(c.salary * 5)})</button>
      </div>
    </div>`).join("");
  $$(".hire-btn").forEach(b => b.addEventListener("click", () => hireReporter(b.dataset.id)));
}
function hireReporter(id) {
  const c = state.candidatePool.find(x => x.id === id);
  if (!c) return;
  const signOn = c.salary * 5;
  if (state.stats.cash < signOn) { toast({title:"Not enough cash", text: `You need ${fmtCash(signOn)} to sign ${c.name}.`, kind:"warn"}); return; }
  state.stats.cash -= signOn;
  state.reporters.push(c);
  state.candidatePool = state.candidatePool.filter(x => x.id !== id);
  if (state.candidatePool.length < 2) state.candidatePool.push(...generateCandidates(2));
  saveState(); renderStats(); renderReporters();
  toast({ title: "Hired", text: `${c.name} joins the ${c.beat} beat.`, kind: "success" });
  checkAchievements();
}
function fireReporter(id) {
  const r = state.reporters.find(x => x.id === id);
  if (!r || !confirm(`Fire ${r.name}?`)) return;
  state.reporters = state.reporters.filter(x => x.id !== id);
  saveState(); renderStats(); renderReporters();
  toast({ title: "Let go", text: `${r.name} cleared their desk.`, kind: "warn" });
}
async function assignStory(id, opts = {}) {
  const r = state.reporters.find(x => x.id === id);
  if (!r) return;
  if (state.stats.cash < r.salary) { toast({title:"Not enough cash", text:`Assignment costs ${fmtCash(r.salary)}.`, kind:"warn"}); return; }
  const beat = opts.tip ? opts.beat || r.beat : (prompt(`Assign ${r.name} a topic (or blank for ${r.beat}):`, "") || r.beat);
  state.stats.cash -= r.salary;
  const draftingId = uid();
  state.pendingApprovals.push({ id: draftingId, status: "drafting", reporterId: r.id, reporterName: r.name, beat, tip: opts.tip });
  saveState(); renderApprovals(); renderStats();
  try {
    const resp = await fetch("/api/reporter-article", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reporterName: r.name, beat, newsroom: state.newsroom.name, skill: r.skill, tip: opts.tip || null }),
    });
    const draft = await resp.json();
    const idx = state.pendingApprovals.findIndex(p => p.id === draftingId);
    if (idx !== -1) {
      state.pendingApprovals[idx] = {
        id: draftingId, status: "ready", reporterId: r.id, reporterName: r.name,
        title: draft.title, body: draft.body, category: draft.category || "Local",
      };
      saveState(); renderApprovals(); renderStats();
      toast({ title: "Draft filed", text: `${r.name}: ${draft.title.slice(0, 50)}…` });
    }
  } catch (e) { toast({ title: "Filing failed", text: e.message, kind: "warn" }); }
}

/* ---------- approvals ---------- */
function renderApprovals() {
  const host = $("#approvals-list");
  if (state.pendingApprovals.length === 0) { host.innerHTML = `<div class="public-empty">No stories awaiting approval. Assign your reporters to file something.</div>`; return; }
  host.innerHTML = state.pendingApprovals.map(p => {
    if (p.status === "drafting") return `<div class="approval-card">
      <h3>${escapeHtml(p.reporterName)} is drafting a story on <em>${escapeHtml(p.beat)}</em>…</h3>
      <div class="approval-byline"><span class="spinner"></span> Working</div></div>`;
    return `<div class="approval-card" data-id="${p.id}">
      <h3>${escapeHtml(p.title)}</h3>
      <div class="approval-byline">By ${escapeHtml(p.reporterName)} · ${escapeHtml(p.category)}</div>
      <div class="approval-body">${escapeHtml(p.body)}</div>
      <div class="approval-actions">
        <button class="primary-btn approve-btn" data-id="${p.id}">Approve &amp; Publish</button>
        <button class="reject-btn reject-pending" data-id="${p.id}">Spike</button>
      </div></div>`;
  }).join("");
  $$(".approve-btn").forEach(b => b.addEventListener("click", () => approvePending(b.dataset.id)));
  $$(".reject-pending").forEach(b => b.addEventListener("click", () => rejectPending(b.dataset.id)));
}
async function approvePending(id) {
  const p = state.pendingApprovals.find(x => x.id === id);
  if (!p || p.status !== "ready") return;
  const btn = document.querySelector(`.approve-btn[data-id="${id}"]`);
  if (btn) { btn.disabled = true; btn.textContent = "Reviewing…"; }
  try {
    const review = await fetchReview({ title: p.title, body: p.body, author: p.reporterName });
    saveArticle({ title: p.title, body: p.body, author: p.reporterName, category: p.category, review });
    state.pendingApprovals = state.pendingApprovals.filter(x => x.id !== id);
    saveState(); renderApprovals();
    toast({ title: "Published", text: `Grade ${review.overall_grade} · ${fmtNum(review.estimated_views)} views`, kind: "success" });
  } catch (e) {
    toast({ title: "Review failed", text: e.message, kind: "warn" });
    if (btn) { btn.disabled = false; btn.textContent = "Approve & Publish"; }
  }
}
function rejectPending(id) {
  state.pendingApprovals = state.pendingApprovals.filter(x => x.id !== id);
  saveState(); renderApprovals(); renderStats();
  toast({ title: "Spiked", text: "Story killed before press." });
}

/* ---------- bureaus ---------- */
function renderBureaus() {
  $("#bureau-cards").innerHTML = state.bureaus.map(b => `
    <div class="bureau-card ${b.owned ? "owned" : ""}">
      <div class="bureau-flag">${b.flag}</div>
      <h3 class="bureau-name">${escapeHtml(b.name)}</h3>
      <p class="bureau-desc">${escapeHtml(b.desc)}</p>
      <div class="bureau-tags">${b.unlocks.map(u => `<span class="skill-pill">${escapeHtml(u)}</span>`).join("")}</div>
      <div class="bureau-cost">${b.owned ? "Owned" : fmtCash(b.cost)}</div>
      <div class="bureau-actions">
        ${b.owned ? `<button class="ghost-btn" disabled>Operational</button>` : `<button class="primary-btn buy-bureau" data-id="${b.id}">Open Bureau</button>`}
      </div>
    </div>`).join("");
  $$(".buy-bureau").forEach(btn => btn.addEventListener("click", () => buyBureau(btn.dataset.id)));
}
function buyBureau(id) {
  const b = state.bureaus.find(x => x.id === id);
  if (!b || b.owned) return;
  if (state.stats.cash < b.cost) { toast({title:"Not enough cash", text:`Bureau costs ${fmtCash(b.cost)}.`, kind:"warn"}); return; }
  state.stats.cash -= b.cost;
  b.owned = true;
  state.stats.marketShare = Math.min(60, state.stats.marketShare + 2);
  saveState(); renderStats(); renderBureaus(); renderDashboard();
  refreshCategoryDropdown();
  toast({ title: `${b.name} open`, text: `Unlocked beats: ${b.unlocks.join(", ")}.`, kind: "success" });
  checkAchievements();
}

/* ---------- public site ---------- */
function renderPublicSite() {
  const host = $("#public-articles");
  if (state.articles.length === 0) { host.innerHTML = `<div class="public-empty" style="grid-column: 1 / -1;">No published stories yet. Your front page is empty.</div>`; return; }
  const sorted = state.articles.slice().reverse();
  const lead = sorted[0], rest = sorted.slice(1, 6);
  host.innerHTML = `
    <div class="public-lead" data-id="${lead.id}">
      <div class="public-category">${escapeHtml(lead.category)}</div>
      <h2>${escapeHtml(lead.title)}</h2>
      <p class="excerpt">${escapeHtml(excerptOf(lead.body))}</p>
      <div class="byline">By ${escapeHtml(lead.author)} · ${fmtNum(lead.review.estimated_views)} views</div>
    </div>
    <div class="public-side"><div class="public-side-list">
      ${rest.map(a => `<div data-id="${a.id}">
        <div class="public-category">${escapeHtml(a.category)}</div>
        <h3>${escapeHtml(a.title)}</h3>
        <div class="byline">By ${escapeHtml(a.author)} · ${fmtNum(a.review.estimated_views)} views</div>
      </div>`).join("")}
    </div></div>`;
  $$("#public-articles [data-id]").forEach(el => el.addEventListener("click", () => openArticleModal(el.dataset.id)));
}
function excerptOf(s) { return s.replace(/\s+/g, " ").slice(0, 220) + (s.length > 220 ? "…" : ""); }

/* ---------- competitors ---------- */
function renderCompetitors() {
  $("#competitor-cards").innerHTML = state.competitors.map(c => {
    const h = state.competitorHeadlines.find(x => x.outlet === c.name);
    return `<div class="comp-card">
      <h3 class="comp-name">${c.logo} ${escapeHtml(c.name)}</h3>
      <div class="comp-bio">${escapeHtml(c.bio)}</div>
      <p class="comp-headline">${escapeHtml(h ? h.headline : "—")}</p>
      ${h && h.blurb ? `<div class="comp-blurb">${escapeHtml(h.blurb)}</div>` : ""}
      <div class="comp-cat">${escapeHtml(h ? h.category : "")}</div>
      <div class="comp-meta">
        <span>Market share: <strong>${c.share.toFixed(1)}%</strong></span>
        <span>Style: ${c.personality}</span>
      </div>
    </div>`;
  }).join("");
}
async function refreshCompetitorWire() {
  try {
    const resp = await fetch("/api/competitor-headlines", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competitors: state.competitors.map(c => c.name) }),
    });
    const data = await resp.json();
    state.competitorHeadlines = data.headlines || [];
    saveState();
    renderDashboard(); renderCompetitors();
  } catch (e) { console.warn("competitor wire failed", e); }
}

/* ---------- achievements ---------- */
function renderAchievements() {
  const host = $("#achievements-grid");
  host.innerHTML = ACHIEVEMENTS.map(a => {
    const got = !!state.achievements[a.id];
    return `<div class="ach-card ${got ? "unlocked" : ""}">
      <div class="ach-icon">${a.icon}</div>
      <div class="ach-title">${a.title}</div>
      <div class="ach-desc">${escapeHtml(a.desc)}</div>
      <div class="comp-meta" style="margin-top:8px">${got ? "✓ Unlocked" : "Locked"}</div>
    </div>`;
  }).join("");
}
function checkAchievements() {
  let unlockedAny = false;
  ACHIEVEMENTS.forEach(a => {
    if (!state.achievements[a.id] && a.test(state)) {
      state.achievements[a.id] = Date.now();
      unlockedAny = true;
      toast({ title: `🏆 ${a.title}`, text: a.desc, kind: "success", timeout: 5500 });
    }
  });
  if (unlockedAny) { saveState(); renderStats(); }
}

/* ---------- breaking news ---------- */
async function pollBreakingNews() {
  try {
    const resp = await fetch("/api/breaking-news", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: state.newsroom.city }),
    });
    const ev = await resp.json();
    if (!ev || !ev.headline) return;
    state.breaking = { ...ev, id: uid() };
    saveState();
    renderBreakingBanner();
  } catch (e) { /* ignore */ }
}
function renderBreakingBanner() {
  const banner = $("#breaking-banner"), txt = $("#breaking-text");
  if (!state.breaking) { banner.classList.add("hidden"); return; }
  txt.textContent = state.breaking.headline;
  banner.classList.remove("hidden");
}
function setupBreakingHandlers() {
  $("#breaking-dismiss").addEventListener("click", () => { state.breaking = null; saveState(); renderBreakingBanner(); });
  $("#breaking-claim").addEventListener("click", () => {
    if (!state.breaking) return;
    // Send to writer or assign to first available reporter
    const tip = state.breaking.summary;
    if (state.reporters.length) {
      const r = state.reporters[0];
      assignStory(r.id, { tip, beat: state.breaking.category });
      $$(".nav-btn[data-view='approvals']")[0]?.click();
    } else {
      // pre-fill writer
      $("#writer-title").value = state.breaking.headline;
      $("#writer-body").value = state.breaking.summary + "\n\n";
      $$(".nav-btn[data-view='write']")[0]?.click();
    }
    state.breaking = null;
    saveState();
    renderBreakingBanner();
  });
}

/* ---------- modal ---------- */
function openArticleModal(id) {
  const a = state.articles.find(x => x.id === id);
  if (!a) return;
  $("#modal-body").innerHTML = `<div class="modal-body">
    <div class="byline">${escapeHtml(a.category)} · By ${escapeHtml(a.author)}</div>
    <h1>${escapeHtml(a.title)}</h1>
    <div class="article-text">${escapeHtml(a.body)}</div>
    <div class="views-line">${fmtNum(a.review.estimated_views)} views · Grade ${a.review.overall_grade} · Headline ${a.review.headline_score}</div>
    ${renderReviewPanel(a)}
  </div>`;
  $("#modal").classList.remove("hidden");
  animateBars($("#modal-body"));
}
function setupModal() {
  $$("#modal [data-close]").forEach(el => el.addEventListener("click", () => $("#modal").classList.add("hidden")));
}

/* ---------- settings drawer ---------- */
function openSettings() {
  $("#set-name").value = state.newsroom.name;
  $("#set-motto").value = state.newsroom.motto;
  $("#set-logo").value = state.newsroom.logo;
  $("#set-slant").value = state.newsroom.slant;
  $("#set-slant-readout").textContent = slantLabel(state.newsroom.slant);
  $("#set-density").value = state.newsroom.density;
  $("#set-custom-color").value = state.newsroom.themeColor;
  $$("#settings-drawer .swatch").forEach(s => s.classList.toggle("selected", s.dataset.color === state.newsroom.themeColor));
  $("#settings-drawer").classList.remove("hidden");
}
function setupSettings() {
  $("#open-settings").addEventListener("click", openSettings);
  $$("#settings-drawer [data-close-drawer]").forEach(el => el.addEventListener("click", () => $("#settings-drawer").classList.add("hidden")));
  $$("#settings-drawer .swatch").forEach(b => b.addEventListener("click", () => {
    const c = b.dataset.color;
    state.newsroom.themeColor = c;
    $$("#settings-drawer .swatch").forEach(x => x.classList.toggle("selected", x === b));
    $("#set-custom-color").value = c;
    applyTheme();
  }));
  $("#set-custom-color").addEventListener("input", e => { state.newsroom.themeColor = e.target.value; applyTheme(); });
  $("#set-slant").addEventListener("input", e => {
    state.newsroom.slant = +e.target.value;
    $("#set-slant-readout").textContent = slantLabel(state.newsroom.slant);
  });
  $("#set-density").addEventListener("input", e => { state.newsroom.density = +e.target.value; applyTheme(); });
  $("#set-save").addEventListener("click", () => {
    state.newsroom.name = $("#set-name").value.trim() || state.newsroom.name;
    state.newsroom.motto = $("#set-motto").value.trim() || state.newsroom.motto;
    state.newsroom.logo = $("#set-logo").value.trim() || state.newsroom.logo;
    saveState(); renderBrand();
    $("#settings-drawer").classList.add("hidden");
    toast({ title: "Saved", text: "Newsroom settings updated.", kind: "success" });
  });
  $("#set-reset").addEventListener("click", () => {
    if (!confirm("Reset everything? This wipes your save.")) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
}

/* ---------- AI status ---------- */
async function loadAiStatus() {
  try {
    const r = await fetch("/api/health"); const j = await r.json();
    $("#ai-status").textContent = `AI: ${j.aiProvider || "—"}`;
  } catch { $("#ai-status").textContent = "AI: offline"; }
}

/* ---------- refresh ---------- */
function refreshAll() {
  applyTheme();
  refreshCategoryDropdown();
  renderBrand();
  renderStats();
  renderDashboard();
  renderReporters();
  renderApprovals();
  renderBureaus();
  renderCompetitors();
  renderAchievements();
  renderBreakingBanner();
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  showOnboardingIfNeeded();
  setupNav();
  setupWriter();
  setupModal();
  setupSettings();
  setupBreakingHandlers();
  loadAiStatus();
  if (state.onboarded) { refreshAll(); refreshCompetitorWire(); }
  $("#refresh-pool").addEventListener("click", () => {
    state.candidatePool = generateCandidates(3);
    saveState(); renderReporters();
  });
  // periodic refreshes
  setInterval(refreshCompetitorWire, 3 * 60 * 1000);
  // breaking news every 90s, first one after 25s
  setTimeout(pollBreakingNews, 25000);
  setInterval(pollBreakingNews, 90 * 1000);
});
