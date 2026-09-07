# Icon hover color audit

**Status:** **Applied** (2026-09-07). Standard rule: +1 darker shade within the same color family; neutrals stay `muted-foreground` → `foreground`; colored ghost buttons get explicit `hover:text-*` to override `accent-foreground`. Hex bases (`#0150AC`) kept; hover darkened to `#01408A` without converting to a theme token. Bucket C semantic icons rest in-family (`primary/70`→`primary`, `destructive/70`→`destructive`).

**Scope:** Icon / icon-button color hovers (`hover:text-*`, `hover:fill-*`, `hover:stroke-*`, and colored `Button variant="ghost"` icon controls). Non-icon text buttons, filled CTAs, tabs, and card row hovers are listed only when they share the same broken icon-color pattern.

**Theme context:** Project uses Tailwind + CSS variables in `app/globals.css` (`--primary`, `--destructive`, `--muted-foreground`, `--accent` / `--accent-foreground`). Brand blue often appears as hardcoded `#0150AC`. `components/ui/button.tsx` ghost/outline variants apply `hover:text-accent-foreground` (near-white on accent), which overrides same-element icon colors.

---

## Proposed standard rule (approve before applying)

### Rule: **one shade darker within the same color family**

| Base type | Hover rule | Examples |
|-----------|------------|----------|
| Tailwind scale (`text-{color}-{N}`) | Same family, **+1 shade step** darker | `text-red-600` → `hover:text-red-700`; `text-blue-600` → `hover:text-blue-700`; `text-gray-400` → `hover:text-gray-500` |
| Theme semantic on a **neutral** icon (`text-muted-foreground`) | Stay in neutral theme family | `hover:text-foreground` (already correct pattern) |
| Theme semantic that **is** the icon’s identity (`text-destructive`, `text-primary`, `text-[#0150AC]` on the control) | Darken **within that family**, do **not** jump to `accent-foreground` / another hue | `text-destructive` → `hover:text-destructive` + optional opacity, **or** map brand hex to a token first (see “needs a token”) |
| Ghost `Button` with color on the **button** (`className="… text-blue-600"`) | Override ghost’s `hover:text-accent-foreground` with an explicit same-family hover | `text-blue-600 hover:text-blue-700 hover:bg-blue-50` (bg already often correct; fix **text** only) |
| Ghost `Button` with color only on the **child SVG** (`<Edit className="text-blue-600" />`) | Child color usually wins today (no text hover). Prefer moving color + hover onto the button (or add matching `hover:text-*` on the SVG) so hover is explicit and consistent | Same +1 step rule |

### Explicitly out of rule (do not “fix” into shade steps)

- **Filled / outline CTAs** that intentionally invert to white (`text-[#0150AC] hover:text-white`) — not icon-tint hovers.
- **Tabs / nav labels** using `text-muted-foreground hover:text-foreground` without being icon-only controls.
- **Marketing copy** color changes (blog titles, footer links) unless they are icon buttons.

### Direction consistency

- Prefer **darker** on hover (base → +1). Do **not** lighten (e.g. `teal-300` → `teal-200`, `#0150AC` → `#60A5FA`) unless the surface is dark and the base is already a light tint (document those as dark-surface exceptions).

---

## Summary of findings

| Bucket | Count (approx.) | Same family? | Jump consistency |
|--------|-----------------|--------------|------------------|
| A. Explicit `hover:text-*` on icon-ish controls | ~50 | Mixed | Jumps of **+1, +2, +4**, or **lighter** |
| B. Colored ghost icon buttons **without** `hover:text-*` (inherit `hover:text-accent-foreground`) | **Many** (dozens of table action icons) | **No** — e.g. red/blue/green → accent (blue-violet / near-white) | Systemic |
| C. Neutral → primary/destructive on purpose (promote / remove) | 4 | **No** | Semantic, not shade |
| D. Hardcoded hex / rgb | See section | Flagged — **needs a token** | Do not auto-convert |

**Largest real bug class:** Bucket **B** — colored icon action buttons using `Button variant="ghost"` with `text-red-600` / `text-blue-600` / `text-destructive` / `text-[#0150AC]` on the button (or relying on accent hover). On hover the icon leaves its color family.

**Reference “already correct” example:** `WorkflowFieldsEditor` — `text-red-600 hover:text-red-700` (+1 step, same family).

---

## A. Explicit icon hover:text inventory

Columns: **File / component**, **Base**, **Current hover**, **Same family?**, **Shade jump**

### Cross-family or wrong direction (fix after approval)

