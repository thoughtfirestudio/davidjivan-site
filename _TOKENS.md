# Site Design Tokens — davidjivan.net

The single source of truth for the site's visual language. The live token values live in `style.css` `:root` — **this document defines what they are and how to use them. If you change a value, change `style.css` and update this file in the same commit.**

## The system

The site is a **warm light theme** with **semantic token names**. Roles are named for what they *do* (ink = primary text, mute = secondary, brass = the accent, line = hairline), not where they sit in a cascade. Values stay warm: paper background, dark ink, brass accent.

The museum (`tools/john-christology-museum.html` → `/logos`) and the tools are their **own dark artifacts** — they keep their dark palettes and are *not* copied into or from the site.

## Tokens

| Token | Value | Role |
|---|---|---|
| `--bg` | `#faf8f4` | page background — warm paper |
| `--panel` | `#f3f0ea` | cards, wells, surfaces |
| `--panel2` | `#ebe6dd` | raised / pressed surfaces |
| `--ink` | `#1a1a1a` | primary text |
| `--mute` | `#8c8780` | secondary text, captions |
| `--brass` | `#8b5e3c` | the accent |
| `--brass-dim` | `#c4a882` | accent sitting on surfaces |
| `--signal` | `#6b3a1f` | emphasis, hover, attention |
| `--line` | `#e0dbd0` | hairlines, borders |
| `--line-strong` | `#c4beb0` | rules that need presence |
| `--display` | Georgia serif | display type |
| `--body` | Georgia serif | body type |
| `--data` | SF Mono / Consolas | data, labels, UI microtext |
| `--dur` | `0.15s` | transition duration |
| `--max-w` | `640px` | reading measure |
| `--pad-x` | `24px` | horizontal page padding |

## Usage rules

- **Use the semantic names.** `var(--ink)` not `var(--text)`, `var(--brass)` not `var(--accent)`.
- **Labels and UI microtext use `--data`** (the mono stack). Body copy uses `--body`.
- **Links**: `color: var(--brass)` by default, `var(--signal)` on hover.
- **Cards/wells**: `background: var(--panel)`, hairline `var(--line)`.
- **Never invent parallel names.** If a role is missing (focus ring, success, error), add it to `:root` *and* this table in the same change — then use it everywhere.

## Legacy aliases (migration shims)

Pages still mid-migration reference the old structural names. `:root` aliases them to the semantic set so everything renders correctly today:

| Alias | Resolves to |
|---|---|
| `--surface` / `--surface-hi` | `--panel` / `--panel2` |
| `--text` / `--text-hi` / `--text-dim` | `--ink` / `--ink` / `--mute` |
| `--accent` / `--accent-dim` / `--accent-bright` | `--brass` / `--brass-dim` / `--signal` |
| `--border` / `--border-hi` | `--line` / `--line-strong` |
| `--font-body` / `--font-ui` | `--body` / `--data` |

**Retire them as pages adopt the semantic names.** When a page stops using every alias, remove the aliases from `:root` and this table — the goal is zero aliases.

## Related

- The Arc map page (`christianity-map.html`) and the Bible roadmap (`bible/`) use the semantic set.
- The museum's dark palette is defined *in* the museum file and is not part of this system.
