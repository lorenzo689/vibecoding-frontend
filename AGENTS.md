# AGENTS.md

## Project

This repository contains the frontend of a web-first intelligent study and lecture assistant.

The product is designed for university students and combines study organization with lecture-based learning.

The central product idea is:

Course
→ Lecture
→ Document / Slide
→ Personal Annotation
→ Dates / Calendar
→ Summary
→ Flashcards
→ Exam Preparation

The application should not feel like a generic PDF chatbot or another isolated AI study tool.

Its main differentiation is the persistent connection between:

- course organization
- lecture materials
- individual slides
- personal annotations
- detected dates and deadlines
- grades / academic performance
- summaries
- flashcards
- exam preparation

The goal is one continuous study workflow from the lecture material to exam preparation.

## Repository Responsibility

This repository is FRONTEND ONLY.

It owns:

- frontend pages
- layouts
- components
- forms
- navigation
- frontend state
- user interactions
- responsive behavior
- loading states
- empty states
- error states
- displaying backend data
- calling already available backend / Supabase interfaces
- representing processing states in the UI

It does NOT own:

- database schema
- database migrations
- Row Level Security policy definitions
- Supabase backend configuration
- background workers
- queues
- server-side AI processing infrastructure
- payment backend
- backend entitlement logic
- backend usage-limit implementation
- backend business logic
- new API infrastructure unless explicitly provided by another repository

All backend functionality is handled in a separate backend repository.

If a frontend feature requires backend functionality that does not exist yet:

1. Do not implement a fake backend.
2. Do not redesign the database.
3. Do not create migrations.
4. Do not create or modify RLS policies.
5. Do not silently invent API contracts.
6. Clearly state the required backend dependency.

## Product Goal

The product should reduce the manual transfer of information between lecture material, organization and exam preparation.

A student should eventually be able to:

1. create or access a course
2. upload lecture material
3. view the lecture slide by slide
4. attach personal notes or markings to specific slides
5. see automatically extracted topics, definitions, dates and relevant information
6. confirm detected dates before adding them to the calendar
7. revisit unresolved lecture notes
8. generate explanations
9. generate summaries
10. generate flashcards
11. prepare for an exam using the accumulated course context

The frontend should always preserve this course and lecture context.

## Target Users

Primary target group:

- university students
- Bachelor and Master students

Initial product hypothesis:

Students in content-heavy and exam-intensive degree programs may benefit especially from the product.

This is a product hypothesis, not a proven fact.

## Core Product Areas

### Authentication

The product requires:

- registration
- login
- persistent authenticated sessions
- logout
- protected application areas

Authentication is provided by Supabase Auth through interfaces supplied by the overall system.

### Dashboard

The dashboard should give the student a clear overview of:

- courses
- upcoming deadlines
- exams
- recent lecture material
- unresolved notes
- relevant learning progress

The dashboard should prioritize useful information rather than becoming an overloaded analytics screen.

### Course Management

A course can conceptually contain:

- course name
- lecturer
- semester
- lectures
- exercises
- exams
- deadlines
- grades
- documents
- personal notes
- summaries
- flashcards

### Lecture Material

Students can work with uploaded lecture material.

The UI should support a document / slide-based experience.

Important conceptual relationship:

Course
→ Lecture
→ Document
→ Slide

A slide should be treated as a meaningful context unit in the user experience.

### Slide Annotations

Students should be able to attach information to a specific slide, for example:

- personal note
- important
- exam relevant
- explain again
- example needed
- follow up later

These annotations should remain connected to the slide and later learning workflow.

### Intelligent Date Detection

Lecture material may contain dates such as:

- exams
- presentations
- assignments
- deadlines

The frontend should represent detected dates as suggestions.

Detected information must not appear as automatically confirmed user data.

Expected UX:

Detected date
→ show source/context
→ user reviews
→ user confirms
→ calendar entry appears

### Calendar

The calendar conceptually contains:

- lectures
- exercises
- exams
- assignments
- presentations
- learning sessions
- confirmed dates extracted from lecture material

### Grade Management

The product concept includes:

- recorded grades
- achieved points
- weighting
- current overall grade
- target-grade calculations

This feature may be implemented incrementally and is not required for every early frontend slice.

### AI-Assisted Learning

The product may use an external LLM provider.