| File + component | Base | Current hover | Same family? | Jump |
|------------------|------|---------------|--------------|------|
| `components/resident/wallet/ResidentWalletCard.tsx` (Eye/EyeOff toggle) | `text-muted-foreground` | `hover:text-blue-200` | **No** | muted → blue-200 |
| `components/estate-users/EstateUsersPage.tsx` (View `Eye` button) | `text-[#0150AC]` | `hover:text-[#60A5FA]` | Same hue family, but hex; **lighter** | dark brand blue → blue-400-ish (wrong direction) |
| `components/maintenance/MaintenanceScheduleCalendar.tsx` (prev/next) | `text-muted-foreground` | `hover:text-[#0150AC]` | **No** (neutral → brand hex) | muted → `#0150AC` |
| `app/dashboard/users/page.tsx` (delete-style icon control) | `text-muted-foreground` | `hover:text-destructive` | **No** | muted → destructive |
| `components/dashboard/admin/community/GroupMemberRow.tsx` (promote) | `text-muted-foreground` | `hover:text-primary` | **No** | muted → primary |
| `components/dashboard/admin/community/GroupMemberRow.tsx` (remove) | `text-muted-foreground` | `hover:text-destructive` | **No** | muted → destructive |
| `components/chat/ChatHeader.tsx` (clear/delete affordance) | `text-muted-foreground` | `hover:text-destructive` | **No** | muted → destructive |
| `app/dashboard/resident/map/components/PlacesPanel.tsx` (icon button) | `text-teal-300` | `hover:text-teal-200` | Yes | **300→200 (lighter)** — opposite of proposed rule |
| `app/dashboard/admin/visitor/page.tsx` / `app/dashboard/staff/visitor/page.tsx` (Verify control) | `text-blue-600` | `hover:text-blue-800` | Yes | **600→800 (+2)** — should be +1 → `blue-700` |
| `components/ui/dialog.tsx` (close ✕) | `text-gray-400` | `hover:text-gray-600` | Yes | **400→600 (+2)** — should be +1 → `gray-500` |
| Auth / landing password & close icons (`login`, `signup`, `BookDemoModal`) | `text-gray-500` | `hover:text-gray-900` | Yes | **500→900 (+4)** — should be +1 → `gray-600` |

### Same-family / theme-neutral (mostly OK; normalize jump only if we apply the rule globally)

| File + component | Base | Current hover | Same family? | Jump |
|------------------|------|---------------|--------------|------|
| `components/request-mgt/WorkflowFieldsEditor.tsx` (remove field) | `text-red-600` | `hover:text-red-700` | Yes | **600→700 (+1)** ✅ target pattern |
| Many password-eye / clear-search / bell / help / membership icons | `text-muted-foreground` | `hover:text-foreground` | Yes (neutral theme) | theme intensify — **keep** as the neutral-icon rule |
| `components/ui/help-tooltip.tsx`, `InvitePhoneNumberField.tsx`, `NotificationsBell.tsx`, `MembershipSwitcher.tsx`, `CommunityMessageInput.tsx`, layout sidebar toggles, settings password toggles, etc. | `text-muted-foreground` | `hover:text-foreground` | Yes | theme |
| `components/dashboard/NotificationsInbox.tsx` | `text-destructive` | `hover:text-destructive` | Yes | none (no shade shift) |

### Out of icon-tint scope (listed for completeness; do not change under this task)

| File | Base | Hover | Notes |
|------|------|-------|-------|
| `app/auth/login/page.tsx` outline CTA | `text-[#0150AC]` | `hover:text-white` | Intentional invert |
| Landing `blogSection` / `footer` / `navbar` / `featuresSection` / `trustedBy` | various | various | Marketing text/links, not icon buttons |
| Chart period toggles, status tabs, settings tabs | `text-muted-foreground` | `hover:text-foreground` | Text/tab chrome |

---

## B. Systemic: ghost `Button` + colored icon (no explicit `hover:text-*`)

These put color on the **button** (or use ghost default hover) so `hover:text-accent-foreground` from `components/ui/button.tsx` can pull the icon **out of its color family** (red/green/amber/brand → accent).

**Proposed fix after approval:** for each, add explicit `hover:text-{family}-700` (or destructive/primary equivalent) and keep existing `hover:bg-*` if present. Do **not** change sizes/spacing.

### Representative instances (pattern repeats across roles)

