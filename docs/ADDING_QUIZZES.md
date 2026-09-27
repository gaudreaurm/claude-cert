# Adding quizzes

There are two ways to add a quiz.

## 1. In the app (no code, per device)

*Manage → Add a quiz*: expand **Quiz-generation prompt**, set the topic/size line, copy it into Claude, and paste the JSON reply into the box. Imported quizzes are stored in that browser and included in progress backups. Use **Export** next to a quiz to get its JSON file.

## 2. In the repo (shared with everyone who opens the site)

1. Create `quizzes/my-quiz.js`:

   ```js
   registerQuiz({
     id: "my-quiz",                 // unique, kebab-case
     title: "My Quiz",
     description: "One sentence.",
     questions: [
       {
         id: "m01",                 // unique within the quiz; keep it stable (progress is keyed on it)
         domain: "agentic",         // agentic | tools | claude-code | prompting | context
         q: "Question text. `backticks` render as code.",
         options: ["…", "…", "…", "…"],
         answer: 2,                 // 0-based index of the correct option
         explanation: "Shown after answering and on the back of flashcards."
       }
     ]
   });
   ```

   An exported/Claude-generated JSON quiz can be turned into a file by wrapping it: `registerQuiz(<json>);`

2. Add `"my-quiz.js",` to `quizzes/manifest.js`.
3. Run `node tools/validate-quizzes.mjs` and fix any errors or warnings.

## Writing fair questions

The app shuffles options and spreads the correct answer evenly across A–D every attempt, so source order doesn't matter. What the app can't fix is an answer that gives itself away. The validator flags:

- a correct option more than 25% longer or shorter than the average distractor;
- quizzes where the correct option is noticeably the longest (or shortest) in more than 20% of questions.

Also avoid, by hand:

- a correct answer that is the only one listing several steps, or that hedges with "or…";
- absolute words ("always", "never", "only") that mark distractors as wrong;
- joke distractors, "all/none of the above".

Good distractors are things a practitioner might really try: a prompt-only fix where a deterministic one is needed, the user-scoped config where project scope is needed, a bigger model instead of a design change.
