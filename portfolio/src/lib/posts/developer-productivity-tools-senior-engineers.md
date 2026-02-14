---
title: "Developer Productivity Tools I Use as a Senior Engineer"
slug: "developer-productivity-tools-senior-engineers"
description: "The tools, workflows, and systems that keep me productive as a senior frontend engineer. From editor setup to terminal workflows, code review habits, and focus management."
publishDate: "2025-09-05"
author: "Umesh Malik"
category: "Productivity"
tags: ["Productivity", "Tools", "Developer Experience", "Workflow"]
keywords: "developer productivity, senior engineer tools, developer workflow, coding productivity, engineering productivity, VS Code setup, terminal workflow"
image: "/blog/developer-productivity-tools.jpg"
imageAlt: "Developer productivity tools for senior engineers"
featured: false
published: true
readingTime: "11 min read"
---

Productivity as a senior engineer is less about typing faster and more about reducing friction between thinking and executing. Here are the tools and systems that work for me after 4+ years of building software professionally.

## Editor: Cursor AI + Claude Code CLI

I use AI-native editors that accelerate my workflow:

- **Cursor AI** for primary development — AI assistance woven into the editing experience for rapid prototyping, complex refactors, and context-aware code generation
- **Claude Code CLI** for terminal-based workflows — when I need to work through complex problems, review code, or make sweeping changes across a codebase directly from the terminal

### Key Editor Settings

```json
{
  "editor.formatOnSave": true,
  "editor.bracketPairColorization.enabled": true,
  "editor.minimap.enabled": false,
  "editor.stickyScroll.enabled": true,
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

### Why AI-Native Editors

Traditional editors are passive — they wait for you to type. AI-native editors are collaborative — they understand your intent and help you get there faster. For boilerplate, test generation, and refactoring, the productivity gain is substantial.

## Terminal: iTerm2 + Zsh

My terminal is where I spend the second most time after the editor.

### Shell Aliases That Save Hours

```bash
# Git shortcuts
alias gs='git status'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline -20'
alias gco='git checkout'
alias gbd='git branch -d'

# Project shortcuts
alias dev='pnpm dev'
alias build='pnpm build'
alias test='pnpm test'
alias lint='pnpm lint'

# Navigation
alias ..='cd ..'
alias ...='cd ../..'
alias proj='cd ~/Projects'
```

### fnm Over nvm

I switched from `nvm` to `fnm` (Fast Node Manager) and the speed difference is noticeable. Shell startup went from ~500ms to ~50ms.

```bash
# .zshrc
eval "$(fnm env --use-on-cd)"
```

The `--use-on-cd` flag automatically switches Node versions when you enter a directory with a `.node-version` file.

## Git Workflow

### Commit Conventions

I follow Conventional Commits for all personal projects:

```
feat: add search functionality to blog
fix: resolve hydration mismatch in SSR
refactor: extract shared form validation logic
docs: update API documentation for v2
```

### Interactive Rebase for Clean History

Before opening a PR, I clean up my commits:

```bash
git rebase -i HEAD~5
```

A clean git history isn't just vanity — it makes `git bisect` actually useful when tracking down bugs months later.

## Code Review Habits

As both a reviewer and author, I've developed habits that keep reviews effective:

### As an Author
- Keep PRs under 400 lines when possible
- Write a description that explains the **why**, not just the **what**
- Self-review before requesting review — catch the obvious stuff yourself
- Add inline comments on tricky sections to guide reviewers

### As a Reviewer
- Start with the PR description and linked ticket
- Read tests first — they tell you what the code should do
- Focus on logic, not style (that's what linters are for)
- Ask questions instead of making demands: "What happens if X?" not "Change this to Y"

## Focus Management

### Time Blocking

I protect 2-3 hour blocks for deep work:
- **Morning (9-12)**: Complex coding, architecture, debugging
- **Afternoon (1-3)**: Code reviews, meetings, collaboration
- **Late afternoon (3-5)**: Documentation, planning, lighter tasks

### Notification Management

- Slack: Check every 30 minutes during focus blocks, not continuously
- Email: Twice a day (morning and after lunch)
- GitHub notifications: Filtered to only PRs I'm reviewing or authored

## Documentation as Productivity

Writing things down is the most underrated productivity tool.

### Decision Records

For significant technical decisions, I write a short document:

```markdown
## Decision: Use TanStack Query for Server State

### Context
We need to manage server state in the new dashboard feature.

### Options Considered
1. Redux Toolkit Query
2. TanStack Query
3. SWR

### Decision
TanStack Query — better devtools, simpler API, team familiarity.

### Consequences
- Need to add TanStack Query dependency
- Team needs brief onboarding on query patterns
```

This saves hours of re-explaining decisions months later.

## Key Takeaways

- Use AI-native editors — they're a genuine productivity multiplier, not a gimmick
- Invest in shell aliases and git shortcuts — small savings compound daily
- Protect deep work time — context switching is the biggest productivity killer
- Clean git history pays off in debugging and knowledge transfer
- Write decisions down — your future self will thank you
- Code review is a skill worth developing separately from coding
