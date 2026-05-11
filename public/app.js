"use strict";

const STORAGE_KEY = "newsroom-sim-state-v1";

const FIRST_NAMES = ["Alex","Riley","Jordan","Sam","Casey","Morgan","Taylor","Jamie","Drew","Avery","Cameron","Reese","Quinn","Devon","Harper","Skyler","Logan","Rowan","Sasha","Emerson","Marisol","Diego","Priya","Yusuf","Wen","Kai","Noor","Tomás","Ines","Aki"];
const LAST_NAMES = ["Carter","Brooks","Vega","Patel","Nguyen","Cohen","Okafor","Rivera","Hughes","Martin","Sato","Khan","Andersen","Romano","Bauer","Park","Velasquez","Singh","Müller","Marsh","Holloway","Ortiz","Petrov","Hayashi","Bennett","Diallo"];
const BEATS = ["City Hall","Tech","Business","Crime","Sports","Culture","World","Investigations","Climate","Health","Politics","Education"];

const COMPETITORS = [
  { name: "The Daily Ledger", logo: "🗞️" },
  { name: "Metro Wire", logo: "📡" },
  { name: "Capital Post", logo: "🏛️" },
  { name: "Tribune North", logo: "🧭" },
];

/* -------------------- state -------------------- */
let state = loadState();

