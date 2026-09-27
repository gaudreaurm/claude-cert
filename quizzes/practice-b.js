// Practice Set B — mixed domains. See docs/ADDING_QUIZZES.md for the format.
registerQuiz({
  id: "practice-b",
  title: "Practice Set B",
  description: "Scenario questions across all five exam domains.",
  questions: [
    {
      id: "b01",
      domain: "agentic",
      q: "In the Claude Agent SDK, a coordinator agent never spawns the subagents you defined for it. What is the most likely configuration problem?",
      options: [
        "The subagents were defined in a different file from the coordinator's own definition",
        "The coordinator's `allowedTools` does not include `Task`, the tool used to spawn subagents",
        "The coordinator's system prompt does not list each subagent's name and description",
        "The coordinator was not given a model at least as capable as the subagents' models"
      ],
      answer: 1,
      explanation: "Subagents are invoked through the Task tool, so a coordinator can only delegate if `Task` is in its `allowedTools`."
    },
    {
      id: "b02",
      domain: "agentic",
      q: "A coordinator must run four independent research subagents. How should it invoke them to get them running in parallel?",
      options: [
        "Emit one Task call per turn, starting the next only after the previous result returns",
        "Ask a single subagent to handle all four topics and split its own work into threads",
        "Emit all four Task tool calls in a single response so they can execute concurrently",
        "Write the four tasks to a shared file that each subagent polls for new assignments"
      ],
      answer: 2,
      explanation: "Multiple tool calls in one assistant response can be executed in parallel. Emitting them across separate turns serializes the work."
    },
    {
      id: "b03",
      domain: "agentic",
      q: "After a long session analyzing a codebase, you want to try two different refactoring strategies from that same analyzed starting point without them interfering. What should you use?",
      options: [
        "`fork_session`, creating two branches that each start from the shared analysis",
        "`--resume` on the same session twice, one strategy after the other in sequence",
        "Two brand-new sessions, each re-running the full analysis before refactoring",
        "`/compact` first, then try both strategies one after another in the same session"
      ],
      answer: 0,
      explanation: "Forking creates independent branches from a shared baseline, so each approach keeps the analysis without inheriting the other's edits and reasoning."
    },
    {
      id: "b04",
      domain: "agentic",
      q: "You resume yesterday's session, but several files it analyzed have since been rewritten. The agent now gives answers based on the old code. What is the best approach?",
      options: [
        "Keep resuming the session and ask the agent to be careful about possibly outdated data",
        "Resume the session and run `/compact` so the stale tool results are summarized away",
        "Resume the session with a higher-capacity model that can spot which results are stale",
        "Start a new session seeded with a structured summary of the earlier session's findings"
      ],
      answer: 3,
      explanation: "Resumed sessions carry stale tool results. Either start a new session seeded with a structured summary, or explicitly tell the resumed agent which files changed so it re-analyzes them."
    },
    {
      id: "b05",
      domain: "prompting",
      q: "A single-pass review of a 30-file pull request gives detailed notes on some files, shallow notes on others, and misses cross-file bugs. What is the best redesign?",
      options: [
        "Move to a model with a larger context window so all 30 files get full attention at once",
        "Review each file in its own pass, then run a separate pass focused on cross-file issues",
        "Run the same single-pass review three times and keep only findings that appear twice",
        "Require developers to split pull requests so that none of them exceeds ten files"
      ],
      answer: 1,
      explanation: "Large single-pass reviews dilute attention. Per-file local passes plus a dedicated integration pass give consistent depth and still catch cross-file data-flow issues."
    },
    {
      id: "b06",
      domain: "agentic",
      q: "You ask an agent to \"add comprehensive tests to this legacy codebase.\" Which decomposition strategy fits best?",
      options: [
        "A fixed pipeline that writes tests for every file in alphabetical order, one per step",
        "One prompt that asks for all the tests at once so nothing is overlooked between steps",
        "Map the codebase first, rank high-impact areas, then adapt the plan as findings emerge",
        "A fixed pipeline that runs linting, then type checks, then writes unit tests for each"
      ],
      answer: 2,
      explanation: "Open-ended investigative tasks benefit from dynamic decomposition that adapts to what is discovered. Fixed prompt chains fit predictable, well-defined multi-step work."
    },
    {
      id: "b07",
      domain: "tools",
      q: "A document pipeline has three extraction tools, one per document type, and the type isn't known in advance. Sometimes the model replies with plain text instead of calling any tool. Which `tool_choice` setting fixes this?",
      options: [
        "`\"auto\"`, which lets the model decide when calling a tool is actually useful",
        "`\"none\"`, combined with a prompt that asks for the answer inside a JSON block",
        "A forced tool (`{\"type\": \"tool\", \"name\": ...}`) naming the first extraction tool",
        "`\"any\"`, which requires a tool call but lets the model choose which one"
      ],
      answer: 3,
      explanation: "`any` guarantees a tool call while leaving the choice of tool to the model. `auto` allows text replies; forcing one named tool would break for the other document types."
    },
    {
      id: "b08",
      domain: "tools",
      q: "A workflow must always call `extract_metadata` before any enrichment tools run. How do you guarantee that ordering?",
      options: [
        "Force `extract_metadata` via `tool_choice` on the first call, then run later steps in follow-up turns",
        "State in the system prompt that `extract_metadata` must always be called before anything else",
        "List `extract_metadata` first in the tools array, since the model tends to prefer earlier tools",
        "Set `tool_choice` to `\"any\"` on the first call so that some extraction tool always runs first"
      ],
      answer: 0,
      explanation: "Forcing a specific tool with `{\"type\": \"tool\", \"name\": \"extract_metadata\"}` guarantees it runs first. Prompt instructions and tool ordering are only soft influences."
    },
    {
      id: "b09",
      domain: "tools",
      q: "In Claude Code, which built-in tool is the right choice for finding every place that calls `processRefund` across the codebase?",
      options: [
        "Glob, since it matches file paths across every directory in the project",
        "Grep, since it searches file contents for a pattern across the codebase",
        "Read, applied to each source file in turn until all the callers are found",
        "Bash running `ls -R`, then reading any file whose name mentions refunds"
      ],
      answer: 1,
      explanation: "Grep searches file contents (function names, error strings, imports). Glob matches file names and paths, e.g. `**/*.test.tsx`."
    },
    {
      id: "b10",
      domain: "tools",
      q: "Claude Code's Edit tool fails because the text it is replacing appears several times in the file. What is the right recovery?",
      options: [
        "Retry the identical Edit call, since the match is resolved on a second attempt",
        "Delete the file and ask the user to recreate it with the intended change applied",
        "Retarget the edit with a longer snippet, including nearby lines, that is unique in the file",
        "Switch to editing the file through a shell `sed` command with a global replace"
      ],
      answer: 2,
      explanation: "Edit needs a unique anchor. Include enough surrounding lines to make it unique, or read the full file and write back the modified content."
    },
    {
      id: "b11",
      domain: "tools",
      q: "Your MCP server has a catalog of database schemas and internal docs that agents keep discovering through many exploratory tool calls. How should this content be exposed instead?",
      options: [
        "As one large tool that returns the full catalog every time it is called",
        "As a system prompt appendix pasted into each agent at conversation start",
        "As a set of prompts the user must choose from before the session begins",
        "As MCP resources, so agents can see what content exists without probing"
      ],
      answer: 3,
      explanation: "MCP resources expose content catalogs (schemas, documentation, issue summaries) that agents can browse directly, reducing exploratory tool calls. Tools are for actions."
    },
    {
      id: "b12",
      domain: "context",
      q: "A search subagent returns an empty list both when a query genuinely matches nothing and when the search service times out. Why is this a problem for the coordinator?",
      options: [
        "The coordinator can't tell a failure from \"no data exists,\" so it can't choose to retry",
        "Empty lists use more tokens than error messages, which fills the coordinator's context",
        "The coordinator will retry every empty result indefinitely and never finish the task",
        "Subagents are not allowed to return empty lists, so the Task call itself will fail"
      ],
      answer: 0,
      explanation: "Distinguish access failures from valid empty results. With structured error context the coordinator can retry, try alternatives, or report a coverage gap instead of treating a failure as a finding."
    },
    {
      id: "b13",
      domain: "claude-code",
      q: "You built a `/review` slash command that the whole team should get automatically when they clone the repo. Where does it go?",
      options: [
        "`~/.claude/commands/review.md` on each developer's machine",
        "`.claude/commands/review.md` committed to the project repository",
        "A `## Commands` section inside the project's root CLAUDE.md file",
        "`.mcp.json`, registered as a prompt exposed by a local MCP server"
      ],
      answer: 1,
      explanation: "Project commands in `.claude/commands/` are shared through version control. `~/.claude/commands/` is personal."
    },
    {
      id: "b14",
      domain: "claude-code",
      q: "A skill runs a verbose codebase analysis whose output clutters the main conversation. Which SKILL.md frontmatter setting keeps that output isolated?",
      options: [
        "`allowed-tools`, limited to read-only tools so the output stays short",
        "`argument-hint`, so the skill asks for a narrower scope before running",
        "`context: fork`, so the skill runs in its own isolated sub-agent context",
        "`model`, pointed at a smaller model that produces more concise output"
      ],
      answer: 2,
      explanation: "`context: fork` runs the skill in a separate sub-agent context so only its result returns to the main session. `allowed-tools` restricts tool access; `argument-hint` prompts for arguments."
    },
    {
      id: "b15",
      domain: "claude-code",
      q: "Claude Code doesn't seem to be following instructions you added to a CLAUDE.md file. What is the quickest way to check which memory files are actually loaded?",
      options: [
        "Run `claude --debug` and search the log output for any CLAUDE.md references",
        "Ask Claude to repeat its system prompt word for word and look for the text",
        "Delete the other CLAUDE.md files one at a time until the behavior changes",
        "Run the `/memory` command, which shows the memory files loaded in the session"
      ],
      answer: 3,
      explanation: "`/memory` lists and opens the loaded memory files, which quickly reveals scope problems such as instructions in the wrong CLAUDE.md."
    },
    {
      id: "b16",
      domain: "claude-code",
      q: "Your project CLAUDE.md has grown to 900 lines covering testing, API conventions, and deployment. How should you reorganize it?",
      options: [
        "Split it into focused topic files and pull each one into CLAUDE.md with `@path` imports",
        "Move all of it into `~/.claude/CLAUDE.md` so it loads only for the maintainers",
        "Compress it into one dense paragraph so it uses fewer tokens in every session",
        "Delete everything except the testing rules, since those are enforced most often"
      ],
      answer: 0,
      explanation: "Modular organization — `@import` of focused files or topic-specific files in `.claude/rules/` — keeps instructions maintainable and, with path scoping, loads them only when relevant."
    },
    {
      id: "b17",
      domain: "claude-code",
      q: "A CI step has Claude generate code and then asks the same session to review that code. The review rarely finds problems. Why, and what should you change?",
      options: [
        "The review prompt is too short; add a detailed checklist to the same session",
        "The session keeps its own reasoning; use a separate, independent instance to review",
        "Reviews need a higher temperature; raise it for the review step only",
        "The code is fine; a low finding rate means the generator is working well"
      ],
      answer: 1,
      explanation: "A model reviewing its own output in the same context is biased by the reasoning that produced it. An independent instance without that context is more effective."
    },
    {
      id: "b18",
      domain: "prompting",
      q: "An extraction's line items don't add up to the stated total. What should the retry request include to maximize the chance of a correct second attempt?",
      options: [
        "Only the original document, with a reminder to be more accurate this time",
        "The failed extraction alone, with an instruction to correct it where needed",
        "The original document, the failed extraction, and the specific validation error",
        "A request to extract only the total, skipping the line items for this document"
      ],
      answer: 2,
      explanation: "Retry-with-feedback works best when the model sees the source, its prior output, and exactly what failed. Note that retries can't fix information that is absent from the source."
    },
    {
      id: "b19",
      domain: "prompting",
      q: "When are few-shot examples most valuable in a prompt?",
      options: [
        "When the task is simple and you want to reduce the number of tokens per request",
        "When you want the model to produce a wider variety of creative, unexpected output",
        "When a model upgrade is scheduled and the prompt must work with any future model",
        "When instructions alone give inconsistent results on ambiguous cases the examples cover"
      ],
      answer: 3,
      explanation: "Few-shot examples show how to handle ambiguous cases and in what format, ideally with the reasoning for choosing one action over plausible alternatives, so the model can generalize the judgment."
    },
    {
      id: "b20",
      domain: "context",
      q: "Deep into a long codebase exploration, the agent starts describing \"typical patterns\" instead of the specific classes it found earlier. What helps most?",
      options: [
        "Move exploration into subagents and record the key findings in a scratchpad file as you go",
        "Ask the agent to be more specific and to re-read all previous messages before answering",
        "Restart the exploration from scratch with the same approach, but more quickly this time",
        "Add a rule to CLAUDE.md telling the agent never to use the phrase \"typical patterns\""
      ],
      answer: 0,
      explanation: "Context degradation in long sessions is managed by isolating verbose exploration in subagents, persisting findings outside the context (scratchpad files), and compacting."
    }
  ]
});
