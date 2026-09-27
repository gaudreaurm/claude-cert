// Practice Set C — mixed domains. See docs/ADDING_QUIZZES.md for the format.
registerQuiz({
  id: "practice-c",
  title: "Practice Set C",
  description: "Scenario questions across all five exam domains.",
  questions: [
    {
      id: "c01",
      domain: "agentic",
      q: "Three MCP tools return dates in different formats (Unix timestamps, ISO 8601, and \"MM/DD/YY\"). The agent sometimes misreads them. Where is the most reliable place to normalize the dates?",
      options: [
        "In the system prompt, with a table explaining how to read each date format",
        "In a PostToolUse hook that rewrites tool results before the model sees them",
        "In a follow-up prompt asking the agent to double-check every date it cites",
        "In a subagent whose only job is converting dates the main agent passes to it"
      ],
      answer: 1,
      explanation: "PostToolUse hooks deterministically transform tool results before the model processes them, so normalization doesn't depend on the model following instructions."
    },
    {
      id: "c02",
      domain: "agentic",
      q: "Why does a hub-and-spoke multi-agent design route all communication between subagents through the coordinator?",
      options: [
        "Subagents run on different models and cannot parse each other's output formats",
        "Direct messages between subagents are billed at a higher rate than coordinator calls",
        "It gives one place for observability, consistent error handling, and flow control",
        "The Agent SDK only allows each subagent to hold a single tool definition at a time"
      ],
      answer: 2,
      explanation: "Central routing through the coordinator makes information flow observable and error handling consistent, and lets the coordinator decide what each subagent needs."
    },
    {
      id: "c03",
      domain: "agentic",
      q: "A research coordinator gets a synthesis draft that barely covers two of the assigned subtopics. What should it do?",
      options: [
        "Ship the draft with a note saying that the coverage of two subtopics may be limited",
        "Ask the synthesis agent to expand those sections using only the model's own knowledge",
        "Restart the entire research process from scratch with a more detailed original prompt",
        "Send targeted searches for the thin subtopics, then re-run the synthesis with the results"
      ],
      answer: 3,
      explanation: "Iterative refinement: the coordinator evaluates output for gaps, re-delegates targeted work, and repeats until coverage is sufficient."
    },
    {
      id: "c04",
      domain: "agentic",
      q: "A support agent escalates a case to a human, who does not have access to the conversation transcript. What should the handoff contain?",
      options: [
        "The customer ID, the root cause found, the steps tried, and a recommended action",
        "A link to the customer's account page, where the human can review their history",
        "The customer's final message, forwarded word for word so no nuance gets lost",
        "A one-line summary of the issue, since humans prefer short escalation notes"
      ],
      answer: 0,
      explanation: "Handoffs should be structured and self-contained so the human can act without re-investigating: identifiers, root cause, what was attempted, and a recommendation."
    },
    {
      id: "c05",
      domain: "agentic",
      q: "One customer message asks for a refund, an address change, and an explanation of a charge. How should the agent approach it?",
      options: [
        "Answer the first request fully, then ask the customer to resend the other two",
        "Split it into three items, handle each (in parallel if possible), then reply once",
        "Escalate to a human, because multi-part requests exceed an agent's safe scope",
        "Pick the most urgent request and mention that the others will be handled later"
      ],
      answer: 1,
      explanation: "Decompose multi-concern requests into distinct items, investigate each using shared context, then synthesize a single, complete response."
    },
    {
      id: "c06",
      domain: "context",
      q: "An order-lookup tool returns about 200 fields per order, but the agent only ever needs 5. Over a long session, context fills up. What is the best fix?",
      options: [
        "Switch to a model with a larger context window so the full results continue to fit",
        "Summarize the whole conversation every few turns to reclaim context for new results",
        "Trim tool results down to the relevant fields before they are added to the context",
        "Tell the agent in the system prompt to ignore the fields it does not actually need"
      ],
      answer: 2,
      explanation: "Verbose tool outputs accumulate and consume context. Filter them to the fields that matter (in the tool or a PostToolUse hook) before they enter the conversation."
    },
    {
      id: "c07",
      domain: "tools",
      q: "A synthesis subagent often needs quick fact checks. Routing each one through the coordinator adds about 40% latency. What is the best design change?",
      options: [
        "Give the synthesis agent every search tool the research subagents already use",
        "Remove fact checking from the synthesis step so it can finish more quickly",
        "Cache every fact the research subagents found so synthesis never needs to ask",
        "Give it a scoped `verify_fact` tool for simple checks; route complex ones as before"
      ],
      answer: 3,
      explanation: "Scoped cross-role tools handle the common, simple case locally while keeping complex work with the specialized agents — least privilege without the round-trip cost."
    },
    {
      id: "c08",
      domain: "tools",
      q: "Your team needs Claude Code to work with Jira and with an internal deployment workflow unique to your company. What is the sensible MCP strategy?",
      options: [
        "Use an existing community Jira MCP server and build a custom one only for deployment",
        "Build custom MCP servers for both so all integrations follow the same internal style",
        "Skip MCP entirely and describe both systems' APIs in detail inside the CLAUDE.md file",
        "Use a community server for both, adapting a generic CI server to the deployment flow"
      ],
      answer: 0,
      explanation: "Prefer existing servers for standard integrations and reserve custom servers for team-specific workflows."
    },
    {
      id: "c09",
      domain: "tools",
      q: "You added an MCP code-search tool that understands your monorepo's structure, but the agent keeps using built-in Grep instead. What should you change first?",
      options: [
        "Remove Grep from the agent's allowed tools so the MCP tool is its only search option",
        "Improve the MCP tool's description to explain what it can do that Grep cannot do",
        "Rename the MCP tool to `grep` so the agent picks it through its existing habits",
        "Add a hook that blocks every Grep call and returns an error pointing to the MCP tool"
      ],
      answer: 1,
      explanation: "The model chooses tools from their descriptions. Explaining the MCP tool's capabilities and outputs is the first, least disruptive fix."
    },
    {
      id: "c10",
      domain: "claude-code",
      q: "A CI job runs Claude Code to review pull requests and must post each finding as an inline comment. How do you get reliably parseable findings?",
      options: [
        "Ask for a Markdown table of findings and parse the table rows with a script",
        "Save Claude's terminal output to a log file and extract lines that look like findings",
        "Use `-p` with `--output-format json` and a `--json-schema` describing each finding",
        "Run Claude Code interactively in CI and copy each finding from the session log"
      ],
      answer: 2,
      explanation: "Non-interactive mode with JSON output and a schema produces machine-parseable, schema-conformant results for automation."
    },
    {
      id: "c11",
      domain: "claude-code",
      q: "Each time a developer pushes new commits, the automated review re-posts comments on issues it already flagged. What is the best fix?",
      options: [
        "Run the review only once per pull request, on the first commit that gets pushed",
        "Delete all earlier review comments before posting the new batch of comments",
        "Lower the review's sensitivity so it produces fewer comments on each run",
        "Pass prior findings in and ask for only new or still-unaddressed issues"
      ],
      answer: 3,
      explanation: "Giving the review its earlier findings as context lets it report only what is new or still open, avoiding duplicate comments."
    },
    {
      id: "c12",
      domain: "claude-code",
      q: "Claude keeps misreading your prose description of a data transformation, producing slightly different output each time. What is the most effective way to clarify it?",
      options: [
        "Provide two or three concrete input/output examples of the transformation",
        "Rewrite the description with more adjectives describing the intended result",
        "Repeat the same description three times in the prompt to emphasize its rules",
        "Ask Claude to guess what you meant and to keep trying until it matches"
      ],
      answer: 0,
      explanation: "Concrete input/output examples remove ambiguity that prose leaves open and are the most effective way to communicate an expected transformation."
    },
    {
      id: "c13",
      domain: "claude-code",
      q: "You want to experiment with a personal slash command without affecting teammates who use the same repo. Where should it live?",
      options: [
        "In `.claude/commands/` in the repo, on a separate branch you never push",
        "In `~/.claude/commands/`, which is available only to you across projects",
        "In the project's `.mcp.json`, registered under your own username",
        "In the project CLAUDE.md, inside a section marked as experimental"
      ],
      answer: 1,
      explanation: "User-level commands (and skills) in `~/.claude/` are personal and not shared through the repository."
    },
    {
      id: "c14",
      domain: "prompting",
      q: "You switched to tool use with a strict JSON schema for invoice extraction. Which kind of error does this still NOT prevent?",
      options: [
        "Output that fails to parse because of a missing brace or a trailing comma",
        "Output that omits a field the schema marks as required for every invoice",
        "Line items that don't sum to the stated total, or values put in wrong fields",
        "Output with a string in a field that the schema declares as a number type"
      ],
      answer: 2,
      explanation: "Schemas eliminate syntax and structural errors but not semantic ones. Add validation (e.g. sums, cross-field checks) and retry with the error on failure."
    },
    {
      id: "c15",
      domain: "prompting",
      q: "A classification schema uses an enum of eight categories, but real-world inputs keep arriving that fit none of them. How should the schema change?",
      options: [
        "Remove the enum and let the model write any category name it considers appropriate",
        "Keep the enum and tell the model to pick whichever of the eight is closest each time",
        "Add many more enum values so every conceivable input has a dedicated category",
        "Add an `\"other\"` value to the enum plus a free-text detail field for specifics"
      ],
      answer: 3,
      explanation: "An `other` option with a detail string keeps the enum useful for known cases while capturing new ones without forcing wrong labels."
    },
    {
      id: "c16",
      domain: "prompting",
      q: "An automated reviewer's \"naming\" category has a very high false-positive rate, and developers now ignore all of its findings, including real bugs. What is the best immediate step?",
      options: [
        "Temporarily disable the noisy category while improving its prompt separately",
        "Leave all categories enabled and add a note asking developers to read carefully",
        "Raise the overall severity threshold so only a few findings are shown per review",
        "Replace the reviewer with a traditional linter configured for naming conventions"
      ],
      answer: 0,
      explanation: "High false positives in one category erode trust in all of them. Disable it to restore trust in the accurate categories, then fix and re-enable it."
    },
    {
      id: "c17",
      domain: "prompting",
      q: "In a 5,000-request Message Batch, 40 requests fail because their documents exceed the context limit. What is the right way to recover?",
      options: [
        "Resubmit the whole batch with a shorter system prompt to leave more room for input",
        "Use `custom_id` to find the failed ones and resubmit only those, split into chunks",
        "Drop the failed documents, since a failure rate under 1% is within tolerance",
        "Process the failed documents through the Batches API again without any changes"
      ],
      answer: 1,
      explanation: "`custom_id` correlates requests with results, so you can resubmit only the failures, modified to address the cause (e.g. chunking oversized documents)."
    },
    {
      id: "c18",
      domain: "context",
      q: "A synthesis prompt includes many long subagent reports, and findings from the middle reports are often left out. How should the input be structured?",
      options: [
        "Randomize the order of the reports on each run so no single report is always in the middle",
        "Move the least important reports to the middle so their omission has less impact",
        "Put a summary of key findings at the start and give each report a clear section header",
        "Concatenate the reports without headers so the model reads them as one document"
      ],
      answer: 2,
      explanation: "Models attend less reliably to the middle of long inputs. Leading with key findings and using explicit section headers mitigates this \"lost in the middle\" effect."
    },
    {
      id: "c19",
      domain: "context",
      q: "An extraction system is 97% accurate overall, and you plan to stop human review of high-confidence outputs. What should you verify first?",
      options: [
        "That the model's self-reported confidence averages above 90% across all documents",
        "That overall accuracy stays at or above 97% when measured again next month",
        "That the total volume of documents is large enough to justify the review savings",
        "That accuracy holds per document type and field, checked with stratified samples"
      ],
      answer: 3,
      explanation: "Aggregate accuracy can hide poor performance on specific document types or fields. Validate by segment, calibrate confidence on labeled data, and keep stratified sampling going."
    },
    {
      id: "c20",
      domain: "context",
      q: "Final research reports often contain claims that no one can trace back to a source. What design change best preserves provenance?",
      options: [
        "Have subagents return claims mapped to source URL, excerpt, and date, kept through synthesis",
        "Ask the synthesis agent to append a bibliography of every source any subagent consulted",
        "Have a final agent search the web for a source that supports each claim in the report",
        "Instruct the synthesis agent to remove any claim that it is not fully confident about"
      ],
      answer: 0,
      explanation: "Structured claim-to-source mappings produced by subagents and preserved through synthesis keep attribution intact. A bibliography doesn't tie specific claims to sources."
    }
  ]
});
