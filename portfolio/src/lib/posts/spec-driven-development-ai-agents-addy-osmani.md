---
title: "The $300K Bug That Was Never the AI's Fault — Inside Addy Osmani's Spec Framework That Changes Everything"
slug: "spec-driven-development-ai-agents-addy-osmani"
description: "Google Chrome's Addy Osmani just published the definitive guide to writing specs for AI coding agents on O'Reilly Radar. His 5-principle framework — backed by GitHub's analysis of 2,500+ agent configs and Stanford's 'Curse of Instructions' research — reveals why your 2,000-line prompt fails, what it actually costs, and the exact playbook to fix it."
publishDate: "2026-02-21"
author: "Umesh Malik"
category: "AI & Developer Experience"
tags: ["AI", "Developer Experience", "Productivity", "Tools", "Software Engineering"]
keywords: "AI agent specs 2026, spec-driven development, Addy Osmani AI agents, how to write specs for AI agents, AI coding agent prompts, GitHub spec kit, Claude Code plan mode, AI agent best practices, coding agent instructions, spec-driven development framework, AI agent context window, modular prompts AI, AI agent self-checks, O'Reilly AI agents guide, AI agent PRD, spec for AI agents, GitHub Copilot agents.md, AI agent task decomposition, LLM prompt engineering 2026, AI coding agent optimization, AI agent anti-patterns, AI agent boundaries, curse of instructions AI, AI agent cost, AI code quality 2026"
image: "/blog/spec-driven-dev-cover.svg"
imageAlt: "Three AI coding agents — database, security, and test — sitting at terminal screens writing and reviewing code, all guided by a central SPEC.md specification document"
featured: true
published: true
readingTime: "18 min read"
---

A senior engineer types into Claude Code: *"Build me a user authentication system."* The AI agent generates 2,000 lines of code. Tests pass. The code gets merged to production.

Three weeks later, user data leaks. The password hashing was plain text. Rate limiting did not exist. SQL injection vulnerabilities sat in every query that touched user input.

The estimated cost of the breach: $300,000 in incident response, legal fees, and customer compensation.

The root cause was not the AI model. It was not the context window. It was not the tooling.

It was the spec.

On February 20, 2026, **Addy Osmani** — the engineering leader behind Google Chrome's DevTools and the author whose work on web performance has shaped how millions of developers build software — published a piece on O'Reilly Radar that should be mandatory reading for every developer working with AI agents: *"How to Write a Good Spec for AI Agents."*

His thesis is uncomfortable: **the AI is not the bottleneck. Your specification is.** And he has a five-principle framework, backed by GitHub's analysis of over 2,500 agent configuration files, that proves it.

This is not another "prompt engineering tips" article. This is spec-driven development — a fundamental shift in how software gets built when your coworker is an LLM. And the gap between teams that get this right and teams that don't is measured in six figures.

![A glowing terminal screen showing a vague AI prompt on one side and a structured specification document on the other — the gap that costs teams six figures a year](/blog/spec-driven-dev-the-gap.svg)

## The Research That Broke the Illusion

Two studies converged in early 2026 to shatter the assumption that more instructions produce better AI output.

**GitHub's 2,500-file analysis.** After studying over 2,500 AI agent configuration files across production repositories, GitHub's team found that the vast majority fail because they are too vague — or, paradoxically, too verbose. Teams that covered all six core specification areas (more on those below) saw dramatically fewer post-deployment bugs. Teams that covered fewer than four saw code quality drop below human-written baseline.

**Stanford and UC Berkeley's "Curse of Instructions."** Researchers published a [study](https://openreview.net/pdf/848f1332e941771aa491f036f6350af2effe0513.pdf) showing that as you pile more requirements into an AI prompt, performance in adhering to *each individual rule* drops significantly. Even GPT-5 and Claude Opus struggle when asked to satisfy dozens of requirements simultaneously.

Your 50-bullet-point specification is not making the AI smarter. It is making it dumber.

The DigitalOcean AI team arrived at the same conclusion from a different angle: *"One task focus and relevant info only to the model, avoiding dumping everything everywhere."*

Simon Willison, the veteran developer whose brutally honest commentary on AI tools has made him one of the most trusted voices in the space, frames the whole dynamic in human terms:

> "Working with AI agents is a very weird form of management. Getting good results feels uncomfortably close to managing a human intern."

Managing an intern. Not programming a computer. That distinction is the key to everything that follows.

