"use strict";

const STORAGE_KEY = "newsroom-sim-state-v3";

/* ==================================================================== */
/*                          LOGO LIBRARY (SVG)                          */
/* ==================================================================== */

const LOGOS = {
  star:     { name: "Star",     svg: '<svg viewBox="0 0 64 64"><polygon points="32,4 39,24 60,24 43,37 49,58 32,46 15,58 21,37 4,24 25,24" fill="var(--accent)"/></svg>' },
  globe:    { name: "Globe",    svg: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--accent)" stroke-width="4"/><ellipse cx="32" cy="32" rx="12" ry="26" fill="none" stroke="var(--accent)" stroke-width="3"/><line x1="6" y1="32" x2="58" y2="32" stroke="var(--accent)" stroke-width="3"/></svg>' },
  tower:    { name: "Tower",    svg: '<svg viewBox="0 0 64 64"><rect x="28" y="14" width="8" height="44" fill="var(--accent)"/><polygon points="32,4 38,14 26,14" fill="var(--accent)"/><circle cx="32" cy="22" r="3" fill="#fff"/></svg>' },
  eagle:    { name: "Eagle",    svg: '<svg viewBox="0 0 64 64"><path d="M32 6 L20 24 L4 28 L18 30 L14 46 L26 38 L32 56 L38 38 L50 46 L46 30 L60 28 L44 24 Z" fill="var(--accent)"/></svg>' },
  eye:      { name: "Eye",      svg: '<svg viewBox="0 0 64 64"><ellipse cx="32" cy="32" rx="28" ry="16" fill="none" stroke="var(--accent)" stroke-width="4"/><circle cx="32" cy="32" r="10" fill="var(--accent)"/><circle cx="32" cy="32" r="4" fill="#fff"/></svg>' },
  crown:    { name: "Crown",    svg: '<svg viewBox="0 0 64 64"><path d="M8 48 L12 20 L24 36 L32 12 L40 36 L52 20 L56 48 Z" fill="var(--accent)"/><rect x="8" y="48" width="48" height="6" fill="var(--accent)"/></svg>' },
  shield:   { name: "Shield",   svg: '<svg viewBox="0 0 64 64"><path d="M32 4 L58 12 L56 36 Q48 56 32 60 Q16 56 8 36 L6 12 Z" fill="var(--accent)"/><path d="M32 18 L32 46 M20 32 L44 32" stroke="#fff" stroke-width="4"/></svg>' },
  bolt:     { name: "Bolt",     svg: '<svg viewBox="0 0 64 64"><polygon points="36,4 14,36 28,36 22,60 50,24 36,24" fill="var(--accent)"/></svg>' },
  diamond:  { name: "Diamond",  svg: '<svg viewBox="0 0 64 64"><polygon points="32,4 60,32 32,60 4,32" fill="var(--accent)"/><polygon points="32,16 48,32 32,48 16,32" fill="#fff"/></svg>' },
  quill:    { name: "Quill",    svg: '<svg viewBox="0 0 64 64"><path d="M52 6 Q14 30 6 58 Q34 50 58 12 Z" fill="var(--accent)"/><line x1="6" y1="58" x2="24" y2="40" stroke="#fff" stroke-width="3"/></svg>' },
  flame:    { name: "Flame",    svg: '<svg viewBox="0 0 64 64"><path d="M32 4 Q14 24 18 40 Q20 56 32 60 Q44 56 46 40 Q50 24 32 4 Z" fill="var(--accent)"/><path d="M32 22 Q24 32 26 42 Q28 52 32 54 Q36 52 38 42 Q40 32 32 22 Z" fill="#ffaa00"/></svg>' },
  obelisk:  { name: "Obelisk",  svg: '<svg viewBox="0 0 64 64"><polygon points="32,4 26,56 38,56" fill="var(--accent)"/><rect x="20" y="56" width="24" height="4" fill="var(--accent)"/></svg>' },
};

