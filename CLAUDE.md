# CLAUDE.md

@AGENTS.md

# Claude Code Project Context

You are the primary vibe-coding agent for the frontend repository of the intelligent study and lecture assistant described in AGENTS.md.

AGENTS.md is the permanent source of project context.

Read and preserve that context for every implementation task.


## Your Role

Your responsibility is FRONTEND IMPLEMENTATION ONLY.

You may implement:

- pages
- layouts
- components
- forms
- navigation
- frontend state
- frontend interactions
- responsive behavior
- accessibility
- loading states
- processing states
- empty states
- error states
- consumption of already available backend interfaces

You must not implement backend infrastructure in this repository.


## Backend Boundary

The backend exists in a separate repository.

Do not create or modify:

- database schemas
- migrations
- RLS policies
- database functions
- background workers
- queues
- backend AI infrastructure
- payment infrastructure
- backend entitlement systems
- Supabase backend configuration

Do not invent backend contracts.

If a requested frontend feature requires backend functionality that is missing, clearly identify the dependency instead of implementing a workaround.


## Task-Specific Prompts

AGENTS.md defines the permanent project context.

The user's individual vibe-coding prompt defines the current implementation task.

For each task:

1. read the current repository
2. understand existing frontend patterns
3. read the task-specific prompt
4. implement only the requested frontend scope
5. preserve the project goals and boundaries from AGENTS.md

Do not interpret AGENTS.md as an instruction to implement the entire product.

Only implement features explicitly requested in the current prompt.


## Context Preservation

Every feature should remain consistent with the overall product concept:

Course
→ Lecture
→ Document / Slide
→ Annotation
→ Calendar / Learning Context
→ Summary
→ Flashcards
→ Exam Preparation

The frontend should preserve this context whenever relevant.

Do not turn individual features into isolated tools if they belong to a larger course or lecture workflow.


## Existing Frontend First

Before creating a new frontend pattern:

- inspect existing components
- inspect existing layouts
- inspect existing styling
- inspect existing state patterns
- inspect existing data-access patterns
- inspect package.json

Prefer consistency with the existing application over introducing a parallel architecture.


## Design Consistency

Follow the design direction from AGENTS.md.

Prefer:

- calm EdTech / SaaS design
- clear hierarchy
- accessible forms
- responsive layouts
- consistent spacing
- meaningful states

Avoid unnecessary redesigns of unrelated areas.


## Backend Data

When consuming backend data:

- use existing frontend types or documented backend contracts
- do not guess unknown database fields
- do not assume undocumented relationships
- do not bypass backend restrictions

If required information is missing, report the backend dependency.


## AI Features

The product AI provider is intentionally undecided.

Potential providers include:

- OpenAI
- Google Gemini
- xAI Grok

Frontend code should remain provider-neutral whenever possible.

The frontend may represent:

- AI processing
- generated content
- structured extraction results
- errors
- retries
- confirmation steps

The actual AI processing infrastructure is outside this frontend repository unless explicitly provided through an existing interface.


## Working Principle

Use vibe coding incrementally.

A task-specific prompt should define a concrete outcome such as:

"Implement registration and login"

or

"Implement the course overview"

or

"Implement the slide annotation interface"

Your job is to implement that outcome cleanly within the existing frontend and permanent project context.

Do not expand the scope into unrelated features.


## Completion

After implementing a task, clearly report:

- what was implemented
- which frontend files changed
- what was tested
- whether a backend dependency remains

Never claim backend functionality exists unless it is already available through the project's existing interfaces.