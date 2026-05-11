# Newsroom Simulator

Found your newsroom. Hire reporters. Write articles. Compete with rival papers for the front page.

A browser-based game where you actually write the articles — and a third-party AI (Anthropic's Claude) grades them, simulates reader views, generates comments, and writes a critic's blurb.

## Features

- **Onboarding** — pick your newsroom name, logo (emoji), motto, and your reporter name.
- **Write Article** — write a real headline + body. Submit to the editorial AI for review.
- **AI review** — every article gets graded across five axes (writing, credibility, engagement, sensationalism, originality), assigned an overall grade A+ through F, a projected view count, a tone label, simulated reader comments, and a critic's blurb.
- **Reporters** — hire freelancers from a rotating candidate pool. Each has a skill score, beat, and per-article salary. Assign them stories and approve or spike their drafts.
- **Public site preview** — see your front page rendered as a real-looking news site.
- **Competitor wire** — a live ticker of rival headlines from competing papers.
- **Cash & reputation** — published articles earn cash from views and shift your reputation. Hiring and assignments cost money.

## Running it

```
npm install
cp .env.example .env       # optionally add ANTHROPIC_API_KEY for real Claude reviews
npm start
# -> http://localhost:3000
```

Without an `ANTHROPIC_API_KEY` the game still works fully — it falls back to a built-in simulated reviewer that scores articles based on heuristics (word count, presence of quotes/numbers, clickbait phrases, etc.). With an API key, the reviewer is Claude Sonnet 4.5.

## Architecture

- `server.js` — Express server. Three endpoints:
  - `POST /api/review` — grades a player-written or reporter-drafted article.
  - `POST /api/reporter-article` — generates a draft from a hired reporter.
  - `POST /api/competitor-headlines` — generates fictional rival headlines.
- `public/` — static frontend (vanilla HTML/CSS/JS, single-page app).
- Game state lives in `localStorage` under `newsroom-sim-state-v1`. Clear it from devtools to reset.

## Tech

- Node.js + Express
- `@anthropic-ai/sdk` for Claude integration
- Vanilla HTML/CSS/JS frontend — no build step, no framework
