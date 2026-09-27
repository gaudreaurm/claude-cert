#!/usr/bin/env node
// Validates every quiz file listed in quizzes/manifest.js.
// Checks structure and flags "tells": correct answers that stand out by length.
// Usage: node tools/validate-quizzes.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOMAINS = ["agentic", "tools", "claude-code", "prompting", "context"];
const LENGTH_RATIO_LIMIT = 1.25;     // correct vs. average distractor length
const STANDOUT_MARGIN = 1.08;        // "noticeably" longer/shorter than every distractor
const STANDOUT_SHARE_LIMIT = 0.2;    // max share of questions where correct stands out

const quizzes = [];
const ctx = { window: {}, registerQuiz: (q) => quizzes.push(q) };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "quizzes/manifest.js"), "utf8"), ctx);
for (const file of ctx.window.QUIZ_FILES) {
  vm.runInContext(fs.readFileSync(path.join(root, "quizzes", file), "utf8"), ctx, { filename: file });
}

let errors = 0, warnings = 0;
const err = (m) => { errors++; console.error("  ERROR " + m); };
const warn = (m) => { warnings++; console.warn("  WARN  " + m); };
const quizIds = new Set();

for (const quiz of quizzes) {
  console.log(`${quiz.id} — ${quiz.title} (${quiz.questions?.length ?? 0} questions)`);
  if (!quiz.id || !quiz.title || !Array.isArray(quiz.questions)) { err("missing id/title/questions"); continue; }
  if (quizIds.has(quiz.id)) err(`duplicate quiz id ${quiz.id}`);
  quizIds.add(quiz.id);

  const qids = new Set();
  const positions = {};
  let longest = 0, shortest = 0;
  for (const q of quiz.questions) {
    const tag = `${quiz.id}/${q.id}`;
    if (!q.id || qids.has(q.id)) err(`${tag}: missing or duplicate question id`);
    qids.add(q.id);
    if (!DOMAINS.includes(q.domain)) warn(`${tag}: unknown domain "${q.domain}"`);
    if (!q.q) err(`${tag}: missing question text`);
    if (!Array.isArray(q.options) || q.options.length < 2) { err(`${tag}: needs 2+ options`); continue; }
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) { err(`${tag}: bad answer index`); continue; }
    if (!q.explanation) warn(`${tag}: no explanation`);
    if (new Set(q.options).size !== q.options.length) err(`${tag}: duplicate options`);
    positions[q.answer] = (positions[q.answer] || 0) + 1;

    const lens = q.options.map((o) => o.length);
    const correctLen = lens[q.answer];
    const others = lens.filter((_, i) => i !== q.answer);
    const avg = others.reduce((a, b) => a + b, 0) / others.length;
    if (correctLen > avg * LENGTH_RATIO_LIMIT) warn(`${tag}: correct answer is ${(correctLen / avg).toFixed(2)}x the average distractor length`);
    if (correctLen < avg / LENGTH_RATIO_LIMIT) warn(`${tag}: correct answer is only ${(correctLen / avg).toFixed(2)}x the average distractor length`);
    if (correctLen > Math.max(...others) * STANDOUT_MARGIN) longest++;
    if (correctLen * STANDOUT_MARGIN < Math.min(...others)) shortest++;
  }
  const n = quiz.questions.length;
  console.log(`  answer positions (source order; the app rebalances per attempt): ${JSON.stringify(positions)}`);
  console.log(`  correct noticeably longest: ${longest}/${n}, noticeably shortest: ${shortest}/${n}`);
  if (n >= 5 && longest / n > STANDOUT_SHARE_LIMIT) warn(`correct answer is noticeably the longest in ${longest}/${n} questions`);
  if (n >= 5 && shortest / n > STANDOUT_SHARE_LIMIT) warn(`correct answer is noticeably the shortest in ${shortest}/${n} questions`);
}

console.log(`\n${quizzes.length} quizzes, ${errors} errors, ${warnings} warnings`);
process.exit(errors ? 1 : 0);
