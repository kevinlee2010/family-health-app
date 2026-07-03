# Frontend Design Workflow

## Purpose
Use this workflow whenever Alfred routes a frontend UI task to Impeccable. The goal is not decoration; the goal is a more credible, usable, and memorable product interface that strengthens the student's project or research track.

## Routing
Before work begins, Alfred states:
- Delegated agent: Impeccable
- Expected output format: design direction, affected files/routes, implementation notes, verification checklist
- Track tag: project development or independent research

## Intake
Impeccable checks, in order:
1. Run `node .agents/skills/impeccable/scripts/context.mjs` from the project root. If the task names a route, app, or file, run it with `--target <path>`.
2. If the script reports `NO_PRODUCT_MD`, read `.agents/skills/impeccable/reference/init.md` and initialize project context before UI work.
3. The current project goal and audience.
4. Existing frontend files, theme tokens, CSS, or component patterns.
5. PRODUCT.md and DESIGN.md if present.
6. The specific route, component, or screen requested.

If PRODUCT.md or DESIGN.md is missing and the task is substantial, ask Alfred to route Nate to create a lightweight version before major UI work.

## Design Pass
Impeccable defines a design direction before editing:
- User context: who uses this, where, and why.
- Interface job: what the screen must help the user do.
- Hierarchy: what the user should notice first, second, and third.
- Color strategy: restrained, committed, full palette, or drenched.
- Typography strategy: readable body text, clear heading scale, line length capped around 65-75 characters.
- Layout strategy: spacing rhythm, grid/flex structure, density, and responsive behavior.
- Motion strategy: purposeful feedback only, with reduced-motion support.

## Implementation Rules
- Respect existing design tokens and components before inventing new ones.
- Prefer real product structure over decorative sections.
- Avoid nested cards, generic identical card grids, default purple gradients, gradient text, side-stripe accents, decorative grid backgrounds, and excessive border radius.
- Verify body text contrast at 4.5:1 or better, and large text at 3:1 or better.
- Use stable dimensions for fixed-format controls, boards, counters, tiles, and toolbars.
- Ensure text never overflows or overlaps on mobile or desktop.
- Do not add new fonts, packages, images, or UI libraries without approval.

## Verification
Default tier: Standard.
Use Full verification for public, admissions-facing, graded, or portfolio-quality deliverables.

Standard verification includes:
- Output exists and compiles or renders.
- Desktop and mobile visual checks.
- No obvious text overflow, overlap, broken spacing, or clipped controls.
- Key interactive states checked.
- Known gaps summarized.

Full verification includes Standard plus:
- Before/after summary.
- Contrast/accessibility spot checks.
- Responsive checks across at least three viewport widths.
- Corrective action for any visual defects found.

## Deliverable Note
Every frontend deliverable must include:
- Summary of what was produced and known gaps.
- Verification tier used and what was checked.
- Track tag.
