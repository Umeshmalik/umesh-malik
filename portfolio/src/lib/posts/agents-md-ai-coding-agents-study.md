---
title: "AGENTS.md Files Don't Work the Way You Think — A 138-Repo Study Proves It"
slug: "agents-md-ai-coding-agents-study"
description: "A new study tested AGENTS.md files across 138 repositories and 5,694 pull requests. LLM-generated files hurt performance by 2-3%. Developer-written ones helped only 4%. Both increased costs by 20%+. Here's what actually works."
publishDate: "2026-02-17"
author: "Umesh Malik"
category: "AI & Open Source"
tags: ["AI", "Developer Experience", "Open Source", "Productivity", "Tools"]
keywords: "AGENTS.md effectiveness 2026, AGENTS.md study, AI coding agents context files, AGENTS.md vs CLAUDE.md, coding agent instructions, AGENTS.md benchmark, AGENTbench, AI coding agent performance, repository context files AI, AGENTS.md best practices, coding agent documentation, AI developer tools 2026, LLM coding agent optimization, AGENTS.md OpenAI, coding agent context files study"
image: "/blog/agents-md-cover.svg"
imageAlt: "AGENTS.md study results showing a document icon next to a declining performance chart from ETH Zurich's 138-repo benchmark"
featured: true
published: true
readingTime: "15 min read"
---

Somewhere right now, a developer is carefully crafting an AGENTS.md file for their repository. They are writing detailed instructions about code style, architecture decisions, build commands, and testing strategies. They believe this will make AI coding agents work significantly better on their codebase.

They are mostly wrong.

A new study from ETH Zurich — testing 138 repository instances across 5,694 pull requests — just proved that the most popular approach to writing AGENTS.md files actually *hurts* agent performance. And even the best-case scenario delivers far less improvement than the hype suggests.

The AI coding agent ecosystem has a documentation problem. And it is not the one you think.

## The Study That Nobody Wanted to See

On February 12, 2026, researchers Thibaud Gloaguen, Niels Mündler, Mark Müller, Veselin Raychev, and Martin Vechev from ETH Zurich published a paper that should have rattled every developer who has spent hours writing AGENTS.md files: *"Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?"*

Their methodology was rigorous. They created **AGENTbench**, a new benchmark consisting of 138 instances from 12 Python repositories that already contained developer-written context files. These instances were derived from 5,694 real GitHub pull requests — not synthetic tasks, not toy examples.

They tested four frontier coding agents:

- **Claude Code** (Sonnet 4.5)
- **Codex** (GPT-5.2)
- **Codex** (GPT-5.1 mini)
- **Qwen Code** (Qwen3-30b-coder)

Three experimental conditions:

1. **No context files** — agents work with just the codebase
2. **LLM-generated context files** — the approach most developers use today
3. **Developer-written context files** — hand-crafted by repository maintainers

They also validated results against **SWE-bench Lite** (300 tasks from popular open-source repositories) to ensure generalizability.

The results were not what the AGENTS.md evangelists expected.

## The Numbers That Break the Narrative

Here is what the study found:

**LLM-generated AGENTS.md files decreased agent performance by 2–3% on average.**

Read that again. The most common approach to creating AGENTS.md files — asking an LLM to analyze your codebase and generate instructions — makes agents *worse* at their jobs. Not neutral. Worse.

**Developer-written AGENTS.md files improved performance by only 4% on average.**

A 4% improvement from a hand-written context file. After hours of careful documentation. After thinking through every edge case and convention.

**Both types of context files increased inference costs by over 20%.**

So you are paying more — in tokens, in latency, in actual dollars — for marginal improvement at best and active harm at worst.

The study also uncovered why this happens:

- **Agents follow the instructions.** When AGENTS.md mentioned repository-specific tools, agents used those tools 2.5x more often. The problem is not compliance — it is that the instructions are not actually helpful.

- **Agents spend 14–22% more reasoning tokens** processing context files. That is reasoning capacity redirected from solving the actual problem to parsing your documentation.

- **Repository overviews do not guide agents to relevant files.** The high-level "here is how the codebase is structured" sections that most AGENTS.md files contain? Agents largely ignore them when navigating code.

