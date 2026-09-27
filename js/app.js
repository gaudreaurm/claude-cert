/* Claude Architect exam prep — quizzes + flashcards, no build step, no dependencies.
   All progress lives in localStorage under STORE_KEY. */
(() => {
  "use strict";

  const STORE_KEY = "cca-prep:v1";
  const MASTERED_BOX = 5;
  const DOMAINS = {
    agentic: { name: "Agentic Architecture & Orchestration", weight: 27 },
    tools: { name: "Tool Design & MCP Integration", weight: 18 },
    "claude-code": { name: "Claude Code Configuration & Workflows", weight: 20 },
    prompting: { name: "Prompt Engineering & Structured Output", weight: 20 },
    context: { name: "Context Management & Reliability", weight: 15 },
  };
  const LETTERS = "ABCDEF";

  /* ---------- quiz registry ---------- */

  const quizzes = new Map(); // id -> quiz
  const qIndex = new Map();  // "quizId::qid" -> { quiz, q }

  function addQuiz(quiz, source) {
    quiz = { ...quiz, source };
    quizzes.set(quiz.id, quiz);
    for (const q of quiz.questions) qIndex.set(ref(quiz.id, q.id), { quiz, q });
  }
  function removeQuiz(id) {
    const quiz = quizzes.get(id);
    if (!quiz) return;
    for (const q of quiz.questions) qIndex.delete(ref(id, q.id));
    quizzes.delete(id);
  }
  window.registerQuiz = (quiz) => {
    const { quiz: clean, errors } = normalizeQuiz(quiz);
    if (errors.length) console.error(`Quiz "${quiz && quiz.id}" has errors:`, errors);
    if (clean) addQuiz(clean, "built-in");
  };

  const ref = (quizId, qid) => `${quizId}::${qid}`;
  const getQ = (r) => qIndex.get(r);

  // Validates a quiz object and fills in defaults. Returns { quiz, errors, warnings }.
  function normalizeQuiz(raw) {
    const errors = [], warnings = [];
    if (!raw || typeof raw !== "object") return { quiz: null, errors: ["Not an object"], warnings };
    const title = String(raw.title || "").trim();
    if (!title) errors.push("Missing \"title\"");
    const id = String(raw.id || slug(title) || "").trim();
    if (!id) errors.push("Missing \"id\"");
    if (!Array.isArray(raw.questions) || !raw.questions.length) errors.push("\"questions\" must be a non-empty array");
    const questions = [];
    const seen = new Set();
    (raw.questions || []).forEach((q, i) => {
      const tag = `Question ${i + 1}`;
      if (!q || typeof q !== "object") return errors.push(`${tag}: not an object`);
      const qid = String(q.id || `q${i + 1}`);
      if (seen.has(qid)) errors.push(`${tag}: duplicate id "${qid}"`);
      seen.add(qid);
      const text = String(q.q || q.question || "").trim();
      if (!text) errors.push(`${tag}: missing "q"`);
      const options = Array.isArray(q.options) ? q.options.map((o) => String(o)) : [];
      if (options.length < 2 || options.length > 6) errors.push(`${tag}: needs 2–6 options`);
      const answer = Number(q.answer);
      if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) errors.push(`${tag}: "answer" must be a 0-based index into options`);
      if (!q.explanation) warnings.push(`${tag}: no explanation (flashcards will be thin)`);
      if (options.length > 2 && Number.isInteger(answer) && options[answer] !== undefined) {
        const others = options.filter((_, j) => j !== answer).map((o) => o.length);
        const avg = others.reduce((a, b) => a + b, 0) / others.length;
        if (options[answer].length > avg * 1.25) warnings.push(`${tag}: correct answer is much longer than the distractors (a giveaway)`);
      }
      questions.push({ id: qid, domain: q.domain || "general", q: text, options, answer, explanation: String(q.explanation || "") });
    });
    if (errors.length) return { quiz: null, errors, warnings };
    return { quiz: { id, title, description: String(raw.description || ""), questions }, errors, warnings };
  }

  /* ---------- state ---------- */

  const defaults = () => ({
    attempts: {},  // id -> attempt
    stats: {},     // ref -> { seen, correct, last }
    decks: {},     // id -> { id, title, created, cards: [{ ref, box }] }
    imported: {},  // id -> raw quiz
    settings: { mode: "practice" },
  });
  let state = load();

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (saved && typeof saved === "object") {
        const d = defaults();
        return { ...d, ...saved, settings: { ...d.settings, ...saved.settings } };
      }
    } catch (e) { /* fall through */ }
    return defaults();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch (e) { toast("Couldn't save progress — storage is full or blocked."); }
  }

  /* ---------- utils ---------- */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const domainName = (d) => (DOMAINS[d] ? DOMAINS[d].name : d);
  function slug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 2600);
  }
  function download(filename, text) {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast("Copied"); }
    catch (e) { toast("Copy failed — select the text and copy manually."); }
  }
  const go = (hash) => { location.hash = hash; };

  /* ---------- attempts ---------- */

  // Picks the display order of each question's options. The slot that holds the
  // correct answer is dealt from an evenly filled, shuffled deck of letters, so
  // across an attempt every letter is correct about equally often and there are
  // no long streaks of the same letter.
  function balancedOrders(refs) {
    let targets;
    for (let tries = 0; tries < 50; tries++) {
      targets = shuffle(refs.map((_, i) => i % 4));
      if (!hasRun(targets, 3)) break;
    }
    return refs.map((r, i) => {
      const { q } = getQ(r);
      const n = q.options.length;
      const others = shuffle([...Array(n).keys()].filter((j) => j !== q.answer));
      others.splice(targets[i] % n, 0, q.answer);
      return others; // order[displayIndex] = originalIndex
    });
  }
  function hasRun(arr, len) {
    let run = 1;
    for (let i = 1; i < arr.length; i++) {
      run = arr[i] === arr[i - 1] ? run + 1 : 1;
      if (run > len) return true;
    }
    return false;
  }

  function startAttempt({ title, refs, quizId = null, mode = state.settings.mode, shuffleQuestions = false }) {
    refs = refs.filter(getQ);
    if (!refs.length) return toast("No questions match.");
    if (shuffleQuestions) refs = shuffle(refs);
    const a = {
      id: uid(), title, quizId, mode, refs, orders: balancedOrders(refs),
      answers: {}, current: 0, startedAt: Date.now(), finishedAt: null,
    };
    state.attempts[a.id] = a;
    pruneAttempts();
    save();
    go(`#/quiz/${a.id}`);
  }
  function pruneAttempts() {
    const done = Object.values(state.attempts).filter((a) => a.finishedAt).sort((a, b) => b.finishedAt - a.finishedAt);
    for (const a of done.slice(100)) delete state.attempts[a.id];
  }
  function score(a) {
    let correct = 0;
    const byDomain = {};
    a.refs.forEach((r, i) => {
      const item = getQ(r);
      if (!item) return;
      const d = item.q.domain;
      byDomain[d] = byDomain[d] || { correct: 0, total: 0 };
      byDomain[d].total++;
      if (a.answers[i] === item.q.answer) { correct++; byDomain[d].correct++; }
    });
    return { correct, total: a.refs.length, byDomain };
  }
  const missedRefs = (a) => a.refs.filter((r, i) => getQ(r) && a.answers[i] !== getQ(r).q.answer);
  function finishAttempt(a) {
    a.finishedAt = Date.now();
    a.refs.forEach((r, i) => {
      const item = getQ(r);
      if (!item || a.answers[i] === undefined) return;
      const ok = a.answers[i] === item.q.answer;
      const s = (state.stats[r] = state.stats[r] || { seen: 0, correct: 0, last: null });
      s.seen++;
      if (ok) s.correct++;
      s.last = ok;
    });
    save();
    go(`#/results/${a.id}`);
  }
  const inProgress = () => Object.values(state.attempts).filter((a) => !a.finishedAt).sort((a, b) => b.startedAt - a.startedAt);
  const everMissed = () => Object.keys(state.stats).filter((r) => state.stats[r].last === false && getQ(r));

  /* ---------- decks ---------- */

  function createDeck(title, refs) {
    refs = [...new Set(refs)].filter(getQ);
    if (!refs.length) return toast("No questions to turn into flashcards.");
    const deck = { id: uid(), title, created: Date.now(), cards: refs.map((r) => ({ ref: r, box: 1 })) };
    state.decks[deck.id] = deck;
    save();
    go(`#/cards/${deck.id}`);
    return deck;
  }

  /* ---------- views ---------- */

  const app = $("#app");
  let cleanup = null;
  function render(html) {
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }
  function onKey(handler) {
    const h = (e) => {
      if (e.target.closest("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey) return;
      handler(e);
    };
    document.addEventListener("keydown", h);
    cleanup = () => document.removeEventListener("keydown", h);
  }

  function viewHome() {
    const all = [...qIndex.keys()];
    const seen = all.filter((r) => state.stats[r]);
    const correctLast = seen.filter((r) => state.stats[r].last).length;
    const missed = everMissed();
    const resumeFor = (quizId) => inProgress().find((a) => a.quizId === quizId);
    const best = (quizId) => {
      const scores = Object.values(state.attempts).filter((a) => a.finishedAt && a.quizId === quizId).map((a) => pct(score(a).correct, a.refs.length));
      return scores.length ? { best: Math.max(...scores), count: scores.length } : null;
    };

    const domainRows = Object.keys(DOMAINS).map((d) => {
      const refs = all.filter((r) => getQ(r).q.domain === d);
      const s = refs.filter((r) => state.stats[r]);
      const ok = s.filter((r) => state.stats[r].last).length;
      return `<div class="bar-row"><span>${esc(DOMAINS[d].name)} <span class="muted small">(${DOMAINS[d].weight}% of exam)</span></span>
        <span class="small muted">${s.length ? `${pct(ok, s.length)}% · ${s.length}/${refs.length} seen` : `0/${refs.length} seen`}</span>
        <div class="progress"><span style="width:${pct(ok, refs.length)}%"></span></div></div>`;
    }).join("");

    const continueHtml = inProgress().map((a) => `
      <div class="card row spread">
        <div><h3>${esc(a.title)}</h3><span class="muted small">${Object.keys(a.answers).length}/${a.refs.length} answered · ${a.mode === "exam" ? "Exam" : "Practice"} mode</span></div>
        <div class="row"><a class="btn primary" href="#/quiz/${a.id}">Resume</a><button class="linklike danger" data-discard="${a.id}">Discard</button></div>
      </div>`).join("");

    const quizHtml = [...quizzes.values()].map((quiz) => {
      const b = best(quiz.id);
      const r = resumeFor(quiz.id);
      return `<div class="card">
        <div class="row spread"><h3>${esc(quiz.title)}</h3>${quiz.source === "imported" ? '<span class="chip">imported</span>' : ""}</div>
        <p class="muted small">${esc(quiz.description || "")} ${quiz.questions.length} questions${b ? ` · best ${b.best}% (${b.count} attempt${b.count > 1 ? "s" : ""})` : ""}</p>
        <div class="row">
          ${r ? `<a class="btn primary" href="#/quiz/${r.id}">Resume (${Object.keys(r.answers).length}/${r.refs.length})</a>` : ""}
          <button class="${r ? "" : "primary"}" data-start="${esc(quiz.id)}" data-mode="practice">Practice</button>
          <button data-start="${esc(quiz.id)}" data-mode="exam">Exam mode</button>
        </div>
      </div>`;
    }).join("");

    render(`
      <h1>Claude Certified Architect – Foundations</h1>
      <p class="muted">Practice mode shows the explanation after each answer. Exam mode holds feedback until you finish. Answer order is reshuffled every attempt.</p>
      <div class="grid2">
        <div class="stat"><b>${seen.length}/${all.length}</b><span class="muted small">questions seen</span></div>
        <div class="stat"><b>${seen.length ? pct(correctLast, seen.length) + "%" : "—"}</b><span class="muted small">correct on last try</span></div>
      </div>
      ${continueHtml ? `<div class="section"><h2>Continue</h2>${continueHtml}</div>` : ""}
      <div class="section"><h2>Quick start</h2>
        <div class="row">
          <button class="primary" data-mock>Full mock exam (${all.length} Q, shuffled)</button>
          <button data-weak ${missed.length ? "" : "disabled"}>Retry missed (${missed.length})</button>
          <a class="btn" href="#/build">Custom quiz…</a>
        </div>
      </div>
      <div class="section"><h2>Quizzes</h2>${quizHtml || '<p class="muted">No quizzes loaded.</p>'}</div>
      <div class="section"><h2>Progress by domain</h2><div class="card">${domainRows}</div></div>
    `);

    app.addEventListener("click", homeClick);
    cleanup = () => app.removeEventListener("click", homeClick);
    function homeClick(e) {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.start) {
        const quiz = quizzes.get(t.dataset.start);
        startAttempt({ title: quiz.title, quizId: quiz.id, mode: t.dataset.mode, refs: quiz.questions.map((q) => ref(quiz.id, q.id)) });
      } else if (t.dataset.discard) {
        if (confirm("Discard this in-progress attempt?")) { delete state.attempts[t.dataset.discard]; save(); route(); }
      } else if ("mock" in t.dataset) {
        startAttempt({ title: "Full mock exam", mode: "exam", refs: all, shuffleQuestions: true });
      } else if ("weak" in t.dataset) {
        startAttempt({ title: "Retry missed questions", refs: missed, shuffleQuestions: true });
      }
    }
  }

  function viewQuiz(id) {
    const a = state.attempts[id];
    if (!a) return notFound();
    if (a.finishedAt) return go(`#/results/${id}`);
    const i = Math.min(a.current, a.refs.length - 1);
    const item = getQ(a.refs[i]);
    if (!item) {
      render(`<p>This question is no longer available (its quiz was removed).</p><button id="skip" class="primary">Skip</button>`);
      $("#skip").onclick = () => { a.refs.splice(i, 1); a.orders.splice(i, 1); remapAnswers(a, i); save(); a.refs.length ? route() : go("#/"); };
      return;
    }
    const { q } = item;
    const order = a.orders[i];
    const chosen = a.answers[i];
    const practice = a.mode === "practice";
    const revealed = practice && chosen !== undefined;
    const answeredCount = Object.keys(a.answers).length;
    const last = i === a.refs.length - 1;

    const opts = order.map((orig, d) => {
      let cls = "";
      if (revealed) {
        if (orig === q.answer) cls = "correct";
        else if (orig === chosen) cls = "wrong";
      } else if (orig === chosen) cls = "selected";
      return `<li><button class="option ${cls}" data-orig="${orig}" ${revealed ? "disabled" : ""} aria-pressed="${orig === chosen}">
        <span class="letter">${LETTERS[d]}</span><span>${fmt(q.options[orig])}</span></button></li>`;
    }).join("");

    const ok = chosen === q.answer;
    const explain = revealed ? `<div class="explain ${ok ? "good" : "bad"}" role="status">
      <strong>${ok ? "Correct." : `Not quite — the answer is ${LETTERS[order.indexOf(q.answer)]}.`}</strong>
      <p style="margin-top:6px">${fmt(q.explanation)}</p></div>` : "";

    const dots = a.mode === "exam" ? `<div class="dots" aria-label="Jump to question">${a.refs.map((_, j) =>
      `<button data-jump="${j}" class="${a.answers[j] !== undefined ? "answered" : ""} ${j === i ? "current" : ""}" aria-label="Question ${j + 1}">${j + 1}</button>`).join("")}</div>` : "";

    render(`
      <div class="row spread small muted"><span>${esc(a.title)}</span><span>${a.mode === "exam" ? "Exam" : "Practice"} mode</span></div>
      <div class="progress" style="margin:8px 0 14px"><span style="width:${pct(answeredCount, a.refs.length)}%"></span></div>
      <div class="row spread"><strong>Question ${i + 1} of ${a.refs.length}</strong><span class="chip">${esc(domainName(q.domain))}</span></div>
      <p class="question">${fmt(q.q)}</p>
      <ol class="options">${opts}</ol>
      ${explain}
      ${dots}
      <p class="small muted" style="margin-top:16px">Keys: A–D or 1–4 to answer · ← → to move · progress saves automatically.</p>
      <div class="actionbar"><div class="inner">
        <div class="row"><button id="prev" ${i === 0 ? "disabled" : ""}>← Back</button><a class="btn" href="#/">Save &amp; exit</a></div>
        <div class="row">${last
          ? `<button id="finish" class="primary">Finish</button>`
          : `<button id="next" class="${!practice || revealed ? "primary" : ""}">${practice && !revealed ? "Skip →" : "Next →"}</button>`}</div>
      </div></div>
    `);

    const move = (to) => { a.current = Math.max(0, Math.min(a.refs.length - 1, to)); save(); viewQuiz(id); };
    const choose = (orig) => {
      if (revealed) return;
      a.answers[i] = orig;
      save();
      viewQuiz(id);
      if (practice) $(".explain")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    const finish = () => {
      const missing = a.refs.length - Object.keys(a.answers).length;
      if (missing && !confirm(`${missing} question${missing > 1 ? "s are" : " is"} unanswered and will count as wrong. Finish anyway?`)) return;
      finishAttempt(a);
    };
    $$(".option").forEach((b) => (b.onclick = () => choose(Number(b.dataset.orig))));
    $$("[data-jump]").forEach((b) => (b.onclick = () => move(Number(b.dataset.jump))));
    $("#prev").onclick = () => move(i - 1);
    if ($("#next")) $("#next").onclick = () => move(i + 1);
    if ($("#finish")) $("#finish").onclick = finish;

    if (cleanup) cleanup();
    onKey((e) => {
      const k = e.key.toUpperCase();
      const idx = "ABCDEF".indexOf(k) >= 0 ? "ABCDEF".indexOf(k) : "123456".indexOf(k);
      if (k.length === 1 && idx >= 0 && idx < order.length) choose(order[idx]);
      else if (e.key === "ArrowRight" || (e.key === "Enter" && !e.target.closest("button, a"))) { e.preventDefault(); last ? finish() : move(i + 1); }
      else if (e.key === "ArrowLeft") move(i - 1);
    });
  }
  // After removing question `removed`, shift later answers down by one.
  function remapAnswers(a, removed) {
    const next = {};
    for (const [k, v] of Object.entries(a.answers)) {
      const n = Number(k);
      if (n < removed) next[n] = v;
      else if (n > removed) next[n - 1] = v;
    }
    a.answers = next;
    a.current = Math.min(a.current, Math.max(0, a.refs.length - 1));
  }

  function viewResults(id) {
    const a = state.attempts[id];
    if (!a) return notFound();
    if (!a.finishedAt) return go(`#/quiz/${id}`);
    const s = score(a);
    const p = pct(s.correct, s.total);
    const missed = missedRefs(a);
    const existingDeck = a.deckId && state.decks[a.deckId];

    const domains = Object.entries(s.byDomain).map(([d, v]) => `
      <div class="bar-row"><span>${esc(domainName(d))}</span><span class="small muted">${v.correct}/${v.total} · ${pct(v.correct, v.total)}%</span>
      <div class="progress"><span style="width:${pct(v.correct, v.total)}%"></span></div></div>`).join("");

    const review = a.refs.map((r, i) => {
      const item = getQ(r);
      if (!item) return "";
      const { q } = item;
      const order = a.orders[i];
      const chosen = a.answers[i];
      const ok = chosen === q.answer;
      const letter = (orig) => LETTERS[order.indexOf(orig)];
      return `<details class="review" ${ok ? "" : "open"}>
        <summary><span class="mark ${ok ? "good" : "bad"}">${ok ? "✓" : "✗"}</span><span><strong>${i + 1}.</strong> ${fmt(q.q)}</span></summary>
        <div class="body">
          ${chosen === undefined ? '<p class="muted">Not answered.</p>' : ok ? "" : `<p><span class="chip bad">Your answer</span> ${letter(chosen)}. ${fmt(q.options[chosen])}</p>`}
          <p><span class="chip good">Correct</span> ${letter(q.answer)}. ${fmt(q.options[q.answer])}</p>
          <p class="muted small">${fmt(q.explanation)}</p>
          <span class="chip">${esc(domainName(q.domain))}</span>
        </div></details>`;
    }).join("");

    render(`
      <h1>${esc(a.title)} — results</h1>
      <div class="grid2">
        <div class="stat"><b>${p}%</b><span class="muted small">${s.correct} of ${s.total} correct</span></div>
        <div class="stat"><b>${Math.max(1, Math.round((a.finishedAt - a.startedAt) / 60000))} min</b><span class="muted small">${a.mode === "exam" ? "Exam" : "Practice"} mode</span></div>
      </div>
      <div class="section row">
        ${existingDeck
          ? `<a class="btn primary" href="#/cards/${existingDeck.id}">Study flashcards (${existingDeck.cards.length})</a>`
          : `<button id="mkdeck" class="primary" ${missed.length ? "" : "disabled"}>Make flashcards from ${missed.length} missed</button>`}
        <button id="retry-missed" ${missed.length ? "" : "disabled"}>Retry missed</button>
        <button id="retake">Retake all</button>
        <a class="btn" href="#/">Home</a>
      </div>
      <div class="section"><h2>By domain</h2><div class="card">${domains}</div></div>
      <div class="section"><h2>Review</h2>${review}</div>
    `);

    if ($("#mkdeck")) $("#mkdeck").onclick = () => {
      const deck = createDeck(`Missed: ${a.title} (${new Date(a.finishedAt).toLocaleDateString()})`, missed);
      if (deck) { a.deckId = deck.id; save(); }
    };
    $("#retry-missed").onclick = () => startAttempt({ title: `${a.title} — missed`, refs: missed, mode: a.mode, shuffleQuestions: true });
    $("#retake").onclick = () => startAttempt({ title: a.title, quizId: a.quizId, refs: a.refs, mode: a.mode });
  }

  function viewBuild() {
    const quizList = [...quizzes.values()];
    const domainsPresent = [...new Set([...qIndex.values()].map((x) => x.q.domain))];
    render(`
      <h1>Build a custom quiz</h1>
      <p class="muted">Mix questions from any loaded quiz. Filters combine.</p>
      <form id="build">
        <fieldset><legend>Domains</legend>
          ${domainsPresent.map((d) => `<label class="check"><input type="checkbox" name="domain" value="${esc(d)}" checked> ${esc(domainName(d))}</label>`).join("")}
        </fieldset>
        <fieldset><legend>Source quizzes</legend>
          ${quizList.map((q) => `<label class="check"><input type="checkbox" name="quiz" value="${esc(q.id)}" checked> ${esc(q.title)}</label>`).join("")}
        </fieldset>
        <fieldset><legend>Which questions</legend>
          <label class="check"><input type="radio" name="filter" value="all" checked> Any</label>
          <label class="check"><input type="radio" name="filter" value="unseen"> Never answered</label>
          <label class="check"><input type="radio" name="filter" value="missed"> Missed last time</label>
          <label class="check"><input type="radio" name="filter" value="weak"> Below 70% accuracy</label>
        </fieldset>
        <fieldset><legend>Setup</legend>
          <label>Number of questions <input type="number" name="count" min="1" value="15" inputmode="numeric"></label>
          <label class="check"><input type="radio" name="mode" value="practice" ${state.settings.mode === "practice" ? "checked" : ""}> Practice (instant feedback)</label>
          <label class="check"><input type="radio" name="mode" value="exam" ${state.settings.mode === "exam" ? "checked" : ""}> Exam (feedback at the end)</label>
        </fieldset>
        <p id="match" class="muted"></p>
        <button class="primary" type="submit">Start quiz</button>
      </form>
    `);
    const form = $("#build");
    const pick = () => {
      const fd = new FormData(form);
      const doms = new Set(fd.getAll("domain"));
      const qs = new Set(fd.getAll("quiz"));
      const filter = fd.get("filter");
      return [...qIndex.entries()].filter(([r, { quiz, q }]) => {
        if (!doms.has(q.domain) || !qs.has(quiz.id)) return false;
        const s = state.stats[r];
        if (filter === "unseen") return !s;
        if (filter === "missed") return s && s.last === false;
        if (filter === "weak") return s && s.correct / s.seen < 0.7;
        return true;
      }).map(([r]) => r);
    };
    const update = () => { $("#match").textContent = `${pick().length} questions match.`; };
    form.addEventListener("change", update);
    update();
    form.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const n = Math.max(1, Number(fd.get("count")) || 15);
      startAttempt({ title: "Custom quiz", refs: shuffle(pick()).slice(0, n), mode: fd.get("mode") });
    };
  }

  function viewDecks() {
    const decks = Object.values(state.decks).sort((a, b) => b.created - a.created);
    const missed = everMissed();
    const domainsPresent = [...new Set([...qIndex.values()].map((x) => x.q.domain))];
    const html = decks.map((d) => {
      const live = d.cards.filter((c) => getQ(c.ref));
      const mastered = live.filter((c) => c.box >= MASTERED_BOX).length;
      const boxes = [1, 2, 3, 4, 5].map((b) => `<span class="chip ${b === 5 ? "good" : ""}">${b === 5 ? "Mastered" : "Box " + b}: ${live.filter((c) => Math.min(c.box, 5) === b).length}</span>`).join("");
      return `<div class="card">
        <h3>${esc(d.title)}</h3>
        <p class="muted small">${live.length} cards · ${mastered} mastered</p>
        <div class="progress" style="margin-bottom:10px"><span style="width:${pct(mastered, live.length)}%"></span></div>
        <div class="boxes" style="margin-bottom:10px">${boxes}</div>
        <div class="row"><a class="btn primary" href="#/cards/${d.id}">Study</a><button class="linklike danger" data-del="${d.id}">Delete</button></div>
      </div>`;
    }).join("");
    render(`
      <h1>Flashcards</h1>
      <p class="muted">Decks are built from questions you missed. “Got it” moves a card up a box; “Again” sends it back to box 1. Cards reaching box 5 are mastered.</p>
      <div class="card stack">
        <h3>New deck</h3>
        <div class="row"><button id="from-missed" class="primary" ${missed.length ? "" : "disabled"}>From all missed questions (${missed.length})</button></div>
        <div class="row"><select id="dom" aria-label="Domain">${domainsPresent.map((d) => `<option value="${esc(d)}">${esc(domainName(d))}</option>`).join("")}</select>
          <button id="from-domain">Whole domain</button></div>
      </div>
      <div class="section">${html || '<p class="muted">No decks yet. Finish a quiz and choose “Make flashcards”.</p>'}</div>
    `);
    $("#from-missed").onclick = () => createDeck(`All missed (${new Date().toLocaleDateString()})`, missed);
    $("#from-domain").onclick = () => {
      const d = $("#dom").value;
      createDeck(domainName(d), [...qIndex.entries()].filter(([, x]) => x.q.domain === d).map(([r]) => r));
    };
    $$("[data-del]").forEach((b) => (b.onclick = () => {
      if (!confirm("Delete this deck?")) return;
      delete state.decks[b.dataset.del];
      for (const a of Object.values(state.attempts)) if (a.deckId === b.dataset.del) delete a.deckId;
      save();
      route();
    }));
  }

  function viewStudy(id) {
    const deck = state.decks[id];
    if (!deck) return notFound();
    const cards = deck.cards.filter((c) => getQ(c.ref));
    const byBox = (list) => [1, 2, 3, 4].flatMap((b) => shuffle(list.filter((c) => c.box === b)));
    let queue = byBox(cards.filter((c) => c.box < MASTERED_BOX));
    let done = 0, flipped = false;

    const show = () => {
      if (cleanup) cleanup();
      if (!queue.length) {
        const mastered = cards.filter((c) => c.box >= MASTERED_BOX).length;
        render(`<h1>${esc(deck.title)}</h1>
          <div class="card"><h2>${cards.length && mastered === cards.length ? "Deck mastered 🎉" : "Session complete"}</h2>
          <p class="muted">${done} cards reviewed · ${mastered}/${cards.length} mastered.</p>
          <div class="row"><button id="again-all" class="primary">Study all cards again</button>
          <button id="reset">Reset deck to box 1</button><a class="btn" href="#/cards">All decks</a></div></div>`);
        $("#again-all").onclick = () => { queue = shuffle(cards); done = 0; show(); };
        $("#reset").onclick = () => { if (confirm("Move every card back to box 1?")) { cards.forEach((c) => (c.box = 1)); save(); queue = shuffle(cards); done = 0; show(); } };
        return;
      }
      flipped = false;
      const card = queue[0];
      const { q } = getQ(card.ref);
      render(`
        <div class="row spread small muted"><a href="#/cards">← Decks</a><span>${esc(deck.title)}</span></div>
        <div class="row spread" style="margin-top:10px"><span class="chip">${esc(domainName(q.domain))}</span><span class="small muted">${queue.length} left · box ${Math.min(card.box, 5)}</span></div>
        <div class="flash" id="flash" role="button" tabindex="0" aria-label="Flip card">
          <div class="flash-inner">
            <div class="face front"><div class="label">Question</div><div>${fmt(q.q)}</div><div class="hint">Tap or press Space to reveal</div></div>
            <div class="face back"><div class="label">Answer</div><p><strong>${fmt(q.options[q.answer])}</strong></p><p class="muted">${fmt(q.explanation)}</p></div>
          </div>
        </div>
        <div class="actionbar"><div class="inner">
          <button id="again" disabled>✗ Again</button>
          <button id="flip">Flip</button>
          <button id="got" class="primary" disabled>✓ Got it</button>
        </div></div>
      `);
      const flash = $("#flash");
      const fitHeight = () => {
        const h = Math.max(300, ...$$(".face", flash).map((f) => f.scrollHeight));
        flash.style.minHeight = $(".flash-inner", flash).style.minHeight = h + "px";
      };
      fitHeight();
      const flip = () => {
        flipped = !flipped;
        flash.classList.toggle("flipped", flipped);
        $("#again").disabled = $("#got").disabled = false;
      };
      const grade = (good) => {
        if (!$("#got") || $("#got").disabled) return;
        card.box = good ? Math.min(card.box + 1, MASTERED_BOX) : 1;
        save();
        queue.shift();
        done++;
        if (!good) queue.push(card);
        show();
      };
      flash.onclick = flip;
      $("#flip").onclick = flip;
      $("#again").onclick = () => grade(false);
      $("#got").onclick = () => grade(true);
      onKey((e) => {
        if ((e.key === " " || e.key === "Enter") && !e.target.closest("button, a")) { e.preventDefault(); flip(); }
        else if (e.key === "1" || e.key === "ArrowLeft") grade(false);
        else if (e.key === "2" || e.key === "ArrowRight") grade(true);
      });
    };
    show();
  }

  const QUIZ_PROMPT = `Write a new practice quiz for the Claude Certified Architect – Foundations exam.

Return ONLY a JSON object in this exact shape (no prose, no code fences):
{
  "id": "short-kebab-id",
  "title": "Quiz title",
  "description": "One sentence.",
  "questions": [
    {
      "id": "q1",
      "domain": "agentic | tools | claude-code | prompting | context",
      "q": "Scenario-based question text. Use \`backticks\` for code.",
      "options": ["option", "option", "option", "option"],
      "answer": 0,
      "explanation": "Why the answer is right and why the tempting alternatives are wrong."
    }
  ]
}

Domains: agentic = Agentic Architecture & Orchestration; tools = Tool Design & MCP Integration; claude-code = Claude Code Configuration & Workflows; prompting = Prompt Engineering & Structured Output; context = Context Management & Reliability.

Rules:
- TOPIC_AND_COUNT
- Exactly 4 options, exactly one correct. "answer" is the 0-based index of the correct option.
- The correct answer must NOT stand out. Every option must be about the same length (within ~15%), the same grammatical form, and equally specific and complete-sounding.
- Distractors must be plausible things a practitioner might actually try, not joke answers. No "all of the above" or "none of the above".
- Don't use absolute words ("always", "never", "only") to mark wrong answers, and don't hedge the right answer with extra qualifiers or "or…" alternatives.
- Spread the correct answer evenly across positions 0–3.
- Favor realistic scenarios (customer support agents, multi-agent research, CI/CD with Claude Code, structured data extraction) over definitions.`;

  function viewManage() {
    const imported = Object.values(state.imported);
    render(`
      <h1>Manage</h1>
      <div class="card stack">
        <h2>Settings</h2>
        <label>Default mode for quizzes
          <select id="mode"><option value="practice">Practice — explanation after each answer</option><option value="exam">Exam — feedback at the end</option></select>
        </label>
      </div>

      <div class="card stack" id="add">
        <h2>Add a quiz</h2>
        <p class="muted small">Paste quiz JSON (or pick a .json file). Easiest way to make one: copy the prompt below into Claude, fill in the topic line, and paste the result here.</p>
        <details><summary><strong>Quiz-generation prompt</strong></summary>
          <label style="display:block;margin-top:10px">Topic and size
            <input type="text" id="topic" value="20 questions covering all five domains, weighted like the exam."></label>
          <pre class="prompt" id="prompt"></pre>
          <button id="copy-prompt">Copy prompt</button>
        </details>
        <textarea id="json" placeholder='{"id": "my-quiz", "title": "…", "questions": [ … ]}' aria-label="Quiz JSON"></textarea>
        <div class="row"><button id="import" class="primary">Add quiz</button><label class="btn">Choose file<input type="file" id="file" accept=".json,application/json" hidden></label></div>
        <div id="import-msg" class="small"></div>
        ${imported.length ? `<h3>Added quizzes</h3>${imported.map((q) => `<div class="row spread"><span>${esc(q.title)} <span class="muted small">(${q.questions.length} Q)</span></span>
          <div class="row"><button class="linklike" data-export="${esc(q.id)}">Export</button><button class="linklike danger" data-remove="${esc(q.id)}">Remove</button></div></div>`).join("")}` : ""}
      </div>

      <div class="card stack">
        <h2>Backup &amp; sync</h2>
        <p class="muted small">Progress is stored in this browser only. To move it between phone and computer, export here and import on the other device.</p>
        <div class="row"><button id="export">Export progress</button><label class="btn">Import progress<input type="file" id="restore" accept=".json,application/json" hidden></label>
          <button id="reset" class="danger">Reset everything</button></div>
      </div>
    `);

    $("#mode").value = state.settings.mode;
    $("#mode").onchange = (e) => { state.settings.mode = e.target.value; save(); toast("Saved"); };

    const promptText = () => QUIZ_PROMPT.replace("TOPIC_AND_COUNT", $("#topic").value.trim() || "20 questions covering all five domains.");
    const refreshPrompt = () => { $("#prompt").textContent = promptText(); };
    $("#topic").oninput = refreshPrompt;
    refreshPrompt();
    $("#copy-prompt").onclick = () => copy(promptText());

    const msg = (html, ok) => { $("#import-msg").innerHTML = `<div class="explain ${ok ? "good" : "bad"}">${html}</div>`; };
    const importText = (text) => {
      let raw;
      try { raw = JSON.parse(text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "")); }
      catch (e) { return msg(`Not valid JSON: ${esc(e.message)}`, false); }
      const { quiz, errors, warnings } = normalizeQuiz(raw);
      if (!quiz) return msg(`<strong>Couldn't add quiz:</strong><ul>${errors.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`, false);
      if (quizzes.has(quiz.id) && quizzes.get(quiz.id).source === "built-in") quiz.id += "-custom";
      if (state.imported[quiz.id] && !confirm(`Replace the existing quiz "${state.imported[quiz.id].title}"?`)) return;
      removeQuiz(quiz.id);
      state.imported[quiz.id] = quiz;
      addQuiz(quiz, "imported");
      save();
      viewManage();
      msg(`Added “${esc(quiz.title)}” with ${quiz.questions.length} questions. <a href="#/">Go to quizzes</a>${warnings.length ? `<br><span class="muted">Warnings:</span><ul>${warnings.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}`, true);
    };
    $("#import").onclick = () => importText($("#json").value);
    $("#file").onchange = async (e) => { const f = e.target.files[0]; if (f) importText(await f.text()); };
    $$("[data-remove]").forEach((b) => (b.onclick = () => {
      if (!confirm("Remove this quiz? Its questions disappear from decks and history.")) return;
      delete state.imported[b.dataset.remove];
      removeQuiz(b.dataset.remove);
      save();
      viewManage();
    }));
    $$("[data-export]").forEach((b) => (b.onclick = () => {
      const q = state.imported[b.dataset.export];
      download(`${q.id}.json`, JSON.stringify(q, null, 2));
    }));

    $("#export").onclick = () => download(`architect-prep-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: STORE_KEY, exported: new Date().toISOString(), state }, null, 2));
    $("#restore").onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (data.app !== STORE_KEY || !data.state) throw new Error("Not a backup from this app");
        if (!confirm("Replace all progress on this device with the backup?")) return;
        for (const id of Object.keys(state.imported)) removeQuiz(id);
        state = { ...defaults(), ...data.state };
        loadImported();
        save();
        toast("Progress restored");
        viewManage();
      } catch (err) { toast(`Import failed: ${err.message}`); }
    };
    $("#reset").onclick = () => {
      if (!confirm("Delete all progress, decks and added quizzes on this device?")) return;
      for (const id of Object.keys(state.imported)) removeQuiz(id);
      state = defaults();
      save();
      toast("Everything reset");
      viewManage();
    };
  }

  function notFound() {
    render(`<h1>Not found</h1><p class="muted">That page doesn't exist anymore.</p><a class="btn primary" href="#/">Home</a>`);
  }

  /* ---------- router ---------- */

  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    const [, view, id] = (location.hash.replace(/^#\/?/, "") || "").match(/^([^/]*)\/?(.*)$/) || [];
    const section = { "": "home", quiz: "home", results: "home", build: "build", cards: "cards", manage: "manage" }[view] || "home";
    $$("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === section));
    switch (view) {
      case "": return viewHome();
      case "quiz": return viewQuiz(id);
      case "results": return viewResults(id);
      case "build": return viewBuild();
      case "cards": return id ? viewStudy(id) : viewDecks();
      case "manage": return viewManage();
      default: return notFound();
    }
  }

  function loadImported() {
    for (const raw of Object.values(state.imported)) {
      const { quiz } = normalizeQuiz(raw);
      if (quiz) addQuiz(quiz, "imported");
    }
  }

  function loadQuizFiles() {
    const files = window.QUIZ_FILES || [];
    return Promise.all(files.map((f) => new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = `quizzes/${f}`;
      s.async = false; // execute in manifest order
      s.onload = resolve;
      s.onerror = () => { console.error(`Failed to load quizzes/${f}`); resolve(); };
      document.body.appendChild(s);
    })));
  }

  loadQuizFiles().then(() => {
    loadImported();
    window.addEventListener("hashchange", route);
    route();
  });
})();