const TV_LOGOS = {
  satellite: { name: "Satellite", svg: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="6" fill="var(--accent)"/><path d="M32 32 L52 12 M52 12 L56 16 M52 12 L48 8" stroke="var(--accent)" stroke-width="4" fill="none"/><ellipse cx="20" cy="44" rx="14" ry="6" fill="none" stroke="var(--accent)" stroke-width="3" transform="rotate(-30 20 44)"/></svg>' },
  signal:    { name: "Signal",    svg: '<svg viewBox="0 0 64 64"><path d="M32 50 Q14 38 14 22" stroke="var(--accent)" stroke-width="4" fill="none"/><path d="M32 50 Q50 38 50 22" stroke="var(--accent)" stroke-width="4" fill="none"/><path d="M32 50 Q22 42 22 32" stroke="var(--accent)" stroke-width="4" fill="none"/><path d="M32 50 Q42 42 42 32" stroke="var(--accent)" stroke-width="4" fill="none"/><circle cx="32" cy="50" r="5" fill="var(--accent)"/></svg>' },
  bigplay:   { name: "Big Play",  svg: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="var(--accent)"/><polygon points="24,18 24,46 48,32" fill="#fff"/></svg>' },
  static_:   { name: "Channel",   svg: '<svg viewBox="0 0 64 64"><rect x="6" y="14" width="52" height="36" rx="4" fill="var(--accent)"/><rect x="14" y="22" width="36" height="20" fill="#fff"/><rect x="24" y="50" width="16" height="6" fill="var(--accent)"/></svg>' },
};

/* ==================================================================== */
/*                          STATIC GAME DATA                            */
/* ==================================================================== */

const IDENTITIES = [
  { id: "broadsheet",    name: "Broadsheet",    desc: "Serious, sourced, slow. Critics respect you; tabloids mock you." },
  { id: "tabloid",       name: "Tabloid",       desc: "Loud, fast, sensational. Massive views, low credibility ceiling." },
  { id: "investigative", name: "Investigative", desc: "Deep, dangerous, irregular. High reputation, slow cash." },
  { id: "wire",          name: "Wire Service",  desc: "Fast, factual, terse. Reliable income, modest views." },
];

const BRAND_COLORS = ["#cc0000","#1a4fd1","#0a8a3a","#7d2eb9","#d96b00","#111111","#0e7c92","#a8276a"];

const CITIES = [
  { id: "metroville",  name: "Metroville",   x: 480, y: 290, flag: "🏙️", desc: "Generalist hub.",                unlocks: ["Local","Culture"],        cost: 0 },
  { id: "new-haven",   name: "New Haven",    x: 720, y: 230, flag: "🏛️", desc: "Capital. Politics-heavy.",       unlocks: ["Politics","World"],       cost: 8000 },
  { id: "silicon-bay", name: "Silicon Bay",  x: 160, y: 360, flag: "💻", desc: "Tech hub.",                       unlocks: ["Tech","Business"],        cost: 12000 },
  { id: "gotham-east", name: "Gotham East",  x: 820, y: 310, flag: "🚨", desc: "Crime beat.",                     unlocks: ["Crime"],                  cost: 10000 },
  { id: "port-royal",  name: "Port Royal",   x: 580, y: 460, flag: "⚓", desc: "Trade & finance.",                unlocks: ["Business"],               cost: 14000 },
  { id: "sunset-isle", name: "Sunset Isle",  x: 200, y: 200, flag: "🎬", desc: "Entertainment industry.",         unlocks: ["Culture"],                cost: 9000 },
  { id: "kilimanjaro", name: "Kilimanjaro",  x: 900, y: 480, flag: "🌍", desc: "Foreign correspondence.",         unlocks: ["World","Climate"],        cost: 18000 },
  { id: "olympia",     name: "Olympia",      x: 360, y: 470, flag: "🏟️", desc: "Sports central.",                 unlocks: ["Sports"],                 cost: 7000 },
  { id: "ironworks",   name: "Ironworks",    x: 320, y: 130, flag: "🏭", desc: "Industrial Midwest.",             unlocks: ["Business","Local"],       cost: 8500 },
  { id: "saint-rose",  name: "Saint-Rose",   x: 100, y: 540, flag: "🌴", desc: "Tropical port.",                  unlocks: ["Climate","World"],        cost: 11000 },
  { id: "northforge",  name: "North Forge",  x: 540, y: 80,  flag: "🏔️", desc: "Mountain frontier.",              unlocks: ["Climate","Local"],        cost: 9500 },
  { id: "delta-city",  name: "Delta City",   x: 700, y: 500, flag: "🛶", desc: "River delta. Health & climate.",  unlocks: ["Health","Climate"],       cost: 10500 },
  { id: "vega-prime",  name: "Vega Prime",   x: 860, y: 130, flag: "🛰️", desc: "Aerospace & defense.",            unlocks: ["Tech","World"],           cost: 16000 },
  { id: "hollow-park", name: "Hollow Park",  x: 240, y: 290, flag: "🎓", desc: "University town.",                unlocks: ["Health","Culture"],       cost: 6500 },
];

const FIRST_NAMES = ["Alex","Riley","Jordan","Sam","Casey","Morgan","Taylor","Jamie","Drew","Avery","Cameron","Reese","Quinn","Devon","Harper","Skyler","Logan","Rowan","Sasha","Emerson","Marisol","Diego","Priya","Yusuf","Wen","Kai","Noor","Tomás","Ines","Aki","Beatrice","Cyrus","Olive","Hank","Greta","Mateo","Imani","Otto","Linnea","Rafael"];
const LAST_NAMES = ["Carter","Brooks","Vega","Patel","Nguyen","Cohen","Okafor","Rivera","Hughes","Martin","Sato","Khan","Andersen","Romano","Bauer","Park","Velasquez","Singh","Müller","Marsh","Holloway","Ortiz","Petrov","Hayashi","Bennett","Diallo","Goss","Whitcomb","Sandoval","Toledo"];
const BEATS = ["City Hall","Tech","Business","Crime","Sports","Culture","World","Investigations","Climate","Health","Politics","Education","Arts","Finance"];

const COMPETITORS_BASE = [
  { id: "ledger",  name: "The Daily Ledger",  logo: "🗞️", bio: "Establishment broadsheet.",         personality: "serious",       baseShare: 22 },
  { id: "wire",    name: "Metro Wire",        logo: "📡", bio: "Wire service. Fast and factual.",   personality: "newswire",      baseShare: 18 },
  { id: "post",    name: "Capital Post",      logo: "🏛️", bio: "DC-style political insider.",       personality: "politicojuicy", baseShare: 16 },
  { id: "tribune", name: "Tribune North",     logo: "🧭", bio: "Regional paper of record.",         personality: "broadsheet",    baseShare: 14 },
  { id: "tabloid", name: "The Tabloid Times", logo: "🔥", bio: "Pure sensationalism.",              personality: "tabloid",       baseShare: 20 },
];

/* Sponsor tiers — unlocked by reputation. Each pays a fixed daily rate.
   Sponsors will pull out if your reputation drops below their min. */
const SPONSORS = [
  { id: "indie",    name: "Civic Roast Coffee",  tier: "Local",     color: "#7a4a2a", minRep: 0,  daily: 60,  loseAt: -1 },
  { id: "mid1",     name: "NorthBay Insurance",  tier: "Regional",  color: "#1a4fd1", minRep: 40, daily: 180, loseAt: 30 },
  { id: "mid2",     name: "Halcyon Auto Group",  tier: "Regional",  color: "#222",    minRep: 50, daily: 240, loseAt: 38 },
  { id: "premium1", name: "Meridian Bank",       tier: "Premium",   color: "#0a8a3a", minRep: 65, daily: 480, loseAt: 55 },
  { id: "premium2", name: "Larkspur Pharma",     tier: "Premium",   color: "#d96b00", minRep: 70, daily: 600, loseAt: 60 },
  { id: "platinum", name: "Vega Aerospace",      tier: "Platinum",  color: "#7d2eb9", minRep: 85, daily: 1200, loseAt: 75 },
];

const ACHIEVEMENTS = [
  { id: "first_article", title: "First Byline",   icon: "✍️", desc: "Publish your first article.",          test: s => s.articles.length >= 1 },
  { id: "ten_articles",  title: "Cub Reporter",   icon: "📝", desc: "Publish 10 articles.",                  test: s => s.articles.length >= 10 },
  { id: "hundred",       title: "Beat Veteran",   icon: "📚", desc: "Publish 100 articles.",                 test: s => s.articles.length >= 100 },
  { id: "viral",         title: "Going Viral",    icon: "🚀", desc: "Have an article go viral.",              test: s => s.articles.some(a => a.viral) },
  { id: "pulitzer",      title: "Pulitzer Pulse", icon: "🏆", desc: "Earn an A+ on any article.",             test: s => s.articles.some(a => a.review.overall_grade === "A+") },
  { id: "millionaire",   title: "Press Mogul",    icon: "💰", desc: "Reach $50,000 in cash.",                 test: s => s.stats.cash >= 50000 },
  { id: "staffed",       title: "Staffed Up",     icon: "👥", desc: "Hire 5 reporters.",                       test: s => s.reporters.length >= 5 },
  { id: "global",        title: "Going Global",   icon: "🌍", desc: "Own 4 or more bureaus.",                 test: s => s.cities.filter(c => c.owned).length >= 4 },
  { id: "high_rep",      title: "Trusted Source", icon: "📰", desc: "Reach 85 reputation.",                    test: s => s.stats.reputation >= 85 },
  { id: "market_leader", title: "Market Leader",  icon: "👑", desc: "Reach 30% market share.",                test: s => s.stats.marketShare >= 30 },
  { id: "tv_launch",     title: "On The Air",     icon: "📺", desc: "Found a TV station.",                    test: s => !!s.tv.founded },
  { id: "tv_hit",        title: "Primetime Hit",  icon: "🌟", desc: "Have a TV show hit 80+ ratings.",        test: s => s.tv.shows.some(sh => sh.rating >= 80) },
  { id: "survivor",      title: "Survivor",       icon: "♻️", desc: "Survive bankruptcy by selling.",         test: s => !!s.owner },
];

/* ==================================================================== */
/*                              STATE                                   */
/* ==================================================================== */

let state = loadState();
let gameLoopHandle = null;

function defaultState() {
  return {
    version: 3,
    onboarded: false,
    newsroom: {
      name: "The Daily",
      motto: "All the news that fits.",
      logoId: "star",
      accent: "#cc0000",
      identity: "broadsheet",
      hqCityId: "metroville",
      founded: Date.now(),
    },
    player: { name: "You" },
    stats: { cash: 5000, reputation: 50, totalViews: 0, marketShare: 5, subscribers: 0 },
    settings: { density: 50, speed: 2 },
    time: { day: 1, hour: 9, minute: 0 },
    reporters: [],
    pendingApprovals: [],
    pendingPitches: [],
    articles: [],
    candidatePool: [],
    cities: CITIES.map(c => ({ ...c, owned: false })),
    competitors: COMPETITORS_BASE.map(c => ({ ...c, share: c.baseShare, latest: null })),
    competitorHeadlines: [],
    breaking: null,
    achievements: {},
    tv: { founded: false, name: "", logoId: "satellite", accent: "#cc0000", shows: [] },
    owner: null,
    bankrupt: false,
    // Revenue ledger - what happened today
    revToday: { ads: 0, subs: 0, sponsors: 0, tv: 0, day: 1 },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (parsed.version !== 3) return defaultState();
    const def = defaultState();
    return {
      ...def, ...parsed,
      newsroom: { ...def.newsroom, ...(parsed.newsroom || {}) },
      stats: { ...def.stats, ...(parsed.stats || {}) },
      settings: { ...def.settings, ...(parsed.settings || {}) },
      time: { ...def.time, ...(parsed.time || {}) },
      tv: { ...def.tv, ...(parsed.tv || {}) },
      cities: mergeCities(parsed.cities, def.cities),
      competitors: parsed.competitors || def.competitors,
      achievements: parsed.achievements || {},
    };
  } catch { return defaultState(); }
}
function mergeCities(saved, defs) {
  if (!Array.isArray(saved)) return defs;
  return defs.map(d => { const s = saved.find(x => x.id === d.id); return s ? { ...d, owned: !!s.owned } : d; });
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

/* ==================================================================== */
/*                              HELPERS                                 */
/* ==================================================================== */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const fmtNum = n => Math.round(n).toLocaleString("en-US");
const fmtCash = n => "$" + Math.round(n).toLocaleString("en-US");
const uid = () => Math.random().toString(36).slice(2, 10);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const randInt = (lo, hi) => Math.floor(lo + Math.random() * (hi - lo + 1));
const initials = name => name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0,2).join("").toUpperCase() || "?";
const classifyScore = s => s >= 75 ? "good" : s >= 50 ? "warn" : "bad";
const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
const gradeToNumber = g => ({ "A+":98,"A":92,"A-":88,"B+":82,"B":78,"B-":72,"C+":68,"C":62,"C-":58,"D":48,"F":35 })[g] ?? 60;

function shade(hex, percent) {
  const m = hex.replace("#","").match(/.{1,2}/g);
  if (!m) return hex;
  const [r,g,b] = m.map(h => parseInt(h, 16));
  const adj = v => Math.max(0, Math.min(255, Math.round(v + (percent/100)*255)));
  return "#" + [r,g,b].map(v => adj(v).toString(16).padStart(2,"0")).join("");
}

function applyTheme() {
  document.documentElement.style.setProperty("--accent", state.newsroom.accent);
  document.documentElement.style.setProperty("--accent-dark", shade(state.newsroom.accent, -20));
  const pad = 14 + Math.round((state.settings.density ?? 50) / 100 * 16);
  document.documentElement.style.setProperty("--pad", pad + "px");
}

function logoSvg(id) { return (LOGOS[id] || LOGOS.star).svg; }
function tvLogoSvg(id) { return (TV_LOGOS[id] || TV_LOGOS.satellite).svg; }

/* ==================================================================== */
/*                              TOASTS                                  */
/* ==================================================================== */

function toast({ title, text, kind = "info", timeout = 4000 }) {
  const host = $("#toasts");
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.innerHTML = `<div class="toast-title">${escapeHtml(title)}</div><div class="toast-text">${escapeHtml(text)}</div>`;
  host.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity 0.4s"; setTimeout(() => el.remove(), 400); }, timeout);
}

/* ==================================================================== */
/*                            ONBOARDING                                */
/* ==================================================================== */

const obState = { step: 1, logoId: null, accent: null, identity: null, cityId: null };

function showOnboardingIfNeeded() {
  if (state.onboarded) { $("#onboarding").classList.add("hidden"); $("#app").classList.remove("hidden"); return; }
  $("#onboarding").classList.remove("hidden");
  $("#app").classList.add("hidden");
  renderLogoGrid();
  renderColorGrid();
  renderIdentityGrid();
  renderCityGrid();
  obStep(1);

  $("#ob-next").addEventListener("click", obNext);
  $("#ob-prev").addEventListener("click", obPrev);
}

function renderLogoGrid() {
  $("#ob-logos").innerHTML = Object.entries(LOGOS).map(([id, l]) => `
    <div class="logo-tile" data-id="${id}" title="${escapeHtml(l.name)}">${l.svg}</div>
  `).join("");
  $$("#ob-logos .logo-tile").forEach(t => t.addEventListener("click", () => {
    obState.logoId = t.dataset.id;
    $$("#ob-logos .logo-tile").forEach(x => x.classList.toggle("selected", x === t));
  }));
}
function renderColorGrid() {
  $("#ob-brand-colors").innerHTML = BRAND_COLORS.map(c => `<button class="swatch" data-c="${c}" style="background:${c}"></button>`).join("");
  $$("#ob-brand-colors .swatch").forEach(b => b.addEventListener("click", () => {
    obState.accent = b.dataset.c;
    state.newsroom.accent = b.dataset.c;
    applyTheme();
    $$("#ob-brand-colors .swatch").forEach(x => x.classList.toggle("selected", x === b));
  }));
}
function renderIdentityGrid() {
  $("#ob-identity").innerHTML = IDENTITIES.map(i => `
    <div class="identity-tile" data-id="${i.id}">
      <h4>${escapeHtml(i.name)}</h4>
      <p>${escapeHtml(i.desc)}</p>
    </div>`).join("");
  $$("#ob-identity .identity-tile").forEach(t => t.addEventListener("click", () => {
    obState.identity = t.dataset.id;
    $$("#ob-identity .identity-tile").forEach(x => x.classList.toggle("selected", x === t));
  }));
}
function renderCityGrid() {
  $("#ob-cities").innerHTML = CITIES.map(c => `
    <div class="city-tile" data-id="${c.id}">
      <span class="city-flag">${c.flag}</span>
      <div class="city-meta">
        <h4>${escapeHtml(c.name)}</h4>
        <p>${escapeHtml(c.desc)} Unlocks: ${c.unlocks.join(", ")}</p>
      </div>
    </div>`).join("");
  $$("#ob-cities .city-tile").forEach(t => t.addEventListener("click", () => {
    obState.cityId = t.dataset.id;
    $$("#ob-cities .city-tile").forEach(x => x.classList.toggle("selected", x === t));
  }));
}

function obStep(n) {
  obState.step = n;
  $$(".onboarding-step").forEach(s => s.classList.toggle("active", +s.dataset.step === n));
  $("#ob-step-readout").textContent = `Step ${n} of 4`;
  $("#ob-prev").disabled = n === 1;
  $("#ob-next").textContent = n === 4 ? "Open the doors" : "Next →";
}
function obNext() {
  if (obState.step === 1) {
    if (!$("#ob-player").value.trim() || !$("#ob-newsroom").value.trim()) { toast({title:"Required", text:"Fill in name and newsroom.", kind:"warn"}); return; }
    obStep(2);
  } else if (obState.step === 2) {
    if (!obState.logoId) { toast({title:"Pick a logo", text:"Choose one of the logos.", kind:"warn"}); return; }
    obStep(3);
  } else if (obState.step === 3) {
    if (!obState.accent || !obState.identity) { toast({title:"Pick color and identity", text:"Both required.", kind:"warn"}); return; }
    obStep(4);
  } else {
    if (!obState.cityId) { toast({title:"Pick a city", text:"Choose your HQ.", kind:"warn"}); return; }
    finishOnboarding();
  }
}
function obPrev() { if (obState.step > 1) obStep(obState.step - 1); }

function finishOnboarding() {
  state.player.name = $("#ob-player").value.trim();
  state.newsroom.name = $("#ob-newsroom").value.trim();
  state.newsroom.motto = $("#ob-motto").value.trim() || "All the news that fits.";
  state.newsroom.logoId = obState.logoId;
  state.newsroom.accent = obState.accent;
  state.newsroom.identity = obState.identity;
  state.newsroom.hqCityId = obState.cityId;
  const hq = state.cities.find(c => c.id === obState.cityId);
  if (hq) hq.owned = true;
  state.candidatePool = generateCandidates(3);
  state.onboarded = true;
  saveState();
  $("#onboarding").classList.add("hidden");
  $("#app").classList.remove("hidden");
  applyTheme();
  refreshAll();
  refreshCompetitorWire();
  startGameLoop();
  toast({ title: "Welcome aboard", text: `${state.newsroom.name} is live.`, kind: "success" });
}

/* ==================================================================== */
/*                            TIME ENGINE                               */
/* ==================================================================== */

// 1 real second × speed = 1 game minute
function startGameLoop() {
  if (gameLoopHandle) clearInterval(gameLoopHandle);
  gameLoopHandle = setInterval(tick, 1000);
}

function tick() {
  if (state.bankrupt) return;
  const speed = state.settings.speed || 2;
  for (let i = 0; i < speed; i++) advanceMinute();
  updateLiveArticles();
  renderClock();
  renderStats();
  // periodic things
  if (state.time.minute === 0) { // every game hour
    handleHourly();
  }
}

function advanceMinute() {
  state.time.minute += 1;
  if (state.time.minute >= 60) {
    state.time.minute = 0;
    state.time.hour += 1;
    if (state.time.hour >= 24) {
      state.time.hour = 0;
      state.time.day += 1;
      handleDaily();
    }
  }
}

function handleHourly() {
  state.competitors.forEach(c => {
    c.share = Math.max(0.5, c.share + (Math.random() - 0.5) * 0.3);
  });
  // Occasionally a reporter pitches you a story
  if (state.reporters.length > 0 && state.pendingPitches.length < 3 && Math.random() < 0.18) {
    rollReporterPitch();
  }
}

async function rollReporterPitch() {
  const r = pick(state.reporters);
  // optimistic placeholder
  const pitchId = uid();
  state.pendingPitches.push({ id: pitchId, status: "loading", reporterId: r.id, reporterName: r.name, beat: r.beat });
  saveState();
  try {
    const recent = state.articles.slice(-3).map(a => a.title);
    const resp = await fetch("/api/reporter-pitch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reporterName: r.name, beat: r.beat, recentHistory: recent }) });
    const data = await resp.json();
    const idx = state.pendingPitches.findIndex(p => p.id === pitchId);
    if (idx === -1) return;
    state.pendingPitches[idx] = { id: pitchId, status: "ready", reporterId: r.id, reporterName: r.name, beat: r.beat, pitch: data.pitch, angle: data.angle, category: data.category };
    saveState();
    showPitchModal(pitchId);
  } catch {
    state.pendingPitches = state.pendingPitches.filter(p => p.id !== pitchId);
    saveState();
  }
}

function showPitchModal(pitchId) {
  const p = state.pendingPitches.find(x => x.id === pitchId);
  if (!p || p.status !== "ready") return;
  $("#modal").dataset.articleId = "";
  $("#modal-body").innerHTML = `<div class="modal-body pitch-card">
    <div class="pitch-reporter">
      <div class="avatar">${initials(p.reporterName)}</div>
      <div class="pitch-reporter-meta">
        <strong>${escapeHtml(p.reporterName)}</strong>
        <span>${escapeHtml(p.beat)} · pitch</span>
      </div>
    </div>
    <div class="pitch-quote">"${escapeHtml(p.pitch)}"</div>
    <p style="color:var(--slate);font-size:13px"><strong>Angle:</strong> ${escapeHtml(p.angle)} · <strong>Category:</strong> ${escapeHtml(p.category)}</p>
    <div class="pitch-actions">
      <button class="primary-btn" id="pitch-accept">Greenlight — assign to ${escapeHtml(p.reporterName.split(/\s/)[0])}</button>
      <button class="reject-btn" id="pitch-pass">Pass</button>
    </div>
  </div>`;
  $("#modal").classList.remove("hidden");
  $("#pitch-accept").addEventListener("click", () => {
    state.pendingPitches = state.pendingPitches.filter(x => x.id !== pitchId);
    saveState();
    $("#modal").classList.add("hidden");
    assignStory(p.reporterId, { tip: p.angle, beat: p.category });
    $$(".nav-btn[data-view='approvals']")[0]?.click();
  });
  $("#pitch-pass").addEventListener("click", () => {
    state.pendingPitches = state.pendingPitches.filter(x => x.id !== pitchId);
    saveState();
    $("#modal").classList.add("hidden");
    toast({ title: "Pitch passed", text: `${p.reporterName} will keep digging.` });
  });
  toast({ title: `📞 ${p.reporterName} has a pitch`, text: p.angle, timeout: 5000 });
}

function handleDaily() {
  // Reset today's revenue ledger
  state.revToday = { ads: 0, subs: 0, sponsors: 0, tv: 0, day: state.time.day };

  // --- Subscriber revenue ($1.5/sub/day) ---
  const subRev = (state.stats.subscribers || 0) * 1.5;
  state.stats.cash += subRev;
  state.revToday.subs = subRev;

  // --- Sponsor revenue ---
  let sponsorRev = 0;
  for (const s of SPONSORS) {
    if (state.stats.reputation >= s.minRep) {
      sponsorRev += s.daily;
    }
  }
  state.stats.cash += sponsorRev;
  state.revToday.sponsors = sponsorRev;

  // --- Owner stipend ---
  if (state.owner) {
    state.stats.cash += state.owner.monthlyBudget;
    state.owner.satisfaction = Math.max(0, state.owner.satisfaction - 0.5);
    if (state.owner.satisfaction < 25) toast({ title: `${state.owner.name} is unhappy`, text: state.owner.demand, kind: "warn" });
    if (state.owner.satisfaction <= 0) {
      toast({ title: "Owner pulled out", text: `${state.owner.name} ended the partnership.`, kind: "warn", timeout: 6000 });
      state.owner = null;
    }
  }

  // --- TV station revenue ---
  if (state.tv.founded && state.tv.shows.length) {
    let rev = 0, totalViewers = 0;
    state.tv.shows.forEach(sh => {
      const viewers = Math.round(sh.rating * 4000 + randInt(-5000, 5000));
      totalViewers += Math.max(0, viewers);
      rev += Math.max(0, viewers) * 0.03;
      sh.rating = Math.max(5, Math.min(99, sh.rating + (Math.random() - 0.5) * 4));
    });
    state.stats.cash += rev;
    state.revToday.tv = rev;
    if (rev > 0) toast({ title: "TV ratings day", text: `${fmtNum(totalViewers)} viewers · ${fmtCash(rev)} earned`, kind: "success" });
  }

  // Daily digest toast
  const totalRev = subRev + sponsorRev + state.revToday.tv;
  if (state.time.day > 1 && totalRev > 0) {
    toast({ title: `Day ${state.time.day} payout`, text: `${fmtCash(totalRev)} from subs, sponsors, TV.`, kind: "success" });
  }

  // Subscriber churn if reputation tanks
  if (state.stats.reputation < 40 && state.stats.subscribers > 0) {
    const churn = Math.floor(state.stats.subscribers * 0.05);
    state.stats.subscribers = Math.max(0, state.stats.subscribers - churn);
    if (churn > 0) toast({ title: "Subscriber churn", text: `${fmtNum(churn)} cancellations.`, kind: "warn" });
  }

  // Refresh candidate pool occasionally
  if (Math.random() < 0.3) state.candidatePool = generateCandidates(3);

  // Refresh competitor wire
  refreshCompetitorWire();
  saveState();
  if (state.stats.cash <= 0) triggerBankruptcy();
}

function renderClock() {
  const t = state.time;
  $("#game-clock").textContent = `Day ${t.day} · ${String(t.hour).padStart(2,"0")}:${String(t.minute).padStart(2,"0")}`;
}

/* ==================================================================== */
/*                       ARTICLE LIVE GROWTH                            */
/* ==================================================================== */

function updateLiveArticles() {
  let changed = false;
  for (const a of state.articles) {
    if (!a.live) continue;
    const ageMinutes = (Date.now() - a.publishedAt) / 60000;
    const halflife = a.viral ? 20 : Math.max(8, 30 - a.review.viral_factor / 4);
    const target = a.review.estimated_views;
    const newViews = Math.round(target * (1 - Math.exp(-ageMinutes / halflife)));
    if (newViews > a.currentViews) {
      const delta = newViews - a.currentViews;
      a.currentViews = newViews;
      state.stats.totalViews += delta;
      // Ad revenue: $0.0025 per view, accumulates immediately
      const adIncome = delta * 0.0025;
      state.stats.cash += adIncome;
      state.revToday.ads = (state.revToday.ads || 0) + adIncome;
      changed = true;
      if (Math.random() < 0.06 && a.comments.length < 30) fetchMoreComments(a);
      if (!a.viral && a.review.viral_factor > 70 && Math.random() < 0.08) goViral(a);
    }
    if (a.currentViews >= target * 0.95 && ageMinutes > 30) {
      a.live = false; changed = true;
    }
  }
  if (changed) { saveState(); renderDashboard(); }
}

function goViral(a) {
  a.viral = true;
  a.review.estimated_views = Math.round(a.review.estimated_views * (3 + Math.random() * 5));
  a.review.viral_factor = 99;
  const bonus = Math.round(a.review.estimated_views * 0.04);
  state.stats.cash += bonus;
  state.stats.reputation = Math.min(100, state.stats.reputation + 3);
  saveState();
  toast({ title: "🚀 GOING VIRAL", text: `"${a.title.slice(0,40)}" exploded. +${fmtCash(bonus)}`, kind: "viral", timeout: 6500 });
  // burst of comments
  fetchMoreComments(a, 5);
  fetchMoreComments(a, 5);
}

async function fetchMoreComments(article, count = 2) {
  try {
    // Pass recent article titles so the AI can occasionally reference prior coverage
    const history = state.articles.slice(-5, -1).map(a => a.title);
    const resp = await fetch("/api/comments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: article.title, body: article.body, author: article.author, count, history }),
    });
    const data = await resp.json();
    if (data.comments && data.comments.length) {
      article.comments.push(...data.comments);
      saveState();
      if ($("#modal").classList.contains("hidden") === false && $("#modal").dataset.articleId === article.id) {
        openArticleModal(article.id);
      }
    }
  } catch { /* ignore */ }
}

/* ==================================================================== */
/*                              BRAND                                   */
/* ==================================================================== */

function renderBrand() {
  $("#brand-logo").innerHTML = logoSvg(state.newsroom.logoId);
  $("#brand-name").textContent = state.newsroom.name.toUpperCase();
  $("#brand-motto").textContent = state.newsroom.motto;
  const identity = IDENTITIES.find(i => i.id === state.newsroom.identity);
  $("#brand-identity").textContent = identity ? identity.name : "";
  $("#public-logo").innerHTML = logoSvg(state.newsroom.logoId);
  $("#public-title").textContent = state.newsroom.name.toUpperCase();
  $("#public-motto").textContent = state.newsroom.motto;
  const slug = state.newsroom.name.toLowerCase().replace(/[^a-z0-9]+/g, "");
  $("#public-url").textContent = `https://${slug || "yournewsroom"}.example/`;
}

function setStat(name, formatted, danger) {
  const el = document.querySelector(`[data-stat="${name}"]`);
  if (!el) return;
  const prev = el.dataset.prev || "";
  if (prev !== formatted) {
    el.textContent = formatted;
    el.dataset.prev = formatted;
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
  }
  el.classList.toggle("danger", !!danger);
}

function renderStats() {
  setStat("articles", fmtNum(state.articles.length));
  setStat("views", fmtNum(state.stats.totalViews));
  setStat("rep", fmtNum(state.stats.reputation));
  setStat("cash", fmtCash(state.stats.cash), state.stats.cash < 1000);
  setStat("reporters", fmtNum(state.reporters.length));
  setStat("subs", fmtNum(state.stats.subscribers || 0));
  setStat("share", state.stats.marketShare.toFixed(1) + "%");
  const ap = $("#approvals-badge");
  if (state.pendingApprovals.length > 0) { ap.textContent = state.pendingApprovals.length; ap.classList.remove("hidden"); }
  else ap.classList.add("hidden");
  const unlocked = Object.keys(state.achievements).length;
  const aBadge = $("#ach-badge");
  aBadge.textContent = `${unlocked}/${ACHIEVEMENTS.length}`;
  aBadge.classList.remove("hidden");
}

/* ==================================================================== */
/*                          NAV / DASHBOARD                             */
/* ==================================================================== */

function setupNav() {
  $$(".nav-btn").forEach(btn => btn.addEventListener("click", () => {
    const v = btn.dataset.view;
    $$(".nav-btn").forEach(b => b.classList.toggle("active", b === btn));
    $$(".view").forEach(s => s.classList.toggle("active", s.dataset.view === v));
    if (v === "public") renderPublicSite();
    if (v === "competitors") renderCompetitors();
    if (v === "map") renderMap();
    if (v === "studio") renderStudio();
    if (v === "owner") renderOwnerPanel();
    if (v === "achievements") renderAchievements();
  }));
}

function renderDashboard() {
  const recent = state.articles.slice().reverse().slice(0, 8);
  const host = $("#dash-recent");
  if (recent.length === 0) host.innerHTML = `<div class="public-empty">No articles yet. Hit <strong>Write</strong> to publish your first piece.</div>`;
  else {
    host.innerHTML = recent.map(a => `
      <div class="article-row" data-id="${a.id}">
        <div class="grade">${a.review.overall_grade}</div>
        <div class="meta-block">
          <p class="row-title">${escapeHtml(a.title)}${a.viral ? '<span class="viral-badge">VIRAL</span>' : ""}${a.live ? '<span class="live-badge">LIVE</span>' : ""}</p>
          <p class="row-meta">${escapeHtml(a.review.category || "Local")} · ${escapeHtml(a.author)} · ${fmtNum(a.currentViews)} views · ${a.comments.length} comments</p>
        </div>
      </div>`).join("");
    $$("#dash-recent .article-row").forEach(r => r.addEventListener("click", () => openArticleModal(r.dataset.id)));
  }

  const wire = $("#dash-competitors");
  if (state.competitorHeadlines.length === 0) wire.innerHTML = `<div class="public-empty">Wire loading…</div>`;
  else {
    wire.innerHTML = state.competitorHeadlines.map(h => `
      <div class="wire-item" data-outlet="${escapeHtml(h.outlet)}">
        <div class="wire-outlet">${escapeHtml(h.outlet)}</div>
        <div class="wire-headline">${escapeHtml(h.headline)}</div>
        ${h.blurb ? `<div class="wire-blurb">${escapeHtml(h.blurb)}</div>` : ""}
      </div>`).join("");
    $$("#dash-competitors .wire-item").forEach(w => w.addEventListener("click", () => openCompetitorArticle(w.dataset.outlet)));
  }
  if (state.competitorHeadlines.length) {
    $("#ticker").textContent = state.competitorHeadlines.map(h => `${h.outlet}: ${h.headline}`).join("   •   ");
  }

  // revenue panel
  renderRevenuePanel();
  renderSponsorsPanel();

  // pulse
  const grades = state.articles.slice(-10).map(a => gradeToNumber(a.review.overall_grade));
  const avg = grades.length ? Math.round(grades.reduce((a,b)=>a+b,0)/grades.length) : 0;
  const ownedCities = state.cities.filter(c => c.owned).length;
  const beats = Array.from(new Set(state.cities.filter(c => c.owned).flatMap(c => c.unlocks)));
  $("#pulse-panel").innerHTML = `
    <div class="pulse-item"><div class="pulse-label">Avg grade (last 10)</div><div class="pulse-value">${avg || "—"}</div></div>
    <div class="pulse-item"><div class="pulse-label">Bureaus</div><div class="pulse-value">${ownedCities}/${state.cities.length}</div></div>
    <div class="pulse-item"><div class="pulse-label">Beats unlocked</div><div class="pulse-value" style="font-size:13px;font-family:inherit;line-height:1.4;">${beats.join(", ")}</div></div>
    <div class="pulse-item"><div class="pulse-label">Live stories</div><div class="pulse-value">${state.articles.filter(a => a.live).length}</div></div>
  `;

  // market share (sums to 100% of competition+you)
  const allShares = [
    { name: state.newsroom.name, share: state.stats.marketShare, you: true },
    ...state.competitors.map(c => ({ name: c.name, share: c.share, you: false }))
  ];
  const total = allShares.reduce((sum, r) => sum + r.share, 0);
  const normalized = allShares.map(r => ({ ...r, pct: (r.share / total) * 100 })).sort((a,b) => b.pct - a.pct);
  $("#market-share").innerHTML = normalized.map(r => `
    <div class="share-row">
      <span class="share-name">${escapeHtml(r.name)}</span>
      <span class="share-bar"><span class="share-fill ${r.you ? "you" : ""}" style="width:${r.pct.toFixed(1)}%"></span></span>
      <span class="share-pct">${r.pct.toFixed(1)}%</span>
    </div>`).join("");
}

function renderRevenuePanel() {
  const host = $("#revenue-panel");
  if (!host) return;
  const rev = state.revToday || { ads: 0, subs: 0, sponsors: 0, tv: 0 };
  const subDaily = (state.stats.subscribers || 0) * 1.5;
  const activeSponsors = SPONSORS.filter(s => state.stats.reputation >= s.minRep);
  const sponsorDaily = activeSponsors.reduce((sum, s) => sum + s.daily, 0);
  const tvActive = state.tv.founded ? state.tv.shows.length : 0;
  const projectedDaily = subDaily + sponsorDaily;
  const total = rev.ads + rev.subs + rev.sponsors + rev.tv;
  host.innerHTML = `
    <div class="rev-row">
      <div class="rev-label"><strong>Ad revenue</strong>$0.0025 per view (continuous)</div>
      <div class="rev-amount">${fmtCash(rev.ads)}</div>
    </div>
    <div class="rev-row">
      <div class="rev-label"><strong>Subscribers</strong>${fmtNum(state.stats.subscribers || 0)} × $1.50/day</div>
      <div class="rev-amount">${fmtCash(rev.subs)} <span style="color:var(--slate);font-size:11px">/ ${fmtCash(subDaily)} per day</span></div>
    </div>
    <div class="rev-row">
      <div class="rev-label"><strong>Sponsors</strong>${activeSponsors.length} active sponsor${activeSponsors.length === 1 ? "" : "s"}</div>
      <div class="rev-amount">${fmtCash(rev.sponsors)} <span style="color:var(--slate);font-size:11px">/ ${fmtCash(sponsorDaily)} per day</span></div>
    </div>
    <div class="rev-row">
      <div class="rev-label"><strong>TV station</strong>${tvActive} show${tvActive === 1 ? "" : "s"} on the air</div>
      <div class="rev-amount">${fmtCash(rev.tv)}</div>
    </div>
    <div class="rev-total">
      <div class="rev-label">Earned today (Day ${state.time.day})</div>
      <div class="rev-amount">${fmtCash(total)}</div>
    </div>`;
}

function renderSponsorsPanel() {
  const host = $("#sponsors-panel");
  if (!host) return;
  host.innerHTML = SPONSORS.map(s => {
    const active = state.stats.reputation >= s.minRep;
    return `<div class="sponsor-row ${active ? "" : "sponsor-locked"}">
      <div class="sponsor-logo" style="background:${s.color}">${s.name[0]}</div>
      <div class="sponsor-meta">
        <div class="sponsor-name">${escapeHtml(s.name)}${active ? "" : " · locked"}</div>
        <div class="sponsor-tier">${s.tier} · ${active ? "active" : `needs rep ${s.minRep}`}</div>
      </div>
      <div class="sponsor-pay">${fmtCash(s.daily)}<span style="font-size:10px;color:var(--slate);display:block;text-align:right">per day</span></div>
    </div>`;
  }).join("");
}

/* ==================================================================== */
/*                               WRITER                                 */
/* ==================================================================== */

function setupWriter() {
  const body = $("#writer-body"), count = $("#writer-wordcount");
  body.addEventListener("input", () => {
    const w = body.value.trim().split(/\s+/).filter(Boolean).length;
    count.textContent = `${w} word${w === 1 ? "" : "s"}`;
  });
  $("#writer-publish").addEventListener("click", onPublish);
}

async function onPublish() {
  const title = $("#writer-title").value.trim();
  const body = $("#writer-body").value.trim();
  if (!title || !body) { toast({title:"Missing fields", text:"Headline and body required.", kind:"warn"}); return; }
  const btn = $("#writer-publish");
  btn.disabled = true;
  const result = $("#writer-result");
  result.classList.remove("hidden");
  result.innerHTML = `<div><span class="spinner"></span> Sending to wire…</div>`;

  // get instant baseline review
  let review;
  try {
    const r = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, body, author: state.player.name, newsroom: state.newsroom.name }) });
    review = await r.json();
  } catch (e) {
    toast({ title: "Review failed", text: e.message, kind: "warn" });
    btn.disabled = false;
    return;
  }

  const article = createArticle({ title, body, author: state.player.name, review });
  result.innerHTML = renderReviewPanel(article);
  animateBars(result);
  $("#writer-title").value = "";
  $("#writer-body").value = "";
  $("#writer-wordcount").textContent = "0 words";
  btn.disabled = false;
  toast({ title: "Published", text: `${title.slice(0, 40)} — Grade ${review.overall_grade}`, kind: "success" });

  // upgrade with AI in background
  upgradeArticleWithAI(article);
  // initial 3 comments
  fetchMoreComments(article, 3);
}