- **LLM-generated files primarily duplicate existing documentation.** When the researchers removed existing README and docs from repositories, LLM-generated context files improved performance by 2.7% — proving they were just restating information already available in the codebase.

The conclusion was blunt: LLM-generated context files should generally be omitted entirely. Human-written files should contain only minimal, essential requirements that cannot be discovered from the code itself.

## What Is AGENTS.md, and How Did We Get Here?

For the uninitiated: AGENTS.md is an open format — think "a README, but for AI agents." It is a dedicated place to put context and instructions that help AI coding agents work effectively in a project: build steps, test commands, code style guidelines, architectural decisions, security considerations.

The format was created by the **agentsmd** organization with significant backing from OpenAI and has been adopted at remarkable speed. The GitHub repository has **17,500+ stars** and **1,200+ forks**. Over **60,000 open-source projects** now include an AGENTS.md file.

The list of supporting tools reads like a who's who of AI development:

- **OpenAI Codex** — first-class support
- **Google Jules and Gemini CLI** — full integration
- **Cognition's Devin and Windsurf** — built-in parsing
- **GitHub Copilot** — via `.github/copilot-instructions.md` (similar concept)
- **Cursor** — via `.cursorrules` / `.cursor/rules/`
- **25+ other tools** including Aider, VS Code, Zed, Warp, Semgrep, and UiPath

Anthropic, notably, maintains its own system called **CLAUDE.md** for Claude Code, with a more sophisticated hierarchical memory system (organization-wide policies, project memory, path-specific rules, and auto-memory that persists across sessions).

The format itself is flexible. No required fields, no rigid schema. Just markdown with recommended sections:

```markdown
# AGENTS.md

## Project Overview
Brief description of the project architecture.

## Build & Test
- `npm run build` — production build
- `npm test` — run all tests
- `npm run lint` — check code style

## Code Style
- Use TypeScript strict mode
- Prefer functional components
- Error handling: use Result types, not exceptions

## Architecture
- src/api/ — REST endpoints
- src/core/ — business logic
- src/db/ — database layer
```

Simple. Sensible. And apparently, not nearly as helpful as everyone assumed.

## The Hacker News Reality Check

When the study hit Hacker News, the discussion was illuminating — and split right down the middle.

**The optimists reframed the results.** User *deaux* argued that a 4% improvement from a simple markdown file is actually "massive" and represents a must-have resource. The real value, they claimed, emerges in **closed-source projects with specialized domain knowledge** that agents cannot discover on their own — exactly the kind of projects underrepresented in open-source benchmarks.

**The pragmatists shared war stories.** Developer *tomashubelbauer* described replacing AGENTS.md rules entirely with compiler-based checks — TypeScript AST validation, pre-commit hooks, deterministic linters. "Even explicit instructions are routinely ignored," they wrote, so programmatic enforcement became the only reliable path.

**The skeptics questioned the format's existence.** User *kkapelon* asked the obvious question: why does AGENTS.md exist separately when well-maintained projects should already have comprehensive `CONTRIBUTING.md` files that serve both humans and agents?

**The frustrated shared failures.** User *avhception* recounted agents ignoring multiple explicit warnings — like replacing SQLite with MariaDB despite clear instructions against making assumptions. If agents cannot reliably follow instructions, what is the point of writing more of them?

And perhaps the most important observation came from *rmunn*, who noted that the study only measured **test pass rates** — not code quality, maintainability, or style consistency. An agent that passes all tests but writes unmaintainable spaghetti code is not a success. AGENTS.md may provide significant value in these unmeasured dimensions.

## Why LLM-Generated Context Files Fail

The study's most damning finding deserves deeper examination: LLM-generated AGENTS.md files make things worse.

Here is why this happens:

**1. They state the obvious.** When you ask an LLM to analyze a codebase and generate an AGENTS.md file, it produces output like "This project uses React with TypeScript" or "Tests are located in the `__tests__` directory." The coding agent already knows this. It can read `package.json`. It can find test files. You are spending tokens to tell it things it can discover in seconds.

