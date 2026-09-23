# Практика · Powered by HackAlem — UI guidance

## Context and goals

**Design intent:** make the path from a business need to a confirmed team result understandable at a glance, with the task and its readiness score as the main content.

This is a Russian language demo for businesses and student teams on a laptop, with responsive support down to 320 px. It is an application with a catalog, editor, task details and two workspaces. The supplied HackAlem and Riipen extracts are visual references; their inferred audiences and surfaces had low confidence. Riipen describes experiential learning for learners, educators and employers. Its storefront classification does not apply here. The reference page inventories (HackAlem: 136 links, 61 buttons, 1 navigation, 1 list; Riipen: 148 links, 82 buttons, 42 navigation items, 38 cards, 10 inputs) describe those pages and are not density targets for this MVP.

The interface must keep publication, readiness, proposals and progress distinguishable by text and numbers as well as color. Every route must use the same visual language. The main flow must work without an API key or account.

## Design tokens and foundations

`src/app/tokens.css` is the source of truth. Components must use semantic or component tokens, not raw hex values or local spacing values. Primitives should change only to revise the visual system as a whole.

| Layer           | Tokens                                                                                                                                                                                                                                                  | Contract                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Primitive color | `--color-ink-950`, `--color-ink-600`, `--color-blue-600`, `--color-blue-50`, `--color-white`, `--color-gray-50`, `--color-gray-200`, `--color-red-700`                                                                                                  | Palette; new components should not reference primitives directly.           |
| Semantic color  | `--color-background`, `--color-surface`, `--color-surface-soft`, `--color-text`, `--color-text-secondary`, `--color-border`, `--color-primary`, `--color-primary-hover`, `--color-primary-soft`, `--color-error`, `--color-error-soft`, `--color-focus` | Surfaces, text, actions, feedback and focus.                                |
| Component color | `--button-primary-bg`, `--button-primary-fg`, `--button-primary-hover`, `--button-secondary-bg`, `--button-secondary-fg`, `--field-bg`, `--field-border`, `--card-bg`, `--card-border`                                                                  | Controls and cards.                                                         |
| Space           | `--space-1` through `--space-16`                                                                                                                                                                                                                        | 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 px.                           |
| Type            | `--font-xs` through `--font-4xl`                                                                                                                                                                                                                        | 12 / 14 / 16 / 20 / 24 / 32 / 40 / 56 px; body is 16 px at 1.6 line height. |
| Shape / motion  | `--radius-xs`, `--radius-sm`, `--radius-md`, `--radius-pill`; `--motion-instant`, `--motion-fast`, `--motion-normal`                                                                                                                                    | 6 / 12 / 20 px / pill; 150 / 200 / 300 ms.                                  |

The UI must use locally bundled DM Sans with Segoe UI and sans-serif fallbacks. Headings should use 700 weight, body 400, control labels 600–700. Text below `--font-xs` must not be introduced. The main surface should be white over a cool neutral background; dark ink is reserved for the catalog introduction and toast. Blue communicates actions and confirmed progress; red communicates errors. Orange should be a restrained editorial accent and must never be the only status signal. Shadows should be limited to a subtle hover elevation.

Implemented contrast pairs: primary blue on white **7.10:1**, secondary text on white **7.46:1**, muted hero text on dark ink **14.45:1**, error text on its light surface **6.79:1**. Any new foreground/background pair must be checked before use.

## Component-level rules

Every interactive component must define default, hover, focus-visible, active, disabled, loading and error behavior. Loading must preserve dimensions and expose a text status. Error must name the problem and next action. For a static item, inapplicable interaction states must belong to its containing control rather than appear as decorative effects.