async function upgradeArticleWithAI(article) {
  try {
    const r = await fetch("/api/review-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: article.title, body: article.body, author: article.author }) });
    const ai = await r.json();
    if (ai && ai.ratings && ai.overall_grade) {
      // adjust article — blend AI and current
      const prevGrade = article.review.overall_grade;
      article.review = { ...article.review, ...ai };
      article.aiReviewed = true;
      // re-evaluate viral chance based on AI's viral_factor
      if (!article.viral && ai.viral_factor > 75 && Math.random() < 0.4) goViral(article);
      saveState();
      renderDashboard();
      if (prevGrade !== ai.overall_grade) {
        toast({ title: "AI critic weighed in", text: `Grade revised: ${prevGrade} → ${ai.overall_grade}` });
      }
    }
  } catch { /* ignore */ }
}

function createArticle({ title, body, author, review }) {
  const article = {
    id: uid(), title, body, author,
    category: review.category || "Local",
    review,
    publishedAt: Date.now(),
    currentViews: Math.round(review.estimated_views * 0.05), // start with 5% immediate
    comments: [],
    viral: false,
    live: true,
    aiReviewed: false,
  };
  state.articles.push(article);
  state.stats.totalViews += article.currentViews;
  // Immediate ad income on initial 5% views
  const initialAd = article.currentViews * 0.0025;
  state.stats.cash += initialAd;
  state.revToday.ads = (state.revToday.ads || 0) + initialAd;

  const gradeNum = gradeToNumber(review.overall_grade);
  const repDelta = Math.round((gradeNum - 60) / 6);
  state.stats.reputation = Math.max(0, Math.min(100, state.stats.reputation + repDelta));

  // Subscribers: gain if article is good, lose if it's terrible
  let subDelta = 0;
  if (gradeNum >= 65) {
    subDelta = Math.floor((gradeNum - 50) * 1.4 + (review.ratings?.factual_credibility || 50) / 8);
    if (article.viral) subDelta *= 3;
  } else if (gradeNum < 50) {
    subDelta = -Math.floor((50 - gradeNum) * 0.6);
  }
  if (subDelta !== 0) {
    state.stats.subscribers = Math.max(0, (state.stats.subscribers || 0) + subDelta);
    if (subDelta > 0) toast({ title: "+" + fmtNum(subDelta) + " subscribers", text: "Quality reporting earns readers.", kind: "success" });
    else toast({ title: fmtNum(subDelta) + " subscribers", text: "Some readers canceled over this piece.", kind: "warn" });
  }

  const performance = (gradeNum - 60) / 100;
  state.stats.marketShare = Math.max(0.5, Math.min(60, state.stats.marketShare + performance * 1.5));
  state.competitors.forEach(c => { c.share = Math.max(0.5, c.share - performance * (c.share / 100) * 0.6); });

  // owner satisfaction: depends on if it aligns with their demand (approximation — high credibility favors politicalish, sensational favors tabloid types)
  if (state.owner) {
    let delta = -1;
    const p = state.owner.personality;
    const sens = review.ratings?.sensationalism || 30;
    const cred = review.ratings?.factual_credibility || 50;
    if (p === "profit-driven") delta = (review.estimated_views > 50000) ? 4 : -2;
    else if (p === "ideological") delta = randInt(-3, 3);
    else if (p === "meddling") delta = (cred > 75 ? 3 : -2);
    else delta = 1; // hands-off
    state.owner.satisfaction = Math.max(0, Math.min(100, state.owner.satisfaction + delta));
  }

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
  const comments = (article.comments || []).map((c, i) => `
    <div class="comment" style="animation-delay:${Math.min(i*80, 1200)}ms">
      <div class="comment-body"><span class="comment-author">${escapeHtml(c.author)}</span><span class="comment-text">${escapeHtml(c.text)}</span></div>
    </div>`).join("") || `<div class="comment"><div class="comment-body" style="color:var(--slate);font-style:italic">Comments will stream in as views grow…</div></div>`;
  return `
    <div class="review-grade">
      <div class="big-grade">${r.overall_grade}</div>
      <div class="grade-meta">
        <div><strong>${fmtNum(article.currentViews)}</strong> views ${article.live ? '<span class="live-badge">LIVE</span>' : ""}</div>
        <div>Projected: <strong>${fmtNum(r.estimated_views)}</strong> · Category: <strong>${escapeHtml(r.category || "Local")}</strong></div>
        <div>Headline: <strong>${r.headline_score}</strong> · Tone: <strong>${escapeHtml(r.tone || "—")}</strong></div>
        ${article.viral ? `<div class="viral-counter">🚀 VIRAL</div>` : ""}
        ${r._simulated && !article.aiReviewed ? "<div><em>baseline review · AI critic pending</em></div>" : ""}
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
    <div class="comments-block">
      <h3 class="comments-h">Reader comments <span class="comments-count">${article.comments.length}</span></h3>
      ${comments}
    </div>`;
}

function animateBars(scope) {
  requestAnimationFrame(() => $$(".bar-fill[data-target]", scope).forEach(b => b.style.width = (+b.dataset.target) + "%"));
}

/* ==================================================================== */
/*                         REPORTERS / HIRING                           */
/* ==================================================================== */

function generateCandidates(n) {
  return Array.from({ length: n }, () => {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const skill = randInt(20, 95);
    return { id: uid(), name, skill, salary: 200 + Math.round(skill * 12), beat: pick(BEATS) };
  });
}

function renderReporters() {
  const staff = $("#staff-list");
  if (state.reporters.length === 0) staff.innerHTML = `<div class="public-empty">You're a one-person operation. Hire reporters to expand coverage.</div>`;
  else {
    staff.innerHTML = state.reporters.map(r => `
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
  const hire = $("#hire-pool");
  if (state.candidatePool.length === 0) state.candidatePool = generateCandidates(3);
  hire.innerHTML = state.candidatePool.map(c => `
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
  if (state.stats.cash < signOn) { toast({title:"Not enough cash", text: `Need ${fmtCash(signOn)} to hire.`, kind:"warn"}); return; }
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
  const beat = opts.tip ? (opts.beat || r.beat) : (prompt(`Topic for ${r.name} (blank = ${r.beat}):`, "") ?? r.beat) || r.beat;
  state.stats.cash -= r.salary;
  const draftingId = uid();
  state.pendingApprovals.push({ id: draftingId, status: "drafting", reporterId: r.id, reporterName: r.name, beat, tip: opts.tip });
  saveState(); renderApprovals(); renderStats();
  try {
    const resp = await fetch("/api/reporter-article", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reporterName: r.name, beat, newsroom: state.newsroom.name, skill: r.skill, tip: opts.tip || null }) });
    const draft = await resp.json();
    const idx = state.pendingApprovals.findIndex(p => p.id === draftingId);
    if (idx !== -1) {
      state.pendingApprovals[idx] = { id: draftingId, status: "ready", reporterId: r.id, reporterName: r.name, title: draft.title, body: draft.body, category: draft.category || "Local" };
      saveState(); renderApprovals(); renderStats();
      toast({ title: "Draft filed", text: `${r.name}: ${draft.title.slice(0, 50)}…` });
    }
  } catch (e) { toast({ title: "Filing failed", text: e.message, kind: "warn" }); }
}

