# Работа в Астане, поиск персонала и публикация вакансий

## Mission
Create implementation-ready, token-driven UI guidance for Работа в Астане, поиск персонала и публикация вакансий that is optimized for consistency, accessibility, and fast delivery across dashboard web app.

## Brand
- Product/brand: Работа в Астане, поиск персонала и публикация вакансий
- URL: https://astana.hh.kz/
- Audience: authenticated users and operators
- Product surface: dashboard web app

## Style Foundations
- Visual style: clean, functional, implementation-oriented
- Main font style: font.family.primary=hh sans, font.family.stack=hh sans, Helvetica Neue, sans-serif, font.size.base=14px, font.weight.base=400, font.lineHeight.base=20.02px
- Typography scale: font.size.xs=14px, font.size.sm=16px, font.size.md=22px
- Color palette: color.text.primary=#468ffd, color.text.secondary=#2a3137, color.surface.base=#000000, color.text.inverse=#768694, color.surface.muted=#ffffff, color.surface.raised=#f1f4f9
- Spacing scale: space.1=8px, space.2=12px, space.3=16px, space.4=24px, space.5=36px
- Radius/shadow/motion tokens: radius.xs=16px, radius.sm=20px, radius.md=24px, radius.lg=100px | shadow.1=rgba(0, 0, 0, 0) 0px 0px 0px 0px, shadow.2=rgba(112, 144, 176, 0.15) 0px 3.69585px 11.0876px 0px | motion.duration.instant=100ms, motion.duration.fast=200ms

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: buttons (257), links (165), cards (95), inputs (8), navigation (3), lists (3).

- Extraction diagnostics: Audience and product surface inference confidence is low; verify generated brand context.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.