| Component            | Anatomy, variants and tokens                                                                                                                           | States                                                                                                                                                                                                                | Keyboard, pointer, touch, responsive and edge cases                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header/navigation    | Brand, four links, demo role select. Current route uses `aria-current="page"`; `--space-2/3`, `--font-sm`.                                             | Default secondary text; hover soft surface; focus-visible 3 px ring; active primary soft + text; disabled link omitted; loading keeps header stable; route error leaves navigation usable.                            | Tab/Enter follow links; native select uses arrows and Enter/Space. Click/tap use the same destination. At ≤520 px show four signed icon/label cells with accessible full names. Long team names must not widen header. |
| Button/link          | Primary, secondary and quiet link variants; supporting icon, named action; `--space-3/5`, `--font-sm`, `--radius-xs`, minimum 44 × 44 px.              | Default primary blue; hover darkens; focus-visible ring; active shifts 1 px; disabled stays readable; loading says what is happening and blocks repeat submit; error appears near action or in alert.                 | Enter activates links/buttons; Space activates buttons; click/tap activate once. Long labels may wrap. Pending saves must retain entered data.                                                                         |
| Search/filter/select | Named search, topic chips, readiness select and role select; `--space-2/4`, `--font-sm/md`, `--field-border`.                                          | Default clear border; hover stronger border; focus-visible ring; active chip has soft fill and selected text; disabled readable; loading retains filter and announces update; error preserves input and offers retry. | Tab reaches all controls; native selects use platform keys. Click/tap work without hover. Chips should wrap. Zero results must name active filters and offer reset.                                                    |
| Form field/checkbox  | Label, control, optional help and inline error; 48 px field, `--font-md`, `--space-2/4`; checkbox label clickable.                                     | Default field border; hover stronger border; focus-visible ring; active cursor/checked state; disabled legible; loading retains value; error uses `aria-invalid`, linked message and error color.                     | Tab, typing, arrows and Space follow native behavior. Click/tap may target label. Pasted text wraps. Invalid fields remain editable and errors must not erase answers.                                                 |
| Task card            | Company mark, topic, text status, title, summary, metadata, numeric score and descriptive open link; `--space-3/6/8`, `--font-sm/lg`, `--card-radius`. | Default bordered surface; hover/focus-within stronger border; active title follows task; disabled unused for published cards; loading skeleton with announced status; error recoverable message.                      | Enter/click/tap open link. At ≤760 px score moves below content. Long titles and summaries must wrap; full details remain reachable. Empty catalog uses explanatory panel.                                             |
| Readiness score      | Number `/100`, text level, progressbar, nine rows and next step; `--font-4xl` score, `--font-sm` rows.                                                 | Static display has no hover/active/disabled/focus target; edit link follows link states. Loading says preliminary and keeps public confirmed score; error shows last confirmed value plus alert.                      | Progressbar must expose name/value. Narrow rows stack. Missing data is explicit; low score must not hide publish or proposal.                                                                                          |
| Proposal/result      | Team identity, idea, plan, deadline, link, decision actions and first result; status badge contains text.                                              | Static card uses controls' hover/focus/active/disabled states. Loading blocks duplicate decisions; error says save failed. Selected/rejected must be written, not color only.                                         | Keyboard compares proposals in DOM order; click/tap follow same action. Long URLs wrap; many proposals stack; zero proposals show empty state. Confirmation must not grant points twice.                               |
| Notice/empty/loading | Message and close button; empty heading, reason, action; skeleton plus announced text.                                                                 | Default notice high contrast; close hover/focus/active visible; disabled unused; loading announced; error uses `role="alert"`. Static surfaces must not gain decorative focus.                                        | Close works with Enter/Space/click/tap. Content wraps at 320 px. Empty state should name role and next useful action.                                                                                                  |

No critical information may appear only on hover. Cards should use one principal title link; other links must have distinct accessible names. Breakpoints at 1180, 1000, 760 and 520 px should adapt layout; 320 px must remain usable. New grids should use `minmax(0, 1fr)` and user content should wrap.

## Accessibility requirements and testable acceptance criteria

Target is WCAG 2.2 AA. Each rule below must pass in the browser:

1. A keyboard-only pass from skip link through header, filters, cards, forms and decisions must show a visible 3 px focus ring on every focused control. No tab stop may be hidden behind the sticky header.
2. Normal text must reach 4.5:1 contrast; large text and nontext control boundaries must reach 3:1. Check each semantic token pair, including hover, disabled and error.
3. Every interactive target must be at least 44 × 44 px or have equivalent separated target space. Measure at 320, 390 and desktop widths.
4. At 320 px width and 200% zoom, the document must not scroll horizontally; labels, task titles, errors and URLs must not clip.
5. Role selector, chips, proposal actions, publication confirmation and toast close must work without a mouse. Names, `aria-current`, `aria-invalid`, progress values and live announcements must match visible state.
6. Readiness, decisions and validation errors must remain understandable with color removed. Check visible text and numeric readiness.
7. Reduced-motion mode must remove nonessential transitions and smooth scrolling. Motion must not reveal required information.

## Content and tone standards

Copy must be concise, confident and specific. Actions must name their result: **«Опубликовать задачу»**, **«Выбрать команду»**, **«Подтвердить первый результат»**. Errors must state a fix: **«Укажите название задачи, чтобы опубликовать её»**. Loading should say **«Сохраняем карточку…»**, not just **«Загрузка»**. Empty search should say **«По этим фильтрам задач нет. Сбросьте тему или уровень готовности»**. Rating copy must say **«20/100 · Черновик»** and name missing fields. It must not imply that AI judges truth or feasibility.

## Anti-patterns, prohibited implementations and migration

- Components must not contain one-off hex colors, font sizes or spacing values outside the token scale.
- Critical controls must not be icon-only without an accessible name. Focus indicators must not be removed or clipped.
- Status must not depend on color alone. Faint text and pills must not replace explanation.
- Failed mutations must not leave a polished state that suggests progress was saved.
- New sidebars, gradients, illustrations and heavy shadows should not fill space without a user need.
- `globals.css` still contains legacy layout rules. `redesign.css` overrides them; touched legacy declarations should be migrated instead of adding a third override layer. Aliases in `tokens.css` are transitional.

## QA checklist

- [ ] Every route uses shared navigation, type scale, surfaces and action styles.
- [ ] Keyboard, focus, skip link and accessible mobile navigation pass.
- [ ] Contrast, target size, reduced motion, 320 px and 200% zoom checks pass.
- [ ] Long content, empty filters, loading, validation and server errors remain readable.
- [ ] Low-readiness publication, proposals, first result and points still work.
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e` and `npm run build` pass.