function renderApprovals() {
  const host = $("#approvals-list");
  if (state.pendingApprovals.length === 0) { host.innerHTML = `<div class="public-empty">No stories awaiting approval.</div>`; return; }
  host.innerHTML = state.pendingApprovals.map(p => {
    if (p.status === "drafting") return `<div class="approval-card">
      <h3>${escapeHtml(p.reporterName)} is drafting on <em>${escapeHtml(p.beat)}</em>…</h3>
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
    const r = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: p.title, body: p.body, author: p.reporterName }) });
    const review = await r.json();
    const article = createArticle({ title: p.title, body: p.body, author: p.reporterName, review });
    state.pendingApprovals = state.pendingApprovals.filter(x => x.id !== id);
    saveState(); renderApprovals();
    upgradeArticleWithAI(article);
    fetchMoreComments(article, 3);
    toast({ title: "Published", text: `Grade ${review.overall_grade}`, kind: "success" });
  } catch (e) {
    toast({ title: "Review failed", text: e.message, kind: "warn" });
    if (btn) { btn.disabled = false; btn.textContent = "Approve & Publish"; }
  }
}
function rejectPending(id) {
  state.pendingApprovals = state.pendingApprovals.filter(x => x.id !== id);
  saveState(); renderApprovals(); renderStats();
  toast({ title: "Spiked", text: "Story killed." });
}

/* ==================================================================== */
/*                               MAP                                    */
/* ==================================================================== */

function renderMap() {
  const svg = $("#press-map");
  // Stylized land path
  const land = `<path class="map-land" d="M40 280 Q60 180 140 160 Q220 130 280 90 Q360 60 460 80 Q560 60 660 90 Q740 70 820 100 Q900 90 940 160 Q960 240 920 320 Q940 400 880 470 Q820 540 720 540 Q620 560 520 530 Q420 560 320 530 Q220 540 140 500 Q60 460 40 380 Z"/>`;
  const water = `<path class="map-water-detail" d="M70 320 Q120 340 200 330 M740 200 Q800 220 870 210 M520 510 Q580 530 640 515"/>`;
  const cities = state.cities.map(c => {
    const owned = c.owned;
    const isHQ = c.id === state.newsroom.hqCityId;
    const pinClass = isHQ ? "hq" : owned ? "owned" : "";
    return `<g class="map-city" data-id="${c.id}">
      <circle class="map-pin ${pinClass}" cx="${c.x}" cy="${c.y}" r="9"/>
      ${isHQ ? `<circle cx="${c.x}" cy="${c.y}" r="14" fill="none" stroke="var(--gold)" stroke-width="2" opacity="0.6"/>` : ""}
      <text class="map-city-label ${owned ? "owned" : ""}" x="${c.x}" y="${c.y - 14}">${escapeHtml(c.name)}</text>
    </g>`;
  }).join("");
  svg.innerHTML = land + water + cities;
  $$("#press-map .map-city").forEach(g => g.addEventListener("click", () => showCityInfo(g.dataset.id)));
  $("#map-info").classList.remove("active");
}
function showCityInfo(id) {
  const c = state.cities.find(x => x.id === id);
  if (!c) return;
  const info = $("#map-info");
  const isHQ = c.id === state.newsroom.hqCityId;
  info.innerHTML = `
    <h3>${c.flag} ${escapeHtml(c.name)} ${isHQ ? '<span class="skill-pill" style="background:gold">HQ</span>' : ""}</h3>
    <p>${escapeHtml(c.desc)} <strong>Unlocks:</strong> ${c.unlocks.join(", ")}</p>
    <div class="map-info-row">
      ${c.owned
        ? '<span class="skill-pill" style="background:var(--green);color:#fff">Operational</span>'
        : `<button class="primary-btn" id="buy-bureau-btn">Open bureau · ${fmtCash(c.cost)}</button>`
      }
      <button class="ghost-btn" id="close-map-info">Close</button>
    </div>`;
  info.classList.add("active");
  if (!c.owned) $("#buy-bureau-btn").addEventListener("click", () => buyBureau(id));
  $("#close-map-info").addEventListener("click", () => info.classList.remove("active"));
}
function buyBureau(id) {
  const c = state.cities.find(x => x.id === id);
  if (!c || c.owned) return;
  if (state.stats.cash < c.cost) { toast({title:"Not enough cash", text:`Need ${fmtCash(c.cost)}.`, kind:"warn"}); return; }
  state.stats.cash -= c.cost;
  c.owned = true;
  state.stats.marketShare = Math.min(60, state.stats.marketShare + 2);
  saveState(); renderStats(); renderMap(); renderDashboard();
  toast({ title: `${c.name} open`, text: `Unlocked: ${c.unlocks.join(", ")}.`, kind: "success" });
  checkAchievements();
}

/* ==================================================================== */
/*                            TV STUDIO                                 */
/* ==================================================================== */

function renderStudio() {
  const panel = $("#studio-panel");
  if (!state.tv.founded) {
    panel.innerHTML = `
      <div class="studio-onboarding">
        <h2 class="section-h">Found a TV station</h2>
        <p class="section-sub">$25,000 upfront. Unlocks TV shows, hosts, and broadcast revenue.</p>
        <h3 class="step-h">Station name</h3>
        <input id="tv-name" type="text" placeholder="e.g. ${state.newsroom.name} Broadcast" maxlength="40" />
        <h3 class="step-h">Channel logo</h3>
        <div id="tv-logos" class="logo-grid" style="grid-template-columns:repeat(4,1fr);"></div>
        <h3 class="step-h">Channel color</h3>
        <div id="tv-colors" class="swatch-row"></div>
        <div style="margin-top:20px"><button id="tv-found-btn" class="primary-btn">Found station (${fmtCash(25000)})</button></div>
      </div>`;
    const lg = $("#tv-logos");
    lg.innerHTML = Object.entries(TV_LOGOS).map(([id, l]) => `<div class="logo-tile" data-id="${id}">${l.svg}</div>`).join("");
    let chosenLogo = "satellite", chosenColor = state.newsroom.accent;
    $$("#tv-logos .logo-tile").forEach((t, i) => {
      if (i === 0) t.classList.add("selected");
      t.addEventListener("click", () => { chosenLogo = t.dataset.id; $$("#tv-logos .logo-tile").forEach(x => x.classList.toggle("selected", x === t)); });
    });
    $("#tv-colors").innerHTML = BRAND_COLORS.map((c, i) => `<button class="swatch ${i===0?"selected":""}" data-c="${c}" style="background:${c}"></button>`).join("");
    $$("#tv-colors .swatch").forEach(b => b.addEventListener("click", () => { chosenColor = b.dataset.c; $$("#tv-colors .swatch").forEach(x => x.classList.toggle("selected", x === b)); }));
    $("#tv-found-btn").addEventListener("click", () => {
      if (state.stats.cash < 25000) { toast({title:"Not enough cash", text:"$25,000 needed.", kind:"warn"}); return; }
      const name = $("#tv-name").value.trim() || `${state.newsroom.name} Broadcast`;
      state.stats.cash -= 25000;
      state.tv = { founded: true, name, logoId: chosenLogo, accent: chosenColor, shows: [] };
      saveState(); renderStats(); renderStudio();
      toast({ title: "On the air", text: `${name} is broadcasting.`, kind: "success" });
      checkAchievements();
    });
    return;
  }

  // Studio dashboard
  const totalRating = state.tv.shows.reduce((s, sh) => s + sh.rating, 0);
  const avgRating = state.tv.shows.length ? Math.round(totalRating / state.tv.shows.length) : 0;
  panel.innerHTML = `
    <div class="studio-hero">
      <div class="studio-logo-box">${tvLogoSvg(state.tv.logoId)}</div>
      <div>
        <h2>${escapeHtml(state.tv.name)}</h2>
        <p>Broadcasting daily. Add shows, hire hosts, watch the ratings come in.</p>
        <div class="studio-stats">
          <div class="stat"><span class="stat-num">${state.tv.shows.length}</span><span class="stat-label">Shows</span></div>
          <div class="stat"><span class="stat-num">${avgRating}</span><span class="stat-label">Avg rating</span></div>
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <h2 class="section-h">Programming</h2>
      <button id="add-show" class="primary-btn">+ New show ($3,500)</button>
    </div>
    <div id="shows-grid" class="shows-grid"></div>`;
  $("#add-show").addEventListener("click", showNewShowDialog);
  const grid = $("#shows-grid");
  if (state.tv.shows.length === 0) grid.innerHTML = `<div class="public-empty">No shows on the air. Click <strong>+ New show</strong> to launch.</div>`;
  else grid.innerHTML = state.tv.shows.map(sh => `
    <div class="show-card">
      <div class="show-slot">${escapeHtml(sh.slot)}</div>
      <div class="show-title">${escapeHtml(sh.title)}</div>
      <div class="show-host">Hosted by ${escapeHtml(sh.host)} · ${escapeHtml(sh.format)}</div>
      <div class="show-ratings">
        <div class="show-rating">${Math.round(sh.rating)}</div>
        <div class="show-trend trend-${sh.trend}">${sh.trend === "rising" ? "↗" : sh.trend === "falling" ? "↘" : "→"} ${sh.trend}</div>
      </div>
      <div class="comp-meta">
        <span>${escapeHtml(sh.verdict || "")}</span>
      </div>
      <div style="margin-top:10px;display:flex;gap:6px;">
        <button class="ghost-btn promote-show" data-id="${sh.id}">Promote ($1k)</button>
        <button class="reject-btn cancel-show" data-id="${sh.id}">Cancel</button>
      </div>
    </div>`).join("");
  $$(".promote-show").forEach(b => b.addEventListener("click", () => promoteShow(b.dataset.id)));
  $$(".cancel-show").forEach(b => b.addEventListener("click", () => cancelShow(b.dataset.id)));
}

function showNewShowDialog() {
  if (state.stats.cash < 3500) { toast({title:"Not enough cash", text:"$3,500 to launch a show.", kind:"warn"}); return; }
  const slots = ["Morning","Midday","Primetime","Late Night","Weekend"];
  const formats = ["News","Talk","Debate","Interview","Investigations"];
  const title = prompt("Show title?", `${pick(["The","On","Inside","Late"])} ${pick(["Hour","Edition","Report","Brief","Beat"])}`) || "Untitled";
  const slot = prompt(`Slot? (${slots.join("/")}):`, "Primetime") || "Primetime";
  const format = prompt(`Format? (${formats.join("/")}):`, "News") || "News";
  let host;
  if (state.reporters.length && confirm("Use one of your reporters as host? (OK = yes, Cancel = hire external talent)")) {
    host = pick(state.reporters).name;
  } else {
    host = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  }
  state.stats.cash -= 3500;
  const show = { id: uid(), title, slot, format, host, rating: randInt(35, 60), trend: pick(["rising","steady","falling"]), verdict: "" };
  state.tv.shows.push(show);
  saveState();
  renderStudio(); renderStats();
  toast({ title: "Show launched", text: `${title} (${slot}) starring ${host}.`, kind: "success" });
  // ask AI for verdict
  fetch("/api/show-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ showTitle: title, hostName: host, format, viewership: "new launch" }) })
    .then(r => r.json()).then(j => {
      if (j && typeof j.rating === "number") {
        show.rating = j.rating;
        show.verdict = j.verdict;
        show.trend = j.trend || "steady";
        saveState(); renderStudio(); checkAchievements();
      }
    }).catch(() => {});
}
function promoteShow(id) {
  if (state.stats.cash < 1000) { toast({title:"Not enough cash", text:"Promotion costs $1,000.", kind:"warn"}); return; }
  const sh = state.tv.shows.find(x => x.id === id);
  if (!sh) return;
  state.stats.cash -= 1000;
  sh.rating = Math.min(99, sh.rating + randInt(3, 9));
  sh.trend = "rising";
  saveState(); renderStats(); renderStudio();
  toast({ title: "Promotion run", text: `${sh.title} now at ${Math.round(sh.rating)} rating.`, kind: "success" });
  checkAchievements();
}
function cancelShow(id) {
  const sh = state.tv.shows.find(x => x.id === id);
  if (!sh || !confirm(`Cancel ${sh.title}?`)) return;
  state.tv.shows = state.tv.shows.filter(x => x.id !== id);
  saveState(); renderStudio();
  toast({ title: "Cancelled", text: `${sh.title} pulled from the schedule.`, kind: "warn" });
}

/* ==================================================================== */
/*                          PUBLIC SITE                                 */
/* ==================================================================== */

function renderPublicSite() {
  const host = $("#public-articles");
  if (state.articles.length === 0) {
    host.innerHTML = `<div class="public-empty" style="grid-column: 1 / -1;">No published stories yet.</div>
      <div class="site-banner-ad" style="grid-column:1/-1">Your ad space — publish to start earning.</div>`;
    return;
  }
  const sorted = state.articles.slice().reverse();
  const lead = sorted[0], rest = sorted.slice(1, 6);
  const activeSponsors = SPONSORS.filter(s => state.stats.reputation >= s.minRep);
  const sponsoredAd = activeSponsors.length ? pick(activeSponsors) : null;
  const adCopy = sponsoredAd
    ? `<div class="site-ad"><div class="site-ad-title">${escapeHtml(sponsoredAd.name)}</div><div class="site-ad-tag">${escapeHtml(sponsoredAd.tier)} sponsor of ${escapeHtml(state.newsroom.name)}</div></div>`
    : `<div class="site-banner-ad">Ad space available — raise reputation to unlock sponsors</div>`;
  const bannerCopy = sponsoredAd
    ? `<div class="site-banner-ad live">${escapeHtml(sponsoredAd.name.toUpperCase())} · ${escapeHtml(sponsoredAd.tier)}</div>`
    : `<div class="site-banner-ad">Available ad slot — 728×90</div>`;
  host.innerHTML = `
    <div class="public-lead" data-id="${lead.id}">
      ${bannerCopy}
      <div class="public-category">${escapeHtml(lead.review.category || "Local")}</div>
      <h2>${escapeHtml(lead.title)}${lead.viral ? '<span class="viral-badge">VIRAL</span>' : ""}</h2>
      <p class="excerpt">${escapeHtml(lead.body.replace(/\s+/g, " ").slice(0, 240))}…</p>
      <div class="byline">By ${escapeHtml(lead.author)} · ${fmtNum(lead.currentViews)} views</div>
    </div>
    <div class="public-side">
      ${adCopy}
      <div class="public-side-list">
        ${rest.map(a => `<div data-id="${a.id}">
          <div class="public-category">${escapeHtml(a.review.category || "Local")}</div>
          <h3>${escapeHtml(a.title)}</h3>
          <div class="byline">By ${escapeHtml(a.author)} · ${fmtNum(a.currentViews)} views</div>
        </div>`).join("")}
      </div>
    </div>`;
  $$("#public-articles [data-id]").forEach(el => el.addEventListener("click", () => openArticleModal(el.dataset.id)));
}

/* ==================================================================== */
/*                         COMPETITORS                                  */
/* ==================================================================== */

function renderCompetitors() {
  $("#competitor-cards").innerHTML = state.competitors.map(c => {
    const h = state.competitorHeadlines.find(x => x.outlet === c.name);
    return `<div class="comp-card" data-outlet="${escapeHtml(c.name)}">
      <h3 class="comp-name">${c.logo} ${escapeHtml(c.name)}</h3>
      <div class="comp-bio">${escapeHtml(c.bio)}</div>
      <p class="comp-headline">${escapeHtml(h ? h.headline : "—")}</p>
      ${h && h.blurb ? `<div class="comp-blurb">${escapeHtml(h.blurb)}</div>` : ""}
      <div class="comp-cat">${escapeHtml(h ? h.category : "")}</div>
      <div class="comp-meta">
        <span>Share: <strong>${c.share.toFixed(1)}%</strong></span>
        <span>${c.personality}</span>
        <span style="color:var(--accent)">Click to read →</span>
      </div>
    </div>`;
  }).join("");
  $$(".comp-card").forEach(c => c.addEventListener("click", () => openCompetitorArticle(c.dataset.outlet)));
}
async function refreshCompetitorWire() {
  try {
    const resp = await fetch("/api/competitor-headlines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ competitors: state.competitors.map(c => c.name) }) });
    const data = await resp.json();
    state.competitorHeadlines = data.headlines || [];
    saveState();
    renderDashboard(); renderCompetitors();
  } catch { /* ignore */ }
}
async function openCompetitorArticle(outletName) {
  const competitor = state.competitors.find(c => c.name === outletName);
  if (!competitor) return;
  $("#modal-body").innerHTML = `<div class="modal-body"><div class="byline">${escapeHtml(outletName)}</div><h1>Loading article…</h1><p><span class="spinner"></span> Fetching from the wire…</p></div>`;
  $("#modal").classList.remove("hidden");
  $("#modal").dataset.articleId = "";
  try {
    const r = await fetch("/api/competitor-article", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ outlet: outletName, personality: competitor.personality }) });
    const art = await r.json();
    competitor.latest = art;
    saveState();
    $("#modal-body").innerHTML = `<div class="modal-body">
      <div class="byline">${escapeHtml(outletName)} · ${escapeHtml(art.category || "")}</div>
      <h1>${escapeHtml(art.title)}</h1>
      <div class="article-text">${escapeHtml(art.body)}</div>
      <div class="views-line">Read on ${escapeHtml(outletName)}</div>
    </div>`;
  } catch (e) {
    $("#modal-body").innerHTML = `<div class="modal-body"><h1>Failed to load</h1><p>${escapeHtml(e.message)}</p></div>`;
  }
}

/* ==================================================================== */
/*                            OWNER                                     */
/* ==================================================================== */

function renderOwnerPanel() {
  const host = $("#owner-panel");
  if (!state.owner) {
    host.innerHTML = `<div class="owner-panel-empty">
      <h3>You are independent.</h3>
      <p>The newsroom is owned by you. No external pressure, no monthly stipend, but no safety net.</p>
      <p style="margin-top:14px;color:var(--slate);font-size:13px">Putting yourself up for sale voluntarily attracts better bidders than a distressed auction. If your cash hits zero, you'll be forced to auction the paper anyway.</p>
      <div style="margin-top:18px">
        <button id="voluntary-auction-btn" class="primary-btn">Put paper up for voluntary auction</button>
      </div>
    </div>`;
    $("#voluntary-auction-btn").addEventListener("click", () => {
      if (!confirm("Put yourself up for sale? You'll receive bids from investors with demands.")) return;
      openAuction(true);
    });
    return;
  }
  const o = state.owner;
  const satClass = o.satisfaction > 65 ? "high" : o.satisfaction > 35 ? "med" : "low";
  host.innerHTML = `<div class="owner-card">
    <h3 class="owner-name">${escapeHtml(o.name)}</h3>
    <div class="owner-type">${escapeHtml(o.type)} · ${escapeHtml(o.personality)}</div>
    <div class="owner-demand">"${escapeHtml(o.demand)}"</div>
    <div class="comp-meta">
      <span>Monthly stipend: <strong>${fmtCash(o.monthlyBudget)}</strong></span>
      <span>Bought you for: <strong>${fmtCash(o.bid)}</strong></span>
    </div>
    <div class="owner-satisfaction">
      <div class="rating-label"><span>Owner satisfaction</span><span>${Math.round(o.satisfaction)}/100</span></div>
      <div class="satisfaction-bar"><div class="satisfaction-fill ${satClass}" style="width:${o.satisfaction}%"></div></div>
      <p style="font-size:12px;color:var(--slate);margin-top:8px">Articles that align with their demand raise satisfaction. If it hits zero, they pull out — and so does the cash.</p>
    </div>
    <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
      <button id="buyback-btn" class="primary-btn">Buy back independence (${fmtCash(o.bid * 1.5)})</button>
      <button id="voluntary-auction-btn" class="ghost-btn">Re-auction</button>
    </div>
  </div>`;
  $("#buyback-btn").addEventListener("click", () => {
    const cost = o.bid * 1.5;
    if (state.stats.cash < cost) { toast({title:"Not enough cash", text:`Need ${fmtCash(cost)} to buy back.`, kind:"warn"}); return; }
    if (!confirm(`Pay ${fmtCash(cost)} to buy back independence?`)) return;
    state.stats.cash -= cost;
    state.owner = null;
    saveState(); renderStats(); renderOwnerPanel();
    toast({ title: "Independent again", text: "The newsroom is yours alone.", kind: "success" });
  });
  $("#voluntary-auction-btn").addEventListener("click", () => {
    if (!confirm("Sell to a new owner? Bids will replace your current owner.")) return;
    openAuction(true);
  });
}

function openAuction(voluntary) {
  $("#bankruptcy-modal").classList.remove("hidden");
  $("#auction-bidders").classList.add("hidden");
  $("#auction-bidders").innerHTML = "";
  // Adjust modal text for voluntary
  const head = $("#bankruptcy-modal .auction-h");
  const lede = $("#bankruptcy-modal .auction-lede");
  const shutdown = $("#ba-shutdown");
  if (voluntary) {
    head.textContent = "Voluntary auction";
    lede.textContent = "Solicit bids from outside investors. Pick the offer you can live with.";
    shutdown.classList.add("hidden");
  } else {
    head.textContent = "📉 BANKRUPTCY";
    lede.textContent = "You're out of money. The doors are closing — unless you sell.";
    shutdown.classList.remove("hidden");
  }
  // Auto-trigger bid solicitation
  $("#ba-auction").click();
  $("#ba-auction").dataset.voluntary = voluntary ? "1" : "0";
}

function triggerBankruptcy() {
  state.bankrupt = true;
  saveState();
  $("#bankruptcy-modal").classList.remove("hidden");
  $("#auction-bidders").classList.add("hidden");
  $("#auction-bidders").innerHTML = "";
}

function setupBankruptcyHandlers() {
  $("#ba-shutdown").addEventListener("click", () => {
    if (!confirm("Shut down for good? This resets your save.")) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
  $("#ba-auction").addEventListener("click", async () => {
    const voluntary = $("#ba-auction").dataset.voluntary === "1";
    $("#ba-auction").disabled = true;
    $("#ba-auction").textContent = "Soliciting bidders…";
    $("#auction-bidders").classList.remove("hidden");
    $("#auction-bidders").innerHTML = `<div><span class="spinner"></span> Brokers calling around…</div>`;
    try {
      const r = await fetch("/api/owner-bid", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newsroom: state.newsroom.name, voluntary }) });
      const data = await r.json();
      const bidders = data.bidders || [];
      $("#auction-bidders").innerHTML = bidders.map((b, i) => `
        <div class="bidder-card" data-i="${i}">
          <h4 class="bidder-name">${escapeHtml(b.name)}</h4>
          <div class="bidder-type">${escapeHtml(b.type)} · ${escapeHtml(b.personality)}</div>
          <div class="bidder-bid">${fmtCash(b.bid)}</div>
          <div class="bidder-demand">"${escapeHtml(b.demand)}"</div>
          <div class="bidder-budget">Monthly stipend: ${fmtCash(b.monthly_budget || 5000)}</div>
          <div style="margin-top:10px"><button class="primary-btn accept-bid" data-i="${i}">Sell to ${escapeHtml(b.name.split(/\s/)[0])}</button></div>
        </div>`).join("");
      $$(".accept-bid").forEach(btn => btn.addEventListener("click", () => {
        const b = bidders[+btn.dataset.i];
        acceptBid(b);
      }));
    } catch (e) {
      $("#auction-bidders").innerHTML = `<div style="color:var(--accent)">Auction failed: ${escapeHtml(e.message)}</div>`;
      $("#ba-auction").disabled = false;
      $("#ba-auction").textContent = "Try again";
    }
  });
}
function acceptBid(b) {
  const wasBankrupt = state.bankrupt;
  state.owner = {
    name: b.name, type: b.type, personality: b.personality, demand: b.demand,
    bid: b.bid, monthlyBudget: b.monthly_budget || 5000, satisfaction: 55,
  };
  // Bankruptcy auction: cash replaced with bid; voluntary: bid added on top
  state.stats.cash = wasBankrupt ? b.bid : state.stats.cash + b.bid;
  state.bankrupt = false;
  saveState();
  $("#bankruptcy-modal").classList.add("hidden");
  // Reset button state for next time
  $("#ba-auction").disabled = false;
  $("#ba-auction").textContent = "Put the paper up for auction";
  delete $("#ba-auction").dataset.voluntary;
  renderStats(); renderOwnerPanel();
  toast({ title: "Sold", text: `${b.name} now owns ${state.newsroom.name}.`, kind: "warn", timeout: 6000 });
  checkAchievements();
}

/* ==================================================================== */
/*                          BREAKING NEWS                               */
/* ==================================================================== */

async function pollBreakingNews() {
  try {
    const r = await fetch("/api/breaking-news", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ context: state.newsroom.hqCityId }) });
    const ev = await r.json();
    if (!ev || !ev.headline) return;
    state.breaking = { ...ev, id: uid() };
    saveState(); renderBreakingBanner();
  } catch {}
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
    const tip = state.breaking.summary;
    if (state.reporters.length) {
      const r = state.reporters[0];
      assignStory(r.id, { tip, beat: state.breaking.category });
      $$(".nav-btn[data-view='approvals']")[0]?.click();
    } else {
      $("#writer-title").value = state.breaking.headline;
      $("#writer-body").value = state.breaking.summary + "\n\n";
      $$(".nav-btn[data-view='write']")[0]?.click();
    }
    state.breaking = null; saveState(); renderBreakingBanner();
  });
}

/* ==================================================================== */
/*                          ACHIEVEMENTS                                */
/* ==================================================================== */

function renderAchievements() {
  $("#achievements-grid").innerHTML = ACHIEVEMENTS.map(a => {
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
  let any = false;
  ACHIEVEMENTS.forEach(a => {
    if (!state.achievements[a.id] && a.test(state)) {
      state.achievements[a.id] = Date.now(); any = true;
      toast({ title: `🏆 ${a.title}`, text: a.desc, kind: "success", timeout: 5500 });
    }
  });
  if (any) { saveState(); renderStats(); }
}

/* ==================================================================== */
/*                          MODAL / SETTINGS                            */
/* ==================================================================== */

function openArticleModal(id) {
  const a = state.articles.find(x => x.id === id);
  if (!a) return;
  $("#modal").dataset.articleId = id;
  $("#modal-body").innerHTML = `<div class="modal-body">
    <div class="byline">${escapeHtml(a.review.category || "Local")} · By ${escapeHtml(a.author)}</div>
    <h1>${escapeHtml(a.title)}${a.viral ? '<span class="viral-badge">VIRAL</span>' : ""}</h1>
    <div class="article-text">${escapeHtml(a.body)}</div>
    <div class="views-line">${fmtNum(a.currentViews)} of ${fmtNum(a.review.estimated_views)} views · Grade ${a.review.overall_grade} · ${a.comments.length} comments${a.live ? ' · <span class="live-badge">LIVE</span>' : ""}</div>
    ${renderReviewPanel(a)}
  </div>`;
  $("#modal").classList.remove("hidden");
  animateBars($("#modal-body"));
}
function setupModal() {
  $$("#modal [data-close]").forEach(el => el.addEventListener("click", () => {
    $("#modal").classList.add("hidden");
    $("#modal").dataset.articleId = "";
  }));
}

function openSettings() {
  const hq = state.cities.find(c => c.id === state.newsroom.hqCityId);
  const ident = IDENTITIES.find(i => i.id === state.newsroom.identity);
  $("#set-locked-info").innerHTML = `
    <dl style="margin:0">
      <dt>Player</dt><dd>${escapeHtml(state.player.name)}</dd>
      <dt>Newsroom</dt><dd>${escapeHtml(state.newsroom.name)}</dd>
      <dt>Identity</dt><dd>${escapeHtml(ident?.name || "")}</dd>
      <dt>HQ</dt><dd>${escapeHtml(hq?.name || "")}</dd>
      <dt>Founded</dt><dd>${new Date(state.newsroom.founded).toLocaleDateString()}</dd>
    </dl>
    <p style="font-size:11px;color:var(--slate);margin-top:10px">These choices are permanent.</p>`;
  $("#set-density").value = state.settings.density;
  $("#set-speed").value = state.settings.speed;
  $("#set-speed-readout").textContent = state.settings.speed + "x";
  $("#settings-drawer").classList.remove("hidden");
}
function setupSettings() {
  $("#open-settings").addEventListener("click", openSettings);
  $$("#settings-drawer [data-close-drawer]").forEach(el => el.addEventListener("click", () => $("#settings-drawer").classList.add("hidden")));
  $("#set-density").addEventListener("input", e => { state.settings.density = +e.target.value; applyTheme(); saveState(); });
  $("#set-speed").addEventListener("input", e => { state.settings.speed = +e.target.value; $("#set-speed-readout").textContent = state.settings.speed + "x"; saveState(); });
  $("#set-reset").addEventListener("click", () => {
    if (!confirm("Reset everything? This wipes your save.")) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
}

/* ==================================================================== */
/*                              AI STATUS                               */
/* ==================================================================== */

async function loadAiStatus() {
  try { const r = await fetch("/api/health"); const j = await r.json(); $("#ai-status").textContent = `AI: ${j.aiProvider || "—"}`; }
  catch { $("#ai-status").textContent = "AI: offline"; }
}

/* ==================================================================== */
/*                                BOOT                                  */
/* ==================================================================== */

function refreshAll() {
  applyTheme();
  renderBrand();
  renderClock();
  renderStats();
  renderDashboard();
  renderReporters();
  renderApprovals();
  renderBreakingBanner();
}

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  showOnboardingIfNeeded();
  setupNav();
  setupWriter();
  setupModal();
  setupSettings();
  setupBreakingHandlers();
  setupBankruptcyHandlers();
  loadAiStatus();
  if (state.onboarded) {
    refreshAll();
    refreshCompetitorWire();
    startGameLoop();
    if (state.bankrupt) $("#bankruptcy-modal").classList.remove("hidden");
  }
  $("#refresh-pool").addEventListener("click", () => { state.candidatePool = generateCandidates(3); saveState(); renderReporters(); });
  setInterval(refreshCompetitorWire, 3 * 60 * 1000);
  setTimeout(pollBreakingNews, 25000);
  setInterval(pollBreakingNews, 90 * 1000);
});
