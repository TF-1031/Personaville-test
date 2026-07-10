# Personaville v1.0

Personaville is a static, workbook-driven offer database for reviewing, validating, publishing, and exporting market personas. Version 1.0 ships as a GitHub Pages-ready web application backed by an Excel workbook (`database/persona-db.xlsx`) and a generated JSON database (`database/persona-db.json`).

> **Primary audience:** developers and maintainers who need to understand the application, update offer data safely, and publish the resulting static site.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Why Personaville Was Built](#why-personaville-was-built)
- [Core Architecture](#core-architecture)
- [Workbook Tab Descriptions](#workbook-tab-descriptions)
- [JSON Database Structure](#json-database-structure)
- [Database Health System](#database-health-system)
- [Pricing Schedule Architecture](#pricing-schedule-architecture)
- [Modifier Architecture](#modifier-architecture)
- [Disclaimer Architecture](#disclaimer-architecture)
- [Build Database Workflow](#build-database-workflow)
- [Publish Workflow](#publish-workflow)
- [Download Updated JSON Workflow](#download-updated-json-workflow)
- [GitHub Pages Deployment](#github-pages-deployment)
- [Folder Structure](#folder-structure)
- [Major Screens and Screenshot Placeholders](#major-screens-and-screenshot-placeholders)
- [Future Roadmap: v2.0](#future-roadmap-v20)
- [Changelog: v1.0](#changelog-v10)
- [Developer Notes](#developer-notes)

---

## Project Overview

Personaville provides a browser-based interface for a market persona offer database. The app lets a maintainer:

- Load the bundled JSON database immediately when the site opens.
- Rebuild the in-browser database from the Excel workbook after data edits.
- Review personas, speeds, pricing schedules, modifiers, icons, disclaimers, and health checks.
- Export one or more persona summaries through browser print/PDF workflows.
- Download an updated `persona-db.json` file for publication to GitHub Pages.

The application is intentionally static. It has no server, no build pipeline requirement, and no runtime database service. The canonical editable data source is the Excel workbook, while the deployed website reads the generated JSON file.

---

## Why Personaville Was Built

Personaville was built to solve a common maintenance problem: offer data is easiest for non-developer stakeholders to manage in a workbook, but users need a polished, searchable, publishable web experience.

The project bridges those needs by keeping Excel as the editing surface and using a static web app as the review, health-check, and publication surface. This design keeps the workflow lightweight while still giving developers a clear data model and repeatable publication path.

Key goals for v1.0:

1. **Workbook-first maintenance** — data teams can continue editing structured tabs in Excel.
2. **Static hosting** — the app can run on GitHub Pages with only HTML, CSS, JavaScript, JSON, and image assets.
3. **Safe publication** — maintainers can review health checks before replacing the published JSON.
4. **Developer clarity** — the workbook tabs, JSON structure, and client-side relationships are explicit and inspectable.
5. **Export support** — persona summaries can be printed or saved as PDFs from the browser.

---

## Core Architecture

Personaville v1.0 has three layers:

### 1. Static UI Shell

- `index.html` defines the application layout, navigation, major views, and global actions.
- `css/app.css` controls responsive layout, tiles, detail panels, health rows, print cards, and print media behavior.
- The app loads SheetJS from a CDN so workbook files can be parsed in-browser.

### 2. Client-Side Data Layer

- `js/database.js` owns the global `DB` state object, workbook parsing, bundled JSON loading, normalization, relationship enhancement, pricing helpers, and health checks.
- The app can load either:
  - `database/persona-db.json` through `fetch()`; or
  - a user-selected workbook through the Build Database file input.
- Loaded rows are normalized into arrays keyed by workbook sheet names.

### 3. Client-Side Rendering Layer

- `js/render.js` renders dashboards, persona tiles, detail panels, modifiers, health rows, export previews, and printable cards.
- `js/app.js` wires navigation and top-level browser events, including Build Database, Load Bundled Database, Download Updated JSON, print, and copy-summary actions.

### Data Flow

```text
Excel workbook (.xlsx)
        │
        │ Build Database in browser via SheetJS
        ▼
Raw workbook sheet arrays
        │
        │ normalizeDatabasePayload() + applyRawDatabase()
        ▼
Enhanced DB state
        │
        ├── Persona library rendering
        ├── Modifier rendering
        ├── Health checks
        ├── Export/print rendering
        └── Download Updated JSON

Bundled persona-db.json
        │
        │ fetch()
        ▼
Same enhanced DB state
```

---

## Workbook Tab Descriptions

The workbook is the canonical editing source. The generated JSON preserves workbook sheet names as top-level keys.

| Tab | Purpose | Notes |
| --- | --- | --- |
| `README` | Workbook-level notes for maintainers. | Informational; not used directly by the UI. |
| `00_Summary` | High-level workbook metrics. | Useful for workbook review and generated metadata. |
| `01_Settings` | Key/value settings such as generated date. | `GeneratedOn` may be used as the bundled JSON build timestamp. |
| `02_FamilyGroups` | Persona family group definitions. | Used as source-of-truth taxonomy for personas. |
| `03_PricingSets` | Pricing set definitions. | Supports pricing-set filters and labels such as Standard, 3 Months Free, and 3 Year Price Lock. |
| `04_Modifiers` | Modifier definitions. | Includes modifier IDs, names, categories, icon files, active state, and descriptions. |
| `05_Personas` | Primary persona records. | Includes persona ID, name, family group, pricing set, status, promo icon, feature flags, disclaimer ID, notes, and audit fields. |
| `06_SpeedOptions` | Speed rows for each persona. | Links personas to speed options, reference IDs, first paid prices, regular rates, schedule IDs, sort order, and active state. |
| `07_PricingSchedules` | Month-by-month or range-based pricing schedule rows. | Links to speed options by `ScheduleID` + `ReferenceID`. |
| `08_Disclaimers` | Disclaimer text records. | Linked from personas by `DisclaimerID`. |
| `09_Icons` | Icon registry. | Maps icon names and filenames to categories and notes. |
| `10_PersonaModifiers` | Persona-to-modifier join table. | Many-to-many relationship between personas and modifiers. |
| `11_AuditLog` | Audit/change history. | Present for governance; v1.0 UI does not depend on it. |
| `12_DataHealth` | Workbook-generated health summary and details. | Merged with browser-generated health checks in the Health view. |
| `99_Glossary` | Business/data glossary. | Informational for maintainers and developers. |

---

## JSON Database Structure

`database/persona-db.json` is a JSON object whose top-level keys match workbook tab names. Each sheet is represented as an array of row objects.

Simplified shape:

```json
{
  "README": [],
  "00_Summary": [],
  "01_Settings": [],
  "02_FamilyGroups": [],
  "03_PricingSets": [],
  "04_Modifiers": [],
  "05_Personas": [],
  "06_SpeedOptions": [],
  "07_PricingSchedules": [],
  "08_Disclaimers": [],
  "09_Icons": [],
  "10_PersonaModifiers": [],
  "11_AuditLog": [],
  "12_DataHealth": [],
  "99_Glossary": []
}
```

Important implementation details:

- The JSON file is loaded by `loadBundledDatabase()` from `database/persona-db.json`.
- Workbook uploads are parsed into the same shape before being applied to the app state.
- `SHEET_MAP` in `js/database.js` identifies the sheets that v1.0 actively uses.
- `enhanceDatabase()` creates runtime relationships that are not physically nested in the workbook:
  - personas receive `speeds` arrays;
  - speed options receive `schedules` arrays;
  - personas receive `modifiers` arrays;
  - personas receive a resolved `disclaimer` object;
  - personas and modifiers receive resolved icon paths and icon records.

### Runtime `DB` State

At runtime, the app uses a global `DB` object with these major properties:

- `raw` — normalized raw sheet data.
- `personas` — rows from `05_Personas` with enhanced relationships.
- `speedOptions` — rows from `06_SpeedOptions`.
- `schedules` — rows from `07_PricingSchedules`.
- `modifiers` — rows from `04_Modifiers`.
- `personaModifiers` — rows from `10_PersonaModifiers`.
- `disclaimers` — rows from `08_Disclaimers`.
- `icons` — rows from `09_Icons` with resolved paths.
- `health` — rows from `12_DataHealth`.
- `settings` — rows from `01_Settings`.
- `loadedFromWorkbook` — `true` only after Build Database loads a workbook.
- `downloadableRaw` — cloned raw workbook payload used for Download Updated JSON.

---

## Database Health System

The Database Health system combines workbook-provided checks with browser-generated checks.

### Goals

- Catch data problems before publishing.
- Make warnings and errors inspectable by record.
- Help maintainers understand whether a JSON download should be published.

### Sources

1. **Workbook health (`12_DataHealth`)**
   - Parsed and normalized by `normalizedWorkbookHealthRows()`.
   - Summary rows are preserved.
   - Supporting detail rows can be attached to relevant checks.

2. **Browser health (`buildHealth()`)**
   - Generated dynamically from loaded data.
   - Checks relationships and display assumptions used by the web UI.

### Examples of Browser Health Checks

- Total persona, speed option, and pricing schedule row counts.
- Personas missing `ModifiedBy` audit values.
- Duplicate pricing schedule rows.
- Overlapping pricing month ranges.
- Mixed promotion reference IDs.
- Invalid month labels.
- Broken references between personas, speed options, schedules, modifiers, and disclaimers.
- Missing or unresolved icons.
- Missing pricing coverage for expected month periods.
- Modifier expectation mismatches.

### Status Model

Health statuses are normalized around:

- `OK` — no issue detected.
- `WARN` — issue should be reviewed before publication.
- `BAD`, `ERROR`, `FAIL` — blocking or high-risk issue.

`Download Updated JSON` warns the user before downloading when blocking health rows exist.

---

## Pricing Schedule Architecture

Pricing is intentionally normalized so a persona can have multiple speed options and each speed option can resolve to one or more schedule rows.

### Key Tables

- `05_Personas` — owns the persona and pricing-set context.
- `06_SpeedOptions` — owns each speed option, `ReferenceID`, `FirstPaidPrice`, `RegularRate`, `ScheduleID`, and display order.
- `07_PricingSchedules` — owns display ranges and prices for one speed option schedule.

### Schedule Join Key

A schedule row belongs to a speed option when both values match:

```text
SpeedOptions.ScheduleID == PricingSchedules.ScheduleID
AND
SpeedOptions.ReferenceID == PricingSchedules.ReferenceID
```

This dual-key approach is important because `ReferenceID` can be reused across Standard, 3 Months Free, and Price Lock personas. `ScheduleID` + `ReferenceID` is the exact schedule key.

### Schedule Row Fields

Common fields in `07_PricingSchedules`:

- `ScheduleID` — schedule group identifier.
- `ReferenceID` — speed/reference identifier.
- `Sequence` — display order inside the schedule.
- `StartMonth` / `EndMonth` — structured month range.
- `DisplayLabel` — user-facing month label.
- `Price` — displayed monthly price.
- `DisplayAsFree` — when true, render the row as free.
- `StrikeThroughPrice` — optional comparison price for free months.

### Rendering Behavior

- Persona tiles show a compact pricing summary.
- Detail and print views render each schedule row as a card.
- Free rows display a “Free” price and may show a strike-through comparison value.
- Month labels come from `DisplayLabel` when present; otherwise the app falls back to `StartMonth`/`EndMonth`.

---

## Modifier Architecture

Modifiers represent reusable offer attributes such as special pricing, price lock, equipment, or other market-specific badges.

### Tables

- `04_Modifiers` defines available modifiers.
- `10_PersonaModifiers` links modifiers to personas.
- `09_Icons` registers icon files that can be used by modifier records.

### Relationship

```text
05_Personas.PersonaID
        │
        └── 10_PersonaModifiers.PersonaID
                    │
                    └── 04_Modifiers.ModifierID
```

Only active join rows are rendered. `DisplayOrder` controls modifier ordering for a persona.

### Runtime Enhancement

During `enhanceDatabase()`:

- modifier records receive `IconPath` and `IconRecord` fields;
- each persona receives a sorted `modifiers` array;
- missing modifier records are filtered out instead of breaking rendering.

### Expected Modifier Health

The health system can infer expected modifiers from pricing and speed data. For example:

- a 3 Months Free pricing set should include the matching modifier;
- a 3 Year Price Lock pricing set should include the matching modifier;
- a 1 Gig $40 offer can imply a specific modifier.

This helps catch persona/modifier join table omissions.

---

## Disclaimer Architecture

Disclaimers are reusable text records attached to personas.

### Tables

- `08_Disclaimers` defines disclaimer IDs, titles, text, and active state.
- `05_Personas` references disclaimers by `DisclaimerID`.

### Relationship

```text
05_Personas.DisclaimerID → 08_Disclaimers.DisclaimerID
```

### Rendering

- Persona detail panels render the attached disclaimer text.
- Printable persona cards include the disclaimer text.
- If a persona has no matching disclaimer, the app uses a graceful fallback message.

### Health

The browser health checks verify that persona disclaimer IDs resolve to existing disclaimer records. Missing disclaimers should be fixed before publication because they affect customer-facing export text.

---

## Build Database Workflow

Use Build Database when the workbook has changed and you want to validate the edited data in the browser.

1. Open the Personaville site in Chrome or Edge.
2. Click **Build Database**.
3. Select `database/persona-db.xlsx` or another edited workbook copy.
4. The browser parses the workbook with SheetJS.
5. The app applies the workbook data to runtime `DB` state.
6. The dashboard updates with build metrics.
7. Review **Database Health**.
8. If the build is acceptable, use **Download Updated JSON**.

Important notes:

- Build Database updates browser memory only.
- Build Database does **not** automatically edit `database/persona-db.json` in the repository.
- The downloaded JSON must be committed to publish data changes.
- SheetJS is loaded from a CDN in v1.0; workbook parsing needs network access unless the library is already cached.

---

## Publish Workflow

The in-app Publish Workflow panel reflects the intended v1.0 publishing sequence:

1. Select the updated workbook.
2. Build the database in the browser.
3. Review Database Health.
4. Download the updated JSON.
5. Replace `database/persona-db.json` in GitHub.
6. Let GitHub Pages publish the updated static site.

Recommended developer workflow:

```bash
# 1. Start from latest main when a remote exists
git checkout main
git pull --ff-only

# 2. Create a focused branch
git checkout -b update-personaville-data

# 3. Replace the generated JSON and, when applicable, workbook/assets
# database/persona-db.json
# database/persona-db.xlsx
# icons/*

# 4. Review changes
git status
git diff -- database/persona-db.json

# 5. Run available checks
git diff --check
python3 -m json.tool database/persona-db.json > /tmp/persona-db.json.validated

# 6. Commit and open a pull request
git add database/persona-db.json database/persona-db.xlsx icons
git commit -m "Update Personaville database"
```

---

## Download Updated JSON Workflow

The **Download Updated JSON** button is available only after Build Database successfully loads a workbook.

When clicked:

1. The app runs `currentBuildSummary()`.
2. If blocking health errors are present, the app asks for confirmation.
3. The app serializes the workbook-derived raw database with two-space indentation.
4. The browser downloads `persona-db.json`.
5. The dashboard shows instructions to replace `database/persona-db.json` in GitHub.

The downloaded file should be treated as the deployable data artifact for GitHub Pages.

---

## GitHub Pages Deployment

Personaville is GitHub Pages-friendly because the app is static.

### Required Published Assets

- `index.html`
- `css/app.css`
- `js/app.js`
- `js/database.js`
- `js/render.js`
- `database/persona-db.json`
- `database/persona-db.xlsx` for maintainer access, if desired
- `icons/*`

### Deployment Behavior

- GitHub Pages serves `index.html` as the app entry point.
- On page load, the app fetches `database/persona-db.json` relative to the site root.
- Browser navigation is view-based inside a single page; there are no additional routes.
- When `persona-db.json` changes on the Pages branch, the published site reflects the updated data after GitHub Pages rebuilds and CDN/browser caches refresh.

### Local Preview

Some browsers restrict `fetch()` from `file://` URLs. For local preview, use a simple static server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

---

## Folder Structure

```text
Personaville/
├── README.md                    # Project documentation and user guide
├── README.txt                   # Legacy quick-start notes
├── ROADMAP.md                   # Planning roadmap
├── NEXT_STEPS.md                # Pointer to active roadmap
├── index.html                   # Static app shell
├── css/
│   └── app.css                  # Application and print styles
├── js/
│   ├── app.js                   # Event wiring and top-level workflows
│   ├── database.js              # Data loading, normalization, relationships, health
│   └── render.js                # UI rendering and export/print rendering
├── database/
│   ├── persona-db.xlsx          # Canonical editable workbook
│   └── persona-db.json          # Deployable generated JSON database
├── icons/
│   └── *.png                    # Persona and modifier icon assets
├── exports/                     # Optional export staging folder
├── backups/                     # Optional manual backup folder
└── tests/
    └── download-updated-json.test.js
```

---

## Major Screens and Screenshot Placeholders

Use this section as the screenshot inventory for release notes or onboarding. Replace placeholders with actual screenshots when preparing formal docs.

### Dashboard

**Purpose:** Shows loaded database status, source banner, KPI cards, build summary, and publish workflow.

![Dashboard screenshot placeholder](docs/screenshots/dashboard-placeholder.png)

Suggested capture after loading bundled JSON and again after building from a workbook.

### Persona Library

**Purpose:** Search and filter personas, browse offer tiles, select personas for export, and open detailed persona panels.

![Persona Library screenshot placeholder](docs/screenshots/persona-library-placeholder.png)

Suggested capture with filters visible and one persona selected.

### Persona Detail Panel

**Purpose:** Shows selected persona metadata, feature chips, modifiers, speed schedules, notes, and disclaimer text.

![Persona Detail screenshot placeholder](docs/screenshots/persona-detail-placeholder.png)

Suggested capture with a persona that has modifiers and a multi-row pricing schedule.

### Modifier Library

**Purpose:** Lists modifier records, icons, categories, usage counts, and descriptions.

![Modifier Library screenshot placeholder](docs/screenshots/modifier-library-placeholder.png)

Suggested capture after verifying icons load from the `icons/` folder.

### Database Health

**Purpose:** Displays workbook and browser health checks with expandable detail rows for warnings and errors.

![Database Health screenshot placeholder](docs/screenshots/database-health-placeholder.png)

Suggested capture with an expanded warning row, if available.

### Export Center

**Purpose:** Selects personas for print/PDF export, previews printable cards, and copies text summaries.

![Export Center screenshot placeholder](docs/screenshots/export-center-placeholder.png)

Suggested capture with multiple personas selected for export.

### Settings

**Purpose:** Documents expected folder setup inside the app.

![Settings screenshot placeholder](docs/screenshots/settings-placeholder.png)

Suggested capture for maintainer onboarding docs.

---

## Future Roadmap: v2.0

Potential v2.0 work should focus on making the publication pipeline more automated, testable, and accessible.

### Data and Build Automation

- Add a repository script that regenerates `database/persona-db.json` from `database/persona-db.xlsx` without requiring a browser.
- Add CI validation for workbook-to-JSON conversion.
- Add schema checks for required columns and data types.
- Add duplicate ID detection for personas, modifiers, disclaimers, schedules, and icons.

### Health System Expansion

- Promote health checks into a shared validation module usable by both browser and CI.
- Add severity definitions and explicit publish-blocking rules.
- Export health reports as JSON or Markdown.
- Add direct links from health rows to affected personas in the UI.

### Accessibility and UX

- Continue improving keyboard navigation and focus management.
- Add screen-reader announcements for load, build, validation, and download states.
- Review and document color contrast.
- Add more complete empty states and no-results guidance.

### Publishing and Operations

- Add a GitHub Actions workflow for validation on pull requests.
- Add a deployment checklist template for maintainers.
- Add a release artifact containing the generated JSON and health report.
- Document cache-busting expectations after Pages deployment.

### Product Enhancements

- Add comparison views across pricing sets.
- Add richer persona export templates.
- Add configurable icon categories and display rules.
- Add change history views backed by `11_AuditLog`.

---

## Changelog: v1.0

### Added

- Static Personaville web app with Dashboard, Personas, Modifiers, Database Health, Export, and Settings views.
- Bundled JSON database loading from `database/persona-db.json`.
- In-browser workbook parsing through Build Database.
- Download Updated JSON workflow for publishing workbook-derived data.
- Runtime relationship enhancement for personas, speeds, schedules, modifiers, disclaimers, and icons.
- Search and filters for persona library.
- Persona detail panel with feature chips, modifiers, schedules, notes, and disclaimers.
- Modifier library with icon support and usage counts.
- Database Health view with expandable record-level details.
- Publish Workflow panel and build summary metrics.
- Multi-persona print/PDF export support.
- Copy text summary action for selected export personas.
- Graceful icon fallback behavior.

### Known Limitations

- Workbook-to-JSON generation is browser-driven in v1.0 rather than a repository build command.
- SheetJS is loaded from a CDN.
- Screenshot files referenced in this README are placeholders and are not required for the app to run.
- GitHub Pages deployment is static and depends on replacing the generated JSON file manually.

---

## Developer Notes

### Active Source Files

- `index.html` — markup and view containers.
- `css/app.css` — application layout and print styling.
- `js/database.js` — data model, loading, normalization, relationships, and health logic.
- `js/render.js` — DOM rendering functions.
- `js/app.js` — event listeners and user workflow actions.

### Useful Checks

```bash
# Verify JSON is syntactically valid
python3 -m json.tool database/persona-db.json > /tmp/persona-db.json.validated

# Check for whitespace errors before committing
git diff --check
```

### Maintainer Rule of Thumb

If workbook data changes, the publication artifact is not complete until `database/persona-db.json` has been regenerated, reviewed in the app, committed, and published through GitHub Pages.