![A graph visualization showing AI agent performance declining as instruction count increases — the Curse of Instructions illustrated with a steep downward curve](/blog/spec-driven-dev-curse-of-instructions.svg)

## The Hidden Cost of Bad Specs

Before diving into the framework, it is worth quantifying what bad specs actually cost — because this is not theoretical.

**Wasted development cycles.** The average time to discover an AI-generated bug in production is two to three weeks. The average fix takes four to eight hours. Multiply that by 15 to 30 incidents per quarter, and you are looking at tens of thousands of dollars in engineering time alone.

**Technical debt compound interest.** AI-generated code that "works" but was not properly specified creates what engineers call "house of cards code" — it passes tests, it handles the happy path, and it collapses the moment a real user touches an edge case. Refactoring this code costs three to five times the original development time.

**Trust erosion.** When AI-generated code repeatedly causes incidents, teams stop trusting AI tools. Adoption declines. Code review overhead increases by 40-60%. The AI investment that was supposed to accelerate delivery becomes a drag on velocity.

Meanwhile, teams with robust spec frameworks report the inverse: 60% reduction in AI-related bugs, 40% faster code review, and three to five times higher code acceptance rates.

The math is straightforward. Investing in spec quality is not overhead. It is the highest-ROI activity in AI-assisted development.

## The Five Principles That Separate Success From Disaster

Osmani's framework distills years of production experience into five core principles. Each one addresses a specific failure mode that GitHub's study identified. Each one is immediately actionable.

### Principle 1: Start With Vision, Let the AI Draft the Details

Stop writing exhaustive specs from scratch. Start with a product brief.

This is counterintuitive for experienced engineers. We are trained to think through every edge case, every failure mode, every integration point before writing a line of code. But Osmani argues that LLMs excel at elaboration when given clear direction — and drift badly without it.

Here is the difference in practice:

**The approach that fails:**

```
Build an authentication system with JWT tokens, bcrypt password hashing
(12 rounds), rate limiting (10 requests per minute per IP), email
verification, password reset flow with expiring tokens, OAuth integration
for Google and GitHub, 2FA support, session management, remember-me
functionality, CSRF protection, account lockout after 5 failed attempts...
```

This continues for 500 words. The agent reads all of it, retains a fraction of it, and produces code that half-implements everything while fully implementing nothing.

**The approach that works:**

```
You are an AI software engineer. Draft a detailed specification for a
secure user authentication system for a SaaS application. Cover:
- Authentication methods (local + OAuth)
- Security requirements (industry standards)
- User flows (signup, login, password reset, 2FA)
- Constraints (must integrate with existing PostgreSQL database)
- Step-by-step implementation plan

Prioritize security and simplicity over feature completeness.
```

The agent expands this into a detailed plan. You review the plan. You refine it. Then — and only then — does the agent write code.

Tools already support this workflow. Claude Code's **Plan Mode** restricts agents to read-only operations — the agent reads your codebase, analyzes the architecture, and produces a plan without touching a single file. GitHub's approach goes further: their AI team promotes **"spec-driven development where specs become the shared source of truth — living, executable artifacts that evolve with the project."**

Save the approved spec as `SPEC.md` in your repository. It becomes a persistent artifact for every future session — no re-explaining, no context loss, no drift.

### Principle 2: Structure Like a Professional PRD

If your spec reads like a stream-of-consciousness Slack message, you are going to get stream-of-consciousness code.

Osmani argues that AI specs should be treated as formal, well-organized documents — structured like a Product Requirements Document (PRD) or System Requirements Specification (SRS). GitHub's data backs this up. Their analysis of **2,500+ agent configuration files** identified six core areas that consistently appear in effective specs:

| Section | What It Contains | Example |
|---------|-----------------|---------|
| **Commands** | Full executable commands with flags | `pytest -v --cov=src --cov-report=html` |
| **Testing** | Framework, file locations, coverage targets | "Jest tests in `__tests__/`, 80% coverage minimum" |
| **Project Structure** | Explicit paths and conventions | "`src/` for app code, `tests/` for unit tests" |
| **Code Style** | Real code snippets over prose descriptions | One example beats three paragraphs |
| **Git Workflow** | Branch naming, commit formats, PR rules | "Feature branches: `feat/description`" |
| **Boundaries** | What agents must never touch | Secrets, vendor dirs, production configs |

Notice the specificity. Not "run tests" — the full command with flags. Not "follow good practices" — a concrete code example. Not "be careful" — explicit boundaries.