**2. They add noise to the context window.** Every token in the AGENTS.md file is a token that is not being used for reasoning about the actual problem. When your context file adds 2,000 tokens of redundant information, you are effectively reducing the agent's working memory for the task at hand.

**3. They create false confidence.** An agent that has been given a detailed context file may rely more heavily on that documentation and less on actually exploring the codebase. This is especially dangerous when the documentation is slightly outdated or incomplete — which it always eventually becomes.

**4. They optimize for the wrong thing.** LLM-generated summaries describe *what the code is*. What agents actually need is *what you want them to do differently than their defaults*. The distinction is critical.

## What Actually Works: The Evidence-Based Approach

The study, combined with insights from the developer community, points to a clear set of best practices that actually improve agent performance:

### 1. Write Only What Cannot Be Discovered

The single most important principle: if an agent can figure it out by reading the code, do not put it in your context file.

**Bad — Restating the obvious:**
```markdown
## Project Structure
- src/components/ — React components
- src/hooks/ — custom hooks
- src/utils/ — utility functions
```

**Good — Stating the non-obvious:**
```markdown
## Critical Requirements
- All database migrations must be backward-compatible (we run blue-green deploys)
- Never import from @internal/legacy — it is scheduled for removal in Q3
- Integration tests require a running Redis instance: `docker compose up redis`
```

The first example wastes tokens. The second provides information that would take an agent dozens of failed attempts to discover.

### 2. Use Positive Instructions, Not Negative Ones

Multiple developers in the HN discussion noted that negative instructions — "don't do X" — frequently backfire. This mirrors research on how language models process negation.

**Bad:**
```markdown
- Don't use class components
- Don't import lodash directly
- Don't write console.log statements
```

**Good:**
```markdown
- Use functional components with hooks exclusively
- Import lodash utilities individually: `import debounce from 'lodash/debounce'`
- Use the logger utility from src/utils/logger for all logging
```

As one commenter put it: it is like "instructing a toddler." Telling an agent not to think of a pink elephant guarantees it will think of a pink elephant.

### 3. Pair Context Files with Deterministic Enforcement

The most effective teams do not rely on AGENTS.md alone. They use it as a complement to programmatic checks:

```markdown
## Enforced by Tooling (agents will see errors if violated)
- TypeScript strict mode is enabled — all types must be explicit
- ESLint enforces import ordering and naming conventions
- Pre-commit hooks run tests and type checking

## Not Enforced by Tooling (please follow these conventions)
- New API endpoints should follow the existing pattern in src/api/users.ts
- Error responses use the ApiError class, never raw throw statements
- All new features need an entry in CHANGELOG.md
```

This approach gives agents the truly useful information — the conventions that are not machine-enforced — while letting linters and type checkers handle the rest deterministically.

### 4. Iterate Based on Failures, Not Assumptions

Developer *pamelafox* on Hacker News shared the most practical advice: adopt a data-driven approach. Only add information to your context file **after an agent fails at a task**, then verify the addition actually helps by reverting it and re-running.

The workflow:

1. Give the agent a task without any context file
2. Observe where it fails or makes wrong choices
3. Add a specific instruction addressing that failure
4. Re-run the task to verify the instruction helps
5. Remove the instruction and re-run to confirm it was the cause

This targets only genuinely useful content and prevents the context file from bloating with assumptions about what agents might need.

### 5. Front-Load Critical Information

If you must include context, put the most important information first. Agents — like humans — pay more attention to the beginning of documents. Burying your critical build command on line 47 of a 60-line file is a recipe for it being deprioritized.

```markdown
# AGENTS.md

## CRITICAL: Before Making Any Changes
Run `make verify` before committing. This runs type checking, linting, and tests.
The CI pipeline will reject PRs that fail this check.

## Build Commands
...
```

### 6. Keep It Short

The study showed that agents spend 14–22% more reasoning tokens when context files are present. Every line you add has a cost. A 10-line AGENTS.md that contains only essential, non-discoverable information will outperform a 200-line comprehensive guide every time.