function defaultState() {
  return {
    onboarded: false,
    newsroom: { name: "The Daily", logo: "📰", motto: "All the news that fits.", founded: Date.now() },
    player: { name: "You" },
    stats: { cash: 5000, reputation: 50, totalViews: 0 },
    reporters: [],
    pendingApprovals: [],
    articles: [],
    candidatePool: [],
    competitors: COMPETITORS.map(c => ({ ...c })),
    competitorHeadlines: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* -------------------- helpers -------------------- */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

function fmtNum(n) { return n.toLocaleString("en-US"); }
function fmtCash(n) { return "$" + n.toLocaleString("en-US"); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function initials(name) {
  return name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0,2).join("").toUpperCase() || "?";
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(lo, hi) { return Math.floor(lo + Math.random() * (hi - lo + 1)); }

function classifyScore(score) {
  if (score >= 75) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

/* -------------------- onboarding -------------------- */
function showOnboardingIfNeeded() {
  if (state.onboarded) {
    $("#onboarding").classList.add("hidden");
    $("#app").classList.remove("hidden");
    return;
  }
  $("#onboarding").classList.remove("hidden");
  $("#app").classList.add("hidden");
  $("#ob-start").addEventListener("click", finishOnboarding);
}
function finishOnboarding() {
  const player = $("#ob-player").value.trim() || "Alex Carter";
  const newsroom = $("#ob-newsroom").value.trim() || "The Daily";
  const logo = $("#ob-logo").value.trim() || "📰";
  const motto = $("#ob-motto").value.trim() || "All the news that fits.";
  state.player.name = player;
  state.newsroom = { name: newsroom, logo, motto, founded: Date.now() };
  state.onboarded = true;
  state.candidatePool = generateCandidates(3);
  saveState();
  $("#onboarding").classList.add("hidden");
  $("#app").classList.remove("hidden");
  refreshAll();
  refreshCompetitorWire();
}

/* -------------------- navigation -------------------- */
function setupNav() {
  $$(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.view;
      $$(".nav-btn").forEach(b => b.classList.toggle("active", b === btn));
      $$(".view").forEach(s => s.classList.toggle("active", s.dataset.view === v));
      if (v === "public") renderPublicSite();
      if (v === "competitors") renderCompetitors();
    });
  });
}

/* -------------------- masthead / stats -------------------- */
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
function renderStats() {
  $("#stat-articles").textContent = fmtNum(state.articles.length);
  $("#stat-views").textContent = fmtNum(state.stats.totalViews);
  $("#stat-rep").textContent = fmtNum(state.stats.reputation);
  $("#stat-cash").textContent = fmtCash(state.stats.cash);
  $("#stat-reporters").textContent = fmtNum(state.reporters.length);
  const badge = $("#approvals-badge");
  if (state.pendingApprovals.length > 0) {
    badge.textContent = state.pendingApprovals.length;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

/* -------------------- dashboard -------------------- */
function renderDashboard() {
  const recent = state.articles.slice().reverse().slice(0, 8);
  const host = $("#dash-recent");
  if (recent.length === 0) {
    host.innerHTML = `<div class="public-empty">No articles yet. Hit <strong>Write Article</strong> to publish your first piece.</div>`;
  } else {
    host.innerHTML = recent.map(a => `
      <div class="article-row" data-id="${a.id}">
        <div class="grade">${a.review.overall_grade}</div>
        <div class="meta-block">
          <p class="row-title">${escapeHtml(a.title)}</p>
          <p class="row-meta">${escapeHtml(a.category)} · ${escapeHtml(a.author)} · ${fmtNum(a.review.estimated_views)} views</p>
        </div>
      </div>
    `).join("");
    $$("#dash-recent .article-row").forEach(r => r.addEventListener("click", () => openArticleModal(r.dataset.id)));
  }

  const wire = $("#dash-competitors");
  if (state.competitorHeadlines.length === 0) {
    wire.innerHTML = `<div class="public-empty">Wire loading…</div>`;
  } else {
    wire.innerHTML = state.competitorHeadlines.map(h => `
      <div class="wire-item">
        <div class="wire-outlet">${escapeHtml(h.outlet)}</div>
        <div class="wire-headline">${escapeHtml(h.headline)}</div>
      </div>
    `).join("");
  }

  if (state.competitorHeadlines.length) {
    $("#ticker").textContent = state.competitorHeadlines.map(h => `${h.outlet}: ${h.headline}`).join("   •   ");
  }
}

/* -------------------- writer -------------------- */
function setupWriter() {
  const body = $("#writer-body");
  const count = $("#writer-wordcount");
  body.addEventListener("input", () => {
    const w = body.value.trim().split(/\s+/).filter(Boolean).length;
    count.textContent = `${w} word${w === 1 ? "" : "s"}`;
  });
  $("#writer-publish").addEventListener("click", onPublish);
}
async function onPublish() {
  const title = $("#writer-title").value.trim();
  const bodyText = $("#writer-body").value.trim();
  const category = $("#writer-category").value;
  if (!title || !bodyText) {
    alert("Both a headline and article body are required.");
    return;
  }
  const btn = $("#writer-publish");
  btn.disabled = true;
  const result = $("#writer-result");
  result.classList.remove("hidden");
  result.innerHTML = `<div><span class="spinner"></span> Submitting to editorial AI for review…</div>`;
  try {
    const review = await fetchReview({ title, body: bodyText, author: state.player.name });
    const article = saveArticle({ title, body: bodyText, author: state.player.name, category, review });
    result.innerHTML = renderReviewPanel(article);
    $("#writer-title").value = "";
    $("#writer-body").value = "";
    $("#writer-wordcount").textContent = "0 words";
  } catch (e) {
    result.innerHTML = `<div style="color: var(--red)">Review failed: ${escapeHtml(e.message)}</div>`;
  } finally {
    btn.disabled = false;
  }
}

async function fetchReview({ title, body, author }) {
  const resp = await fetch("/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body, author, newsroom: state.newsroom.name }),
  });
  if (!resp.ok) throw new Error("Server error");
  return resp.json();
}

function saveArticle({ title, body, author, category, review }) {
  const article = {
    id: uid(),
    title, body, author, category, review,
    publishedAt: Date.now(),
  };
  state.articles.push(article);
  state.stats.totalViews += review.estimated_views || 0;
  const overallNum = gradeToNumber(review.overall_grade);
  const repDelta = Math.round((overallNum - 60) / 6);
  state.stats.reputation = Math.max(0, Math.min(100, state.stats.reputation + repDelta));
  state.stats.cash += Math.round((review.estimated_views || 0) * 0.02);
  saveState();
  renderStats();
  renderDashboard();
  return article;
}

function gradeToNumber(g) {
  const map = { "A+":98,"A":92,"A-":88,"B+":82,"B":78,"B-":72,"C+":68,"C":62,"C-":58,"D":48,"F":35 };
  return map[g] ?? 60;
}

function renderReviewPanel(article) {
  const r = article.review;
  const bar = (label, score) => {
    const cls = classifyScore(score);
    return `<div class="rating-row">
      <div class="rating-label"><span>${label}</span><span>${score}</span></div>
      <div class="bar"><div class="bar-fill ${cls}" style="width:${score}%"></div></div>
    </div>`;
  };
  const comments = (r.comments || []).map(c => `
    <div class="comment"><span class="comment-author">${escapeHtml(c.author)}</span><span class="comment-text">${escapeHtml(c.text)}</span></div>
  `).join("");
  return `
    <div class="review-grade">
      <div class="big-grade">${r.overall_grade}</div>
      <div class="grade-meta">
        <div><strong>${fmtNum(r.estimated_views)}</strong> views projected</div>
        <div>Headline score: <strong>${r.headline_score}</strong></div>
        <div>Tone: <strong>${escapeHtml(r.tone || "—")}</strong>${r._simulated ? " · <em>simulated reviewer</em>" : ""}</div>
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
      <h3 class="comments-h">Reader comments</h3>
      ${comments}
    </div>
  `;
}

/* -------------------- reporters / hiring -------------------- */
function generateCandidates(n) {
  return Array.from({ length: n }, () => {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const skill = randInt(20, 95);
    const salary = 200 + Math.round(skill * 12);
    return {
      id: uid(),
      name,
      skill,
      salary,
      beat: pick(BEATS),
    };
  });
}

function renderReporters() {
  const staffHost = $("#staff-list");
  if (state.reporters.length === 0) {
    staffHost.innerHTML = `<div class="public-empty">You're a one-person operation. Hire reporters to expand coverage.</div>`;
  } else {
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
          <button class="primary-btn assign-btn" data-id="${r.id}">Assign Story</button>
          <button class="reject-btn fire-btn" data-id="${r.id}">Fire</button>
        </div>
      </div>
    `).join("");
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
    </div>
  `).join("");
  $$(".hire-btn").forEach(b => b.addEventListener("click", () => hireReporter(b.dataset.id)));
}

function hireReporter(id) {
  const cand = state.candidatePool.find(c => c.id === id);
  if (!cand) return;
  const signOn = cand.salary * 5;
  if (state.stats.cash < signOn) {
    alert("Not enough cash to hire this reporter.");
    return;
  }
  state.stats.cash -= signOn;
  state.reporters.push(cand);
  state.candidatePool = state.candidatePool.filter(c => c.id !== id);
  if (state.candidatePool.length < 2) state.candidatePool.push(...generateCandidates(2));
  saveState();
  renderStats();
  renderReporters();
}
function fireReporter(id) {
  if (!confirm("Fire this reporter?")) return;
  state.reporters = state.reporters.filter(r => r.id !== id);
  saveState();
  renderStats();
  renderReporters();
}

async function assignStory(id) {
  const reporter = state.reporters.find(r => r.id === id);
  if (!reporter) return;
  if (state.stats.cash < reporter.salary) {
    alert("Not enough cash to pay this reporter for the assignment.");
    return;
  }
  const beat = prompt(`Assign ${reporter.name} a story topic (or leave blank for ${reporter.beat}):`, "");
  state.stats.cash -= reporter.salary;
  saveState();
  renderStats();
  // Optimistic: insert a "drafting" placeholder
  const draftingId = uid();
  state.pendingApprovals.push({ id: draftingId, status: "drafting", reporterId: reporter.id, reporterName: reporter.name, beat: beat || reporter.beat });
  saveState();
  renderApprovals(); renderStats();
  try {
    const resp = await fetch("/api/reporter-article", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reporterName: reporter.name, beat: beat || reporter.beat, newsroom: state.newsroom.name }),
    });
    const draft = await resp.json();
    const idx = state.pendingApprovals.findIndex(p => p.id === draftingId);
    if (idx !== -1) {
      state.pendingApprovals[idx] = {
        id: draftingId,
        status: "ready",
        reporterId: reporter.id,
        reporterName: reporter.name,
        title: draft.title,
        body: draft.body,
        category: draft.category || "Local",
      };
      saveState(); renderApprovals(); renderStats();
    }
  } catch (e) {
    alert("The reporter failed to file: " + e.message);
  }
}