Potential providers:

- OpenAI
- Google Gemini
- xAI Grok

The final provider is intentionally undecided.

The frontend must not be tightly designed around the branding or behavior of one provider.

AI-assisted features include:

- document analysis
- explanations
- definitions
- examples
- summaries
- flashcards
- extraction of dates and other structured information

AI output should be presented as generated or suggested information where appropriate.

## Processing States

Some operations will not complete immediately.

The frontend must conceptually support states such as:

- idle
- queued
- processing
- completed
- failed

Examples include:

- document analysis
- summary generation
- flashcard generation

The frontend must not assume that AI-generated results always appear instantly.

The implementation of background processing itself belongs to the backend repository.

## MVP Priorities

### Core MVP

- registration and login
- protected app area
- course management
- PDF / lecture material upload UI
- slide/page-based document experience
- slide-linked personal notes and markings
- display of extracted lecture information
- display and confirmation of detected dates
- course calendar
- AI-generated summaries
- AI-generated flashcards

### Secondary / SHOULD

- AI explanations
- examples and terminology explanations
- unresolved-note follow-up
- grade management
- target-grade calculations

### Not part of the initial MVP

- native iOS app
- native Android app
- LMS integrations
- university-wide B2B administration
- complex collaboration
- community functionality
- full payment system
- institutional licensing management

## Frontend Tech Stack

The intended frontend stack is:

- Next.js
- React
- TypeScript / TSX
- HTML5
- Tailwind CSS

Development environment:

- Visual Studio Code
- Git
- GitHub

Frontend quality tools:

- ESLint
- Playwright

Deployment target:

- Vercel

Backend / infrastructure exists separately and may include Supabase services.

## Design Direction

The product should feel like a modern, calm and trustworthy EdTech application.

Design priorities:

- clarity
- readability
- strong hierarchy
- simple navigation
- calm visual language
- responsive layouts
- useful empty states
- useful loading states
- understandable errors
- accessible forms
- consistent components

Avoid:

- excessive gradients
- stereotypical AI visuals
- unnecessary animations
- cluttered dashboards
- excessive cards without hierarchy
- inconsistent spacing
- inconsistent components
- visually impressive UI that makes the study workflow harder to understand

The product should feel like one coherent study environment rather than a collection of unrelated tools.

## UX Principle

The user should always understand:

- which course they are in
- which lecture they are viewing
- which document is active
- which slide an annotation belongs to
- where generated information came from
- whether information was detected, generated, or confirmed by the user

Preserve context throughout the interface.

## Product Differentiation

Existing products already provide individual capabilities such as:

- document uploads
- AI summaries
- flashcards
- AI tutors
- learning plans
- study calendars

Therefore the product must not be positioned around one isolated AI feature.

The planned differentiation is the combination of:

- course context
- specific lecture context
- slide-level annotations
- detected deadlines
- calendar
- academic performance
- AI learning material
- exam preparation

within one connected workflow.

## Data and Backend Assumptions

The frontend may consume data representing concepts such as:

- User
- Course
- Lecture
- Document
- Slide
- Annotation
- CalendarEvent
- Grade
- Summary
- Flashcard
- ProcessingJob

These are conceptual domain entities.

Do not assume exact database table names, column names, relationships or API shapes unless they already exist in this repository or are explicitly provided by the backend.

## Security Context

Security is an important product requirement.

From the frontend perspective:

- never expose secrets
- never expose service-role credentials
- never hardcode API keys
- never store passwords manually
- use Supabase Auth through the available integration
- treat uploaded documents as untrusted input
- treat AI output as untrusted generated data
- do not bypass backend authorization
- do not invent elevated backend access to make a frontend feature work

Authorization, RLS, database security and sensitive server-side enforcement belong to the backend repository.

## Source of Truth

This file describes the permanent project and product context.

Task-specific behavior should be defined by the individual vibe-coding prompt.

When a task prompt defines a narrower scope, follow that scope while preserving the project context defined here.

Do not expand a task merely because another feature appears in this file.

## Decision Rule

When implementing a requested frontend feature:

1. understand the existing frontend
2. preserve the product context defined here
3. follow the task-specific prompt
4. reuse existing frontend patterns
5. stay inside the frontend repository boundary
6. do not invent backend behavior
7. surface missing backend dependencies clearly