Target: **under 30 lines** of actual content. If you need more, your project probably needs better tooling, not more documentation.

## The Format War: AGENTS.md vs CLAUDE.md vs Everything Else

![The context file format war comparing AGENTS.md, CLAUDE.md, Copilot Instructions, Cursor Rules, and Aider across AI coding tools](/blog/agents-md-format-war.svg)

The elephant in the room: there is no single standard. Different tools read different files:

| Tool | Context File | Notes |
|------|-------------|-------|
| **AGENTS.md** (OpenAI-backed) | `AGENTS.md` | Open standard, 60K+ repos |
| **Claude Code** (Anthropic) | `CLAUDE.md` | Hierarchical memory system |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Repository-wide instructions |
| **Cursor** | `.cursorrules` / `.cursor/rules/` | IDE-specific rules |
| **Aider** | `.aider*` config files | Tool-specific conventions |

If your team uses multiple AI tools — and most teams do in 2026 — you are maintaining multiple context files saying roughly the same thing. This is both wasteful and a maintenance burden that almost guarantees the files will drift out of sync.

AGENTS.md is winning the standardization race purely through adoption numbers and corporate backing. But Anthropic's CLAUDE.md system is arguably more sophisticated, with features like hierarchical scoping (organization-wide policies that cascade down to project-level and file-level rules), auto-memory that persists across sessions, and import syntax for composing context from multiple files.

The pragmatic approach: pick the format your primary tool supports and keep it minimal. If you use multiple tools, maintain one source of truth and symlink or copy as needed.

## The Real Problem: We Are Documenting Instead of Engineering

Here is the uncomfortable truth the AGENTS.md movement has been avoiding: writing better documentation for AI agents is treating the symptom, not the disease.

The real problems are:

**1. Codebases that are hard for agents to navigate are also hard for humans.** If an AI agent cannot figure out your project structure, build process, or conventions from the code itself, that is a code quality problem. Fix the code, not the documentation.

**2. Convention enforcement should be automated.** If you care about import ordering, use a linter. If you care about type safety, use strict TypeScript. If you care about test coverage, use a CI gate. Do not write a markdown file and hope the agent reads it.

**3. The best AGENTS.md file is one you do not need.** A well-structured codebase with clear naming conventions, consistent patterns, comprehensive type definitions, and good test coverage gives AI agents everything they need without a single line of supplementary documentation.

The study's finding that removing existing documentation and replacing it with LLM-generated context files improved performance by only 2.7% is telling. The documentation was already there. The agents were already reading it. The AGENTS.md file was just a worse version of what existed.

## What You Should Actually Do

Based on the study, the community discussion, and practical experience, here is a concrete action plan:

**If you do not have an AGENTS.md file:** Do not rush to create one. Focus on code quality, tooling, and automated enforcement instead.

**If you have an LLM-generated AGENTS.md file:** Delete it. The study shows it is actively harming performance while increasing costs. You are paying more for worse results.

**If you want to write one from scratch:**

1. Start with zero lines
2. Use an AI agent on your codebase without any context file
3. Note every failure or incorrect decision
4. Add one instruction per failure — positive, specific, non-discoverable
5. Verify each addition actually helps
6. Target under 30 lines total
7. Review and prune quarterly

**If you maintain a large project with multiple AI tool users:**

1. Pick one format as your source of truth
2. Keep it minimal and evidence-based
3. Pair every convention with automated enforcement where possible
4. Treat the context file as code — review changes, require justification, test impact

## The 4% That Matters

The ETH Zurich study is not a death sentence for AGENTS.md. A 4% improvement is real. For teams running hundreds of AI-assisted tasks per week, that compounds into meaningful productivity gains.

But it is a wake-up call. The industry has been treating context files as a silver bullet — "just write a good AGENTS.md and your AI coding agent will understand everything." The data says otherwise.

The developers who will get the most out of AI coding agents in 2026 are not the ones writing the most detailed AGENTS.md files. They are the ones writing the cleanest code, the strictest type definitions, the most comprehensive tests, and the most automated enforcement pipelines.

The best documentation for an AI agent is not a markdown file.

It is code that does not need one.