That last area — boundaries — is where the framework gets its teeth. **"Never commit secrets" was the single most commonly helpful constraint** across all analyzed repositories. Not architecture guidance. Not style preferences. A simple, hard boundary.

Osmani introduces a **Three-Tier Boundary System** that formalizes this:

**Always** (proceed without asking):
- Run tests before commits
- Follow naming conventions
- Validate all user input with Zod schemas
- Return appropriate HTTP status codes

**Ask First** (require human approval):
- Database schema changes
- Adding new dependencies
- Authentication flow modifications
- Changes to JWT secret rotation

**Never** (hard stops):
- Store passwords in plain text
- Commit secrets or API keys
- Log sensitive user data
- Edit `node_modules` or vendor directories
- Skip input validation for any reason

When you codify these boundaries into a spec that lives in version control, every agent session starts with guardrails already in place. No more hoping the model remembers your verbal instruction from three prompts ago. No more discovering in production that the agent cheerfully committed your `.env` file.

![A three-tier security boundary diagram showing green Always zone, amber Ask First zone, and red Never zone — the guardrail system that prevents AI agents from making catastrophic mistakes](/blog/spec-driven-dev-three-tier-boundaries.svg)

### Principle 3: Break Tasks Into Modular Prompts

This is the principle that will change most developers' workflows overnight.

The instinct is to write one comprehensive prompt and let the agent figure it out. Osmani's framework says the opposite: **divide work into focused, sequential tasks.** Feed the agent only the relevant section of your spec for each task.

The Curse of Instructions research makes the case quantitatively. An agent asked to simultaneously handle authentication, database design, API structure, frontend components, testing, and deployment will do all of them poorly. The same agent, given those tasks one at a time with focused context, will do each one well.

Here is modular prompting applied to the authentication example:

**Task 1 — Database Schema:**
```
Context: Auth service needs user storage.
Spec section: [Paste database schema requirements only]
Task: Generate migration file for users table.
Success criteria: Includes email (unique), password_hash, created_at, updated_at
```

**Task 2 — Password Hashing:**
```
Context: User model needs password methods.
Spec section: [Paste security requirements only]
Task: Add hashPassword() and verifyPassword() methods to User model.
Success criteria: Uses bcrypt with 12 rounds, includes error handling
```

**Task 3 — JWT Generation:**
```
Context: Login endpoint needs token generation.
Spec section: [Paste JWT requirements only]
Task: Create generateAuthToken() function.
Success criteria: Expires in 7 days, includes user ID and email claims
```

Each task is self-contained. The AI's context window focuses on one problem. Review is easier. Debugging is simpler. And if task 2 fails, it does not contaminate tasks 1 or 3.

For larger codebases, Osmani recommends **subagent specialization** — multiple agents for different domains. A `@database-agent` handles schema design. A `@security-agent` audits for vulnerabilities. A `@test-agent` writes and runs tests. Each gets only the relevant portion of the spec. A main agent orchestrates the flow.

Simon Willison has been vocal about this approach, describing the experience of embracing **"parallel coding agents"** as *"surprisingly effective, if mentally exhausting."* He recently coined the term **"parallel agent psychosis"** after losing track of code across multiple development environments — a real hazard of this workflow that developers need to plan for.

GitHub has formalized the overall approach into their **Spec Kit Four-Phase Workflow:**

1. **Specify** — Write high-level description; agent generates detailed specification
2. **Plan** — Agent produces comprehensive technical plan based on stack and constraints
3. **Tasks** — Agent breaks spec and plan into small, reviewable, independently testable chunks
4. **Implement** — Agent tackles tasks sequentially; focused reviews replace thousand-line code dumps

You do not move to the next phase until the current one is validated. This prevents the house-of-cards failure mode — AI output that looks solid in a 1,500-line PR but collapses the moment a real user touches it.

