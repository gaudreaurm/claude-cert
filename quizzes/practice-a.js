// Practice Set A — mixed domains. See docs/ADDING_QUIZZES.md for the format.
// Option order here does not matter: the app re-shuffles every attempt so the
// correct answer lands evenly on A–D.
registerQuiz({
  id: "practice-a",
  title: "Practice Set A",
  description: "Scenario questions across all five exam domains.",
  questions: [
    {
      id: "a01",
      domain: "agentic",
      q: "Your agent loop receives a response whose `stop_reason` is `\"tool_use\"`. What should your code do next?",
      options: [
        "Run the requested tools, append their `tool_result` blocks in a user message, and call the API again",
        "Return the assistant's text to the user, since a tool request marks the end of the model's turn and nothing else follows",
        "Scan the assistant's text for a completion phrase such as \"DONE\" and continue only if it is missing",
        "Increment an iteration counter and stop once it reaches a fixed limit, ignoring the stop reason"
      ],
      answer: 0,
      explanation: "The loop continues while `stop_reason` is `tool_use` and ends on `end_turn`. Parsing natural-language completion signals or using an iteration cap as the primary stop condition are anti-patterns (a cap is fine only as a safety net)."
    },
    {
      id: "a02",
      domain: "agentic",
      q: "A coordinator agent delegates a literature search to a subagent. The subagent's results ignore constraints the user stated earlier in the coordinator's conversation. What is the most likely cause?",
      options: [
        "The subagent's model tier is too small to follow multi-part constraints reliably",
        "Subagents do not inherit the coordinator's history, so the constraints were never passed in its prompt",
        "The subagent received the constraints, but its sampling temperature was set far too low to apply them all",
        "Shared memory between the agents was truncated because the coordinator's context was nearly full"
      ],
      answer: 1,
      explanation: "Subagents run with isolated context. Anything they need — user constraints, prior findings, output format — must be passed explicitly in the prompt the coordinator writes for them."
    },
    {
      id: "a03",
      domain: "agentic",
      q: "Refunds above $500 must never be issued without human approval. The system prompt states this rule, yet logs show the agent violates it in about 3% of cases. What is the best fix?",
      options: [
        "Rewrite the rule in capital letters and move it to the very top of the system prompt",
        "Add several few-shot examples to the prompt showing the agent declining refunds above the threshold",
        "Intercept refund tool calls with a hook that blocks amounts over $500 and routes them to a human",
        "Lower the sampling temperature so the agent follows system prompt rules more consistently"
      ],
      answer: 2,
      explanation: "Prompts are probabilistic. When a business rule must hold every time, enforce it deterministically — e.g. a PreToolUse hook or tool-side check that blocks the call and triggers escalation."
    },
    {
      id: "a04",
      domain: "tools",
      q: "An agent keeps calling `get_customer` when it should call `lookup_order`. Both tools have one-line descriptions (\"Retrieves customer info\" / \"Retrieves order info\"). What is the most effective first step?",
      options: [
        "Merge both tools into a single `lookup` tool that accepts a free-form query string",
        "Add a separate classifier model that picks the correct tool before each agent turn",
        "Rename both tools with longer, more specific names that spell out exactly which records each one returns",
        "Expand both descriptions with accepted inputs, example queries, and when to use each over the other"
      ],
      answer: 3,
      explanation: "Tool descriptions are the main signal the model uses for tool selection. Richer descriptions (inputs, examples, boundaries versus similar tools) are low-effort and high-leverage, so they come before architectural changes."
    },
    {
      id: "a05",
      domain: "tools",
      q: "A tool's call to an upstream API times out. What should the tool return to the agent?",
      options: [
        "A structured error result marking the failure as transient and retryable, with a short reason",
        "An empty result list, so the agent can continue working on its task without being interrupted by the failure",
        "A generic \"operation failed\" message, so internal details of the upstream API are not exposed",
        "Nothing — raise an exception so the process stops before the agent acts on incomplete data"
      ],
      answer: 0,
      explanation: "Structured errors (e.g. `isError`, error category such as transient, `isRetryable`) let the agent decide whether to retry, try another approach, or escalate. Empty results disguise a failure as \"no data exists\"."
    },
    {
      id: "a06",
      domain: "tools",
      q: "Your team wants every developer to get the same GitHub MCP server when they open the repo in Claude Code, without committing anyone's token. Where should the server be configured?",
      options: [
        "In each developer's `~/.claude.json`, with setup steps documented in the README",
        "In a project `.mcp.json` committed to the repo, using `${GITHUB_TOKEN}` env var expansion",
        "In the project CLAUDE.md, listing the server's launch command and asking Claude to start it",
        "In a project `.mcp.json` committed to the repo, with a shared read-only token inline"
      ],
      answer: 1,
      explanation: "Project-scoped `.mcp.json` is shared through version control; environment variable expansion keeps secrets out of the repo. `~/.claude.json` is user-scoped and not shared."
    },
    {
      id: "a07",
      domain: "claude-code",
      q: "A new teammate reports that Claude Code ignores the team's coding standards. The standards live in the tech lead's `~/.claude/CLAUDE.md`. What is the problem?",
      options: [
        "User-level CLAUDE.md files are only read when Claude Code is started with a special flag",
        "The standards need to be converted into a skill before Claude Code can apply them",
        "That file is user-scoped; shared standards belong in the project CLAUDE.md in the repo",
        "The teammate's own `~/.claude/CLAUDE.md` overrides and erases the project-level instructions"
      ],
      answer: 2,
      explanation: "`~/.claude/CLAUDE.md` applies only to that user on that machine. Team-wide instructions go in the project CLAUDE.md (repo root or `.claude/CLAUDE.md`), which everyone gets through version control."
    },
    {
      id: "a08",
      domain: "claude-code",
      q: "Test files matching `**/*.test.ts` are spread across dozens of directories and need specific conventions. How do you apply the conventions only when Claude edits those files?",
      options: [
        "Add a CLAUDE.md to each directory that contains tests, repeating the same conventions",
        "Put the conventions in the root CLAUDE.md so they are always loaded for every file",
        "Create a skill containing the conventions and ask developers to invoke it before editing any tests",
        "Create a file in `.claude/rules/` with `paths` frontmatter set to the `**/*.test.ts` glob"
      ],
      answer: 3,
      explanation: "Path-scoped rules in `.claude/rules/` load only when matching files are touched, which suits conventions tied to file type rather than directory. Per-directory files duplicate content; root CLAUDE.md wastes context."
    },
    {
      id: "a09",
      domain: "claude-code",
      q: "A CI job that runs Claude Code hangs indefinitely waiting for input. What fixes it?",
      options: [
        "Run it with the `-p` (print) flag so it executes the prompt non-interactively and exits",
        "Set a `CLAUDE_HEADLESS=true` environment variable in the CI job before invoking it",
        "Pipe the `yes` command into Claude Code so that each interactive prompt is confirmed automatically",
        "Add a `--batch` flag so Claude Code queues the request and polls for the result"
      ],
      answer: 0,
      explanation: "`claude -p \"...\"` (`--print`) is the documented non-interactive mode for scripts and CI. The other flags and variables are not real Claude Code options."
    },
    {
      id: "a10",
      domain: "claude-code",
      q: "Which task is the best fit for Claude Code's plan mode rather than direct execution?",
      options: [
        "Fixing a null check in one function where the stack trace points to the exact line",
        "Splitting a monolith into services, touching dozens of files with several viable designs",
        "Renaming a local variable inside a single file to match the team's naming convention",
        "Adding a missing import that the compiler's error message names along with the exact file"
      ],
      answer: 1,
      explanation: "Plan mode suits large, multi-file changes with architectural choices, where exploring before committing avoids costly rework. Small, well-specified fixes are faster with direct execution."
    },
    {
      id: "a11",
      domain: "prompting",
      q: "An automated review bot reports too many false positives. Its prompt says \"be conservative and only report high-confidence issues.\" What change is most likely to help?",
      options: [
        "Ask the model to score its confidence from 0 to 1 and drop findings that fall below 0.8",
        "Reword the instruction more forcefully, stressing that false positives are unacceptable",
        "List exactly which issue categories to report and which to skip, with an example of each",
        "Switch the bot to the largest available model so it judges issue severity more accurately"
      ],
      answer: 2,
      explanation: "Vague instructions like \"be conservative\" don't define the boundary. Explicit criteria (report bugs and security issues; skip minor style) with examples do. Self-reported confidence is poorly calibrated."
    },
    {
      id: "a12",
      domain: "prompting",
      q: "You need Claude's extraction output to always match a JSON schema so downstream code never fails to parse it. Which approach is most reliable?",
      options: [
        "Instruct the model to respond with JSON only and include the schema in the system prompt",
        "Prefill the assistant turn with an opening brace so the model continues in JSON format",
        "Parse the free-text reply with a regular expression and fill in any missing fields",
        "Define a tool whose input schema is the target schema and force it with `tool_choice`"
      ],
      answer: 3,
      explanation: "Tool use with a JSON schema (or structured outputs) constrains the response to the schema. Prompt instructions and prefill improve odds but do not guarantee syntactically valid, schema-conformant output."
    },
    {
      id: "a13",
      domain: "prompting",
      q: "An invoice extraction schema marks every field as required. For invoices missing a PO number, the model invents plausible-looking values. What is the best fix?",
      options: [
        "Make fields that may be absent nullable and instruct the model to return null when missing",
        "Add a post-processing step that deletes any PO number not found in the purchasing system",
        "Tell the model it will be penalized for guessing and must be extra careful with every single field",
        "Keep the fields required but ask the model to prefix guessed values with a warning marker"
      ],
      answer: 0,
      explanation: "Required fields pressure the model to produce something. Optional/nullable fields plus an explicit instruction to return null when the source lacks the value removes that pressure."
    },
    {
      id: "a14",
      domain: "prompting",
      q: "Which workload is the best fit for the Message Batches API?",
      options: [
        "A pre-merge check that developers wait on before their pull request can be merged",
        "Nightly summaries of 10,000 support tickets that are read the next morning",
        "A live chat assistant that must reply to customers within a few seconds",
        "An agent that needs several rounds of tool calls to finish each individual request"
      ],
      answer: 1,
      explanation: "Batches cost about 50% less but can take up to 24 hours with no latency guarantee, and each request is a single call (no mid-request tool loop). Latency-tolerant bulk jobs fit; blocking or interactive work does not."
    },
    {
      id: "a15",
      domain: "context",
      q: "In a long support conversation, older turns are summarized to save context. The agent later quotes the wrong order number and refund amount. What is the best fix?",
      options: [
        "Summarize more often so each summary covers fewer turns and loses fewer details",
        "Switch to a model with a longer context window so summarization is rarely needed",
        "Keep a structured case-facts block with IDs and amounts that is never summarized",
        "Ask the agent to re-confirm the order number and amount with the customer each turn"
      ],
      answer: 2,
      explanation: "Progressive summarization tends to lose exact values. Extract transactional facts into a persistent structured block included in every prompt, outside the summarized history."
    },
    {
      id: "a16",
      domain: "context",
      q: "A customer writes \"I want to talk to a human.\" The issue is simple and the agent could likely resolve it. What should the agent do?",
      options: [
        "Attempt the resolution first, and escalate only if the customer repeats the request",
        "Explain that the issue is simple and ask the customer to give the agent a chance first",
        "Collect every detail of the issue and try two fixes before offering a human handoff",
        "Honor the request and escalate right away, passing along a summary of the issue"
      ],
      answer: 3,
      explanation: "An explicit request for a human is an escalation trigger to honor immediately, not an obstacle to overcome. Pass a structured summary so the human doesn't start from scratch."
    },
    {
      id: "a17",
      domain: "context",
      q: "Which escalation trigger design is most reliable for a customer support agent?",
      options: [
        "Explicit criteria such as policy exceptions, customer requests, or no progress possible",
        "Escalate whenever the model rates its own confidence below 7 on a 10-point scale",
        "Escalate whenever a sentiment classifier scores the customer's message as negative",
        "Escalate automatically after a fixed number of turns pass without the case being marked closed"
      ],
      answer: 0,
      explanation: "Self-reported confidence and sentiment correlate poorly with whether escalation is actually needed. Explicit, observable criteria produce consistent behavior."
    },
    {
      id: "a18",
      domain: "agentic",
      q: "A multi-agent research system writes a report on \"AI's impact on creative industries\" that covers only visual art. Logs show the coordinator created subtasks only for painting, photography, and illustration. What is the root cause?",
      options: [
        "The search subagent wrote weak queries and missed sources on music and writing",
        "The coordinator decomposed the topic too narrowly, so other areas were never assigned",
        "The synthesis subagent dropped all of the non-visual findings while condensing the final report",
        "The coordinator's context overflowed and truncated the findings from later subagents"
      ],
      answer: 1,
      explanation: "The logs show the gap began at decomposition: no subagent was ever asked about music, film, or writing. Downstream agents did their assigned work correctly."
    },
    {
      id: "a19",
      domain: "tools",
      q: "An agent with access to 18 tools often picks the wrong one. The tools themselves work correctly. What change is most likely to improve selection?",
      options: [
        "Add a paragraph to the system prompt ranking the 18 tools from most to least important",
        "Raise the temperature so the model explores more tools before settling on one",
        "Give each agent only the handful of tools its role needs, using subagents for the rest",
        "Combine all 18 tools into one general dispatcher tool that takes an `action` parameter"
      ],
      answer: 2,
      explanation: "Large tool sets increase decision complexity. Scoping each agent to the few tools relevant to its role (and delegating other capabilities to specialized subagents) improves reliability."
    },
    {
      id: "a20",
      domain: "context",
      q: "Two credible sources report different market-size figures for the same year. How should the synthesis agent handle this in the final report?",
      options: [
        "Report the average of both figures, noting that it combines two independent estimates",
        "Report the figure from the more recent source and omit the other one to avoid confusing readers",
        "Report the figure most consistent with the rest of the report's findings and analysis",
        "Report both figures with their sources and note the discrepancy and any known reasons"
      ],
      answer: 3,
      explanation: "Conflicts between credible sources are information. Preserve both with attribution (and dates or methodology if known) instead of silently choosing or averaging."
    }
  ]
});