/* -------------------- approvals -------------------- */
function renderApprovals() {
  const host = $("#approvals-list");
  if (state.pendingApprovals.length === 0) {
    host.innerHTML = `<div class="public-empty">No stories awaiting approval. Assign your reporters to file something.</div>`;
    return;
  }
  host.innerHTML = state.pendingApprovals.map(p => {
    if (p.status === "drafting") {
      return `<div class="approval-card">
        <h3>${escapeHtml(p.reporterName)} is drafting a story on <em>${escapeHtml(p.beat)}</em>…</h3>
        <div class="approval-byline"><span class="spinner"></span> Working</div>
      </div>`;
    }
    return `<div class="approval-card" data-id="${p.id}">
      <h3>${escapeHtml(p.title)}</h3>
      <div class="approval-byline">By ${escapeHtml(p.reporterName)} · ${escapeHtml(p.category)}</div>
      <div class="approval-body">${escapeHtml(p.body)}</div>
      <div class="approval-actions">
        <button class="primary-btn approve-btn" data-id="${p.id}">Approve &amp; Publish</button>
        <button class="reject-btn reject-pending" data-id="${p.id}">Reject (spike)</button>
      </div>
    </div>`;
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
    saveState();
    renderApprovals();
  } catch (e) {
    alert("Review failed: " + e.message);
    if (btn) { btn.disabled = false; btn.textContent = "Approve & Publish"; }
  }
}
function rejectPending(id) {
  state.pendingApprovals = state.pendingApprovals.filter(x => x.id !== id);
  saveState();
  renderApprovals();
  renderStats();
}

/* -------------------- public site -------------------- */
function renderPublicSite() {
  const host = $("#public-articles");
  if (state.articles.length === 0) {
    host.innerHTML = `<div class="public-empty" style="grid-column: 1 / -1;">No published stories yet. Your front page is empty.</div>`;
    return;
  }
  const sorted = state.articles.slice().reverse();
  const lead = sorted[0];
  const rest = sorted.slice(1, 6);
  host.innerHTML = `
    <div class="public-lead" data-id="${lead.id}">
      <div class="public-category">${escapeHtml(lead.category)}</div>
      <h2>${escapeHtml(lead.title)}</h2>
      <p class="excerpt">${escapeHtml(excerptOf(lead.body))}</p>
      <div class="byline">By ${escapeHtml(lead.author)} · ${fmtNum(lead.review.estimated_views)} views</div>
    </div>
    <div class="public-side">
      <div class="public-side-list">
        ${rest.map(a => `
          <div data-id="${a.id}">
            <div class="public-category">${escapeHtml(a.category)}</div>
            <h3>${escapeHtml(a.title)}</h3>
            <div class="byline">By ${escapeHtml(a.author)} · ${fmtNum(a.review.estimated_views)} views</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  $$("#public-articles [data-id]").forEach(el => el.addEventListener("click", () => openArticleModal(el.dataset.id)));
}
function excerptOf(s) {
  return s.replace(/\s+/g, " ").slice(0, 220) + (s.length > 220 ? "…" : "");
}

/* -------------------- competitors -------------------- */
function renderCompetitors() {
  const host = $("#competitor-cards");
  host.innerHTML = state.competitors.map(c => {
    const h = state.competitorHeadlines.find(x => x.outlet === c.name);
    return `<div class="comp-card">
      <h3 class="comp-name">${c.logo} ${escapeHtml(c.name)}</h3>
      <p class="comp-headline">${escapeHtml(h ? h.headline : "—")}</p>
      <div class="comp-cat">${escapeHtml(h ? h.category : "")}</div>
    </div>`;
  }).join("");
}

async function refreshCompetitorWire() {
  try {
    const resp = await fetch("/api/competitor-headlines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competitors: state.competitors.map(c => c.name) }),
    });
    const data = await resp.json();
    state.competitorHeadlines = data.headlines || [];
    saveState();
    renderDashboard();
    renderCompetitors();
  } catch (e) {
    console.warn("competitor wire failed", e);
  }
}