![A four-phase workflow pipeline showing Specify, Plan, Tasks, and Implement stages with human review gates between each — GitHub's Spec Kit approach to AI-assisted development](/blog/spec-driven-dev-four-phase-workflow.svg)

### Principle 4: Build In Self-Checks and Domain Knowledge

Here is where Osmani's framework addresses the thing most "prompt engineering" advice completely ignores: **your expertise matters more than ever.**

AI agents are confidently wrong. They will generate insecure code, skip edge cases, and violate best practices — all while passing basic tests and producing output that looks professional. The relationships between your database tables, the gotchas in your third-party libraries, the business rules that exist only in the heads of your senior engineers — none of that lives in the training data.

Osmani's framework says to inject this knowledge directly into specs as **Known Pitfalls:**

```markdown
## Known Pitfalls

### bcrypt Performance
On high-traffic endpoints, bcrypt hashing can block the event loop.
Solution: Use worker threads for password operations.

### JWT Token Rotation
Never invalidate active tokens immediately — users will be logged
out mid-session.
Solution: Support both old and new JWT secrets during rotation window.

### Rate Limiting Edge Cases
IP-based rate limiting fails with corporate NAT/proxies.
Solution: Also rate-limit by account ID after authentication.
```

This is **mentorship embedded in the spec.** The AI benefits from your ten years of production battle scars. No amount of training data contains the knowledge that *your* Stripe integration throws `CardError` for declined cards, not a generic `PaymentError`, and that you need to handle both.

Beyond domain knowledge, the framework introduces three **self-verification patterns** that turn specs into quality control mechanisms:

**Post-implementation review prompts.** Append to every task:

```
After implementing the authentication endpoint:
1. Verify password hashing uses bcrypt with 12 rounds
2. Confirm rate limiting is enabled (10 req/min per IP)
3. Check that JWT tokens expire in 7 days
4. Ensure all inputs are validated with Zod
5. List any spec requirements not yet addressed
```

This simple addition catches a remarkable number of omissions.

**LLM-as-Judge.** Use a second agent or prompt to review the first agent's output against your quality guidelines:

```
You are a senior security engineer reviewing authentication code.
Check for:
- Password storage (must be hashed, never plain text)
- Input validation (all user input must be sanitized)
- Rate limiting (must be applied to all public endpoints)
- Error messages (must not leak sensitive information)

Flag any violations with severity (critical/high/medium/low).
```

This adds a layer of semantic evaluation beyond syntax checks. The reviewing agent does not need to understand the full codebase — it only needs the spec and the output.

**Conformance testing.** Build language-independent test suites derived directly from your spec and treat them as contracts:

```yaml
# auth-conformance.yaml
tests:
  - name: "Register with valid email"
    request:
      method: POST
      endpoint: /auth/register
      body:
        email: "test@example.com"
        password: "SecureP@ss123"
    expect:
      status: 201
      response:
        contains: ["token", "user"]

  - name: "Register with duplicate email fails"
    request:
      method: POST
      endpoint: /auth/register
      body:
        email: "test@example.com"
        password: "SecureP@ss123"
    expect:
      status: 409
      response:
        contains: ["error"]
```

Include this in your spec: *"Must pass all tests in `auth-conformance.yaml`."* The spec becomes enforceable, not aspirational.

The governing principle behind all of this: **"You remain the exec in the loop."** Specs empower agents, but human judgment is the final filter. Always.

### Principle 5: Test, Iterate, and Evolve

Specs are not documents. They are software.

This final principle is what separates Osmani's framework from static "best practices" guides. He argues that specs should be treated as living artifacts subject to the same version control, testing, and iteration cycles as the code they describe.

**The continuous loop:**

1. **Write spec** — initial requirements and structure
2. **AI implements** — agent generates code from spec
3. **Run tests** — automated and manual verification
4. **Find gaps** — discover missing requirements or ambiguities
5. **Update spec** — incorporate learnings
6. **Resync agent** — *"Spec updated as follows... adjust accordingly"*
7. **Repeat** — continuous improvement

**Version control the spec alongside the code:**

```bash
git add SPEC.md
git commit -m "feat(spec): add JWT token rotation requirements"
```

Track what changed and why. When the agent's output reveals a gap in your spec — and it will — update the spec before fixing the code. The spec is the source of truth; the code is derived from it.

For large projects where feeding the entire spec in every prompt is impractical, Osmani recommends tooling-level solutions: **RAG** (Retrieval-Augmented Generation) to let agents pull relevant spec chunks on demand, **MCP** (Model Context Protocol) to automate context feeding based on the current task, and **Context7** to auto-fetch relevant documentation snippets based on what the agent is working on.

**Cost optimization** matters here too. Use cheaper, faster models for initial drafts and routine tasks. Reserve top-tier models for critical implementation steps and complex reasoning. Not every task needs Opus-level intelligence. A test runner agent needs far less capability than a system architecture agent.

## The Anti-Patterns That Kill AI Projects

GitHub's analysis and production experience across thousands of repositories reveal failure modes that recur with remarkable consistency. Osmani's framework implicitly addresses all of them — but it is worth naming them explicitly so you can recognize them in your own workflows.

### Anti-Pattern 1: The Vague Prompt

```
❌  "Build me a REST API for user management."
```

What the AI hears: *"Generate something API-shaped with users and hope for the best."*

Result: Basic CRUD endpoints. No authentication. No validation. No error handling. No tests.

```
✅  "Build a REST API for user management with:
    - Endpoints: POST /users, GET /users/:id, PUT /users/:id
    - Auth: JWT tokens required (except POST /users)
    - Validation: Email format, password strength (8+ chars, mixed case)
    - Error handling: Consistent JSON error responses with status codes
    - Tests: Unit tests for all endpoints (Jest + Supertest)
    - Tech: Express 4.18+, TypeScript, PostgreSQL via Prisma"
```

Result: Functional, secure, testable API.

### Anti-Pattern 2: The Context Dump

Pasting an entire 50-page product specification into a single prompt. The Curse of Instructions research proves this degrades performance. The agent loses focus. Key requirements get buried. You pay more tokens for worse output.

The fix: extended table of contents. After drafting your full spec, prompt: *"Summarize the spec above into a concise outline with each section's key points and reference tags."* Feed the outline per task, referencing the full spec only when needed.

### Anti-Pattern 3: Skipping Human Review

AI passes tests. Code gets merged. Nobody reads it.

What gets missed: edge cases not covered by tests, security vulnerabilities in "clever" AI solutions, performance issues under scale, code that "works" but violates every best practice in the codebase.

Willison's rule applies: **never commit code you could not explain to someone.** AI-generated code can look solid while being structurally fragile.

### Anti-Pattern 4: Confusing Vibe Coding With Production

Vibe coding — rapid prototyping with AI for throwaway projects — is genuinely useful. The mistake is applying vibe coding practices to production systems.

Prototype with loose specs. Ship with tight specs. Know which mode you are in. The $300,000 authentication breach at the top of this article did not happen because the AI was bad at coding. It happened because someone used a prototype-grade prompt for production-grade work.

![A split screen showing chaotic vibe coding on the left with scattered prompts versus disciplined spec-driven development on the right with structured documents — the divide that separates production-grade AI workflows from expensive disasters](/blog/spec-driven-dev-vibe-vs-production.svg)

## Why This Framework Matters Right Now

A few weeks ago, I covered the [ETH Zurich study](/blog/agents-md-ai-coding-agents-study) that tested AGENTS.md files across 138 repositories and 5,694 pull requests. The findings were stark: LLM-generated instruction files actually *hurt* agent performance by 2-3%, while even hand-written ones improved it by only 4% — and both increased inference costs by over 20%.

That study answered the question of *what* is not working. Osmani's framework answers *why* — and more importantly, *what to do instead.*

The patterns align perfectly:

- ETH Zurich found agents spent **14-22% more reasoning tokens** processing context files. Osmani's modular prompting approach directly addresses this by feeding only relevant context per task.

- The researchers found that **repository overviews did not guide agents to relevant files.** Osmani's framework says to skip overviews entirely and provide explicit paths, specific commands, and real code examples.

- The researchers found that **LLM-generated context files primarily duplicate existing documentation.** Osmani's framework says to start with vision and let the agent draft details from the actual codebase — not from a meta-document about the codebase.

This is convergent evidence from independent sources pointing to the same conclusion: **the era of "throw everything at the context window" is over.** Spec-driven development — structured, modular, iterative, boundary-aware — is what actually works.

## The Tooling Is Already Here

What makes this framework immediately actionable is that the tooling ecosystem has caught up to the methodology:

- **Claude Code** ships with Plan Mode for read-only analysis before code generation, and supports subagent architectures for parallel task execution
- **GitHub's Spec Kit** implements the four-phase specify-plan-tasks-implement workflow with human gates between each phase
- **GitHub Copilot** supports `agents.md` persona files for specialized agent configurations — `@docs-agent`, `@test-agent`, `@security-agent` — each with focused specs for their domain
- **MCP (Model Context Protocol)** standardizes how tools feed context to agents, enabling spec-aware context management
- **Anthropic Skills** provide reusable, Markdown-based agent behaviors that snap into existing workflows

This is not a "maybe someday" situation. Every piece of the framework can be implemented today.

## The Real Shift: From Prompt Engineer to Engineering Manager

Here is the part Osmani implies but never quite says outright, so I will.

Spec-driven development is not a prompting technique. It is a **management discipline.** Writing a good spec for an AI agent requires the same skills as writing a good brief for a junior engineer: clarity of vision, explicit boundaries, structured deliverables, built-in checkpoints, and the discipline to review work incrementally rather than waiting for a big-bang delivery.

The developers who will thrive in the AI-augmented era are not the ones who master exotic prompt syntax. They are the ones who can:

1. **Decompose ambiguous requirements** into clear, testable tasks
2. **Define boundaries** that prevent catastrophic errors
3. **Write acceptance criteria** that leave no room for interpretation
4. **Review and iterate** with discipline, not just once at the end
5. **Encode domain knowledge** that no training dataset contains

These are not new skills. They are the skills that made senior engineers valuable before AI agents existed. The difference is that now, instead of applying them to human teams of five or ten, you are applying them to AI agents that can execute at the speed of inference.

Willison captured this shift with his usual precision: *"Write good documentation first and the model may build matching implementation from that alone."*

Documentation. Specifications. Clear requirements. The boring stuff. The stuff that every engineer knows they should write but most don't.

It turns out the boring stuff is the whole game now.

![A developer surrounded by AI coding agents working in parallel — the new reality where engineering managers orchestrate non-human teams through structured specifications](/blog/spec-driven-dev-engineering-manager.svg)

## Your First AI Agent Spec: The Template

Copy this. Fill it in. Commit it to your repo. The 30 minutes you spend on this will save you 30 hours of debugging over the next month.

```markdown
# [Project Name] — AI Agent Specification

## Overview
[2-3 sentences: what you are building and why]

## Tech Stack
- Language/Framework: [exact versions]
- Database: [type + version]
- Key libraries: [list with versions]

## Commands
- Build: `[exact command with flags]`
- Test: `[exact command with flags]`
- Lint: `[exact command with flags]`
- Type check: `[exact command with flags]`

## Project Structure
- src/ → [describe organization]
- tests/ → [describe organization]
- docs/ → [describe organization]

## Code Style
[Include 1-2 real code examples showing preferred patterns]

## Git Workflow
- Branch naming: [format]
- Commit format: [format]
- PR requirements: [list]

## Testing
- Framework: [name]
- Coverage minimum: [percentage]
- Location: [directory]
- Run before: [every commit / merge / deploy]

## Boundaries

### Always Do
- [Action agents should always take without asking]
- [Action agents should always take without asking]
- [Action agents should always take without asking]

### Ask First
- [Action requiring human approval before proceeding]
- [Action requiring human approval before proceeding]

### Never Do
- [Hard stop — agent must never do this under any circumstance]
- [Hard stop — agent must never do this under any circumstance]
- [Hard stop — agent must never do this under any circumstance]

## Known Pitfalls
- [Common mistake 1 — what goes wrong + the correct solution]
- [Common mistake 2 — what goes wrong + the correct solution]

## Success Criteria
- [How you will know it is done]
- [What good looks like]
- [Edge cases that must be handled]
```

Then start your first agent session with: *"Read SPEC.md and draft an implementation plan. Do not write any code yet."*

## The Bottom Line

Addy Osmani did not write a prompt engineering guide. He wrote a management handbook for the age of AI agents. And the core message is both simple and profound:

**The spec is the product.**

When your specification is clear, structured, modular, boundary-aware, and continuously tested — the agent is almost an implementation detail. It will follow good specs the same way a competent engineer follows good requirements.

When your specification is vague, monolithic, boundary-free, and static — no model on earth will save you. Not Opus. Not GPT-5. Not whatever ships next quarter.

One approach costs six figures a year in preventable bugs, security incidents, and technical debt. The other saves six figures a year in faster reviews, higher acceptance rates, and code that actually works in production.

The bottleneck was never the AI. It was always the brief.

Now we have a framework to fix it.

---

*This article is based on Addy Osmani's [How to Write a Good Spec for AI Agents](https://www.oreilly.com/radar/how-to-write-a-good-spec-for-ai-agents/) (O'Reilly Radar, February 2026), [GitHub's analysis of 2,500+ agent configuration files](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/), Stanford/UC Berkeley's [Curse of Instructions](https://openreview.net/pdf/848f1332e941771aa491f036f6350af2effe0513.pdf) research, and production observations from Simon Willison, the Anthropic engineering team, and the DigitalOcean AI team.*