| File + component | Base color | Current hover (effective) | Same family? | Jump |
|------------------|------------|---------------------------|--------------|------|
| `components/admin/announcement-card/page.tsx` edit | `text-blue-600` | ghost → `accent-foreground` | **No** | blue → accent |
| `components/admin/announcement-card/page.tsx` delete | `text-destructive` | ghost → `accent-foreground` | **No** | destructive → accent |
| `app/dashboard/admin/meter/page.tsx` / `staff/meter/page.tsx` Unlink / Link / Eye / KeyRound | `text-amber-600`, `text-blue-600`, `text-emerald-600`, `text-orange-600` | ghost accent + tinted `hover:bg-*` | **No** (text) | color → accent |
| `app/dashboard/admin/visitor/page.tsx` / `staff/visitor/page.tsx` Edit row | `text-blue-600` | `hover:bg-blue-50` only | **No** (text → accent) | blue → accent |
| `app/dashboard/admin/visitor/page.tsx` / `staff/visitor/page.tsx` Delete | `text-destructive` | `hover:bg-destructive/10` only | **No** | destructive → accent |
| `app/dashboard/*/operations-reporting/**` TypeCard / EntriesList edit/delete | `text-[#0150AC]`, `text-destructive` | ghost accent | **No** | brand/destructive → accent |
| `components/designations/DesignationsManager.tsx` Pencil / Trash | child `text-blue-600` / `text-red-600` | often no button text hover | Child may hold color; still inconsistent | n/a / latent |
| User-mgmt action columns (`EstateUsersPage`, company/super-admin/energy-provider users, bills pages, etc.) | child `text-blue-600` / `text-red-600` / `text-green-600` | ghost on parent | Child SVG usually keeps color (no hover tint) **or** parent-colored variants flip to accent | Inconsistent: some icons don’t tint; parent-colored ones cross family |
| Marketplace approve/reject/delete (`company` / `super-admin` marketplace) | `text-green-600`, `text-amber-600`, `text-destructive` | ghost accent | **No** | → accent |
| Revenue/Expense head & entry trash/pencil cards | `text-blue-600` / `text-red-600` | often `hover:bg-muted` only | Risk if color is on button | → muted/accent |
| Asset / maintenance destructive icon buttons | `text-destructive` | ghost accent | **No** | → accent |

*Full grep set for this pattern: `variant="ghost"` + `text-(red|blue|green|amber|orange|emerald|destructive)` or `text-[#0150AC]` across `app/dashboard/**` and `components/**`. Count is high because the same table-actions pattern is copied per role.*

---

## C. Semantic cross-family (flag; decide intentionally)

These use muted as rest state and a **semantic** hover (primary = promote, destructive = remove). That violates “same color family” if applied literally.

**Recommendation after approval:** either

1. **Rest in the semantic family** (`text-primary/70 hover:text-primary`, `text-destructive/70 hover:text-destructive`), or  
2. Keep as documented exceptions (not shade-step icons).

| File | Base | Hover | Same family? |
|------|------|-------|--------------|
| `GroupMemberRow.tsx` | muted | primary / destructive | No |
| `ChatHeader.tsx` | muted | destructive | No |
| `users/page.tsx` | muted | destructive | No |

---

## D. Hardcoded hex / rgb — **needs a token** (do not auto-convert)

Do **not** silently replace these until you confirm the closest token.

| File | Hex / value | Role | Suggested candidates (for your confirmation) |
|------|-------------|------|-----------------------------------------------|
| Widespread brand | `#0150AC` | Icon / button base | `text-primary`? custom `brand`? keep hex + define `--brand` |
| `EstateUsersPage` View hover | `#60A5FA` | Hover (≈ Tailwind `blue-400`) | Should be darker brand step, not lighter blue-400 |
| `MaintenanceScheduleCalendar` | `#0150AC` hover from muted | Hover | Brand token |
| Landing / features | `#6B7280`, `#374151`, `#FFFFFF80`, `#0150AC` | Mostly non-icon | Flagged only; out of icon scope unless you expand |
| Community modals | `#0052CC`, `#0047B3`, `#d0dff2` | CTA / chrome | Separate from icon-tint pass |

---

## Apply status

1. ✅ Rule locked and applied across icon / icon-button hovers.
2. ✅ Bucket B: colored ghost icon buttons now use explicit same-family `hover:text-*`.
3. ✅ Bucket A wrong-direction / wrong-jump / cross-family rows fixed.
4. ⏸️ Bucket D: hex bases kept (`#0150AC` → hover `#01408A`); still **needs a token** if you want theme migration later.
5. ✅ Bucket C: rest-in-semantic-family applied.

---

## What will not be changed under this task

- Non-icon button backgrounds, card hovers, link underlines, filled primary CTAs.
- Icon **size**, padding, transition duration, or layout.
- Hex → token conversion without your confirmation.