/* -------------------- modal -------------------- */
function openArticleModal(id) {
  const a = state.articles.find(x => x.id === id);
  if (!a) return;
  const r = a.review;
  $("#modal-body").innerHTML = `
    <div class="modal-body">
      <div class="byline">${escapeHtml(a.category)} · By ${escapeHtml(a.author)}</div>
      <h1>${escapeHtml(a.title)}</h1>
      <div class="article-text">${escapeHtml(a.body)}</div>
      <div class="views-line">${fmtNum(r.estimated_views)} views · Grade ${r.overall_grade} · Headline ${r.headline_score}</div>
      ${renderReviewPanel(a)}
    </div>
  `;
  $("#modal").classList.remove("hidden");
}
function setupModal() {
  $$("#modal [data-close]").forEach(el => el.addEventListener("click", () => $("#modal").classList.add("hidden")));
}

/* -------------------- misc -------------------- */
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}

async function loadAiStatus() {
  try {
    const r = await fetch("/api/health");
    const j = await r.json();
    $("#ai-status").textContent = j.aiEnabled ? `AI: Claude (${j.model})` : "AI: Simulated";
  } catch {
    $("#ai-status").textContent = "AI: offline";
  }
}

function refreshAll() {
  renderBrand();
  renderStats();
  renderDashboard();
  renderReporters();
  renderApprovals();
}

document.addEventListener("DOMContentLoaded", () => {
  showOnboardingIfNeeded();
  setupNav();
  setupWriter();
  setupModal();
  loadAiStatus();
  if (state.onboarded) {
    refreshAll();
    refreshCompetitorWire();
  }
  $("#refresh-pool").addEventListener("click", () => {
    state.candidatePool = generateCandidates(3);
    saveState();
    renderReporters();
  });
  // Refresh competitor wire periodically (every 3 minutes)
  setInterval(refreshCompetitorWire, 3 * 60 * 1000);
});
