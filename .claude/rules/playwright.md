---
paths:
  - "e2e/**"
---

## Playwright tests

### Locators

Accessible names are added for users first, tests second: if an element can only
be reached with a CSS selector, that usually means a real user on assistive tech
can't find it either. Fixing the locator and closing the accessibility gap are
the same fix — so prefer changing the component over reaching down the list.

Order of preference when locating elements:

1. `page.getByRole(role, { name })` — try this first. Always.
2. `page.getByLabel(labelText)` — for form inputs with visible labels.
3. `page.getByPlaceholder(text)` — for inputs without labels (and fix the missing label if you can).
4. `page.getByText(text)` — for static visible text and confirmation messages.
5. `page.getByTestId(id)` — only when 1–4 genuinely do not work.
6. `page.locator(cssSelector)` — never. If you find yourself here, the component needs an accessible name.

For nested elements, first scope to a container and locate within it
(`roomColumn(page, "Attic")` → `attic.getByRole(...)`) rather than searching the
whole page. When more than one element still matches, disambiguate by meaning
with `filter({ has, hasText })` and `and()` before falling back to positional
`nth()` or `first()`.
Use `locator.describe()` on important reusable locators so traces read like
English instead of plumbing.

Computed-style and geometry assertions (`toHaveCSS`, `boundingBox`) need a
`Locator`, but it must still originate from `getByRole`/`getByText`—never from a
raw CSS selector.

### Assertions

Assert what the user experiences, not the implementation: computed CSS over
class names, `toBeHidden()` over `toHaveCount(0)` (reserve the latter for when
DOM absence is itself the requirement). Anchor every negative assertion to a
positive one that resolves _first_: assert the expected state is present, then
assert the unwanted thing is absent — otherwise the negative passes vacuously
against a page that simply hasn't rendered yet. Assert related facts on one
scoped locator (the time inside the meeting card, the card inside its room
column).

Check the rendered accessibility tree (a failure's error-context.md, `--ui`)
before writing locators against library markup; don't trust docs or memory.

### Waiting

- Never use `page.waitForTimeout` — there is always a better option. Never use
  `page.waitForLoadState('networkidle')`.
- To wait for a UI change, use a retrying assertion (`expect(locator).toBeVisible()`
  and friends). Do not use `locator.isVisible()` or other boolean probes as
  waits — they answer immediately.
- To wait for a network call, set up `page.waitForResponse` with a URL+method
  matcher _before_ triggering the action.
- Use `expect.poll()` for eventually consistent values (e.g. localStorage written
  by an effect). Use `toPass()` only to retry a whole assertion block, with an
  explicit timeout.
- Prefer `locator.fill()` for text entry; `pressSequentially()` only when the page
  genuinely depends on real key events. To wait for actionability without acting,
  use the real action with `trial: true`.
- For clock-driven UI (toasts, timers, "X minutes ago"), install `page.clock` at
  the top of the test and advance it explicitly.
- To prove something does _not_ happen, don't wait-and-check: arrange for the
  forbidden event to leave evidence in a value you already assert exactly, after
  a barrier event that must happen.
- If you are tempted to add a wait to "fix flakiness," stop. Flakiness means an
  assertion isn't matching the actual end state — find the real end state and
  assert on it.
