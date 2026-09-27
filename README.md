# Claude Certified Architect – Foundations: Practice Quizzes

A static web app (no build step, no dependencies) for studying for the Claude Certified Architect – Foundations exam. Works on phone and desktop.

## Features

- **60 scenario questions** in three practice sets, tagged by the five exam domains (Agentic Architecture 27%, Tool Design & MCP 18%, Claude Code 20%, Prompt Engineering 20%, Context Management 15%).
- **Practice mode** (explanation after each answer) and **Exam mode** (feedback at the end, jump-to-question grid).
- **Fair answer placement** — options are reshuffled every attempt and the correct answer is dealt evenly across A–D (no letter skew, no long streaks). Question text is written so the correct option doesn't stand out by length, detail, or hedging; `tools/validate-quizzes.mjs` enforces this.
- **Saved progress** — every answer is saved to the browser immediately; resume any quiz later. Per-domain accuracy on the home screen.
- **Flashcards from results** — one tap turns missed questions into a deck; Leitner boxes (Again → box 1, Got it → next box, box 5 = mastered). Also build decks from all missed questions or a whole domain.
- **Custom quizzes** — filter by domain, source quiz, never-answered, missed last time, or below 70%.
- **Add quizzes without code** — *Manage → Add a quiz* has a copy-ready prompt for Claude; paste the JSON it returns.
- **Backup & sync** — download, copy, or paste a backup to move it between devices (storage is per-browser).
- Keyboard: A–D / 1–4 answer, ← → navigate; flashcards: Space flip, 1 again, 2 got it.

## Run it

Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

### Phone + PC access (GitHub Pages)

Merge to `main`, then in the repo go to **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root**. The site appears at `https://<user>.github.io/claude-cert/`. On a phone, use *Add to Home Screen* for an app-like icon.

## Adding quizzes

See [docs/ADDING_QUIZZES.md](docs/ADDING_QUIZZES.md). Short version: drop a `quizzes/<name>.js` file, add it to `quizzes/manifest.js`, run `node tools/validate-quizzes.mjs`.
