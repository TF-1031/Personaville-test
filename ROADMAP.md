# Personaville Roadmap

This roadmap organizes the agreed Personaville work into documentation-only planning milestones. It is intended to guide future product, data, accessibility, and engineering changes without changing the current application behavior.

## Goals

- Make the published Personaville site easier to understand, operate, and maintain.
- Improve the reliability of persona data loading, validation, and publishing.
- Strengthen accessibility, mobile usability, and export quality.
- Add repeatable checks so future GitHub Pages updates are safer.

## Milestone 1: Clarify the database loading experience

- Show a visible loading state while the published database is being fetched.
- Display a persistent, user-facing error if `database/persona-db.json` cannot be loaded.
- Keep the existing manual `Upload Workbook` and `Load Published Database` actions.
- Explain when users should rebuild from the workbook versus reload the bundled JSON.
- Add helpful empty states for dashboard, library, modifier, health, and export views before data is available.
- Add no-results messages when search or filters match no personas.

## Milestone 2: Improve persona presentation and health visibility

- Render real promo, modifier, and feature icons from the `assets/icons/` folder.
- Provide descriptive alt text for meaningful icons.
- Keep graceful missing-image fallbacks so incomplete icon data does not break the UI.
- Expand the health view so WARN and BAD rows include actionable details.
- Surface the affected persona, reference ID, schedule, disclaimer, or relationship whenever health checks find an issue.

## Milestone 3: Strengthen accessibility and mobile usability

- Add semantic labels for filters and file-upload controls.
- Make persona tiles keyboard-selectable through buttons or links instead of click-only cards.
- Verify visible focus states across the main interaction points.
- Review color contrast in the published experience.
- Add screen-reader announcements for database load success and failure.
- Confirm mobile layouts remain usable across dashboard, library, health, modifier, and export views.

## Milestone 4: Make data publishing repeatable

- Add a repository build step that regenerates `database/persona-db.json` from `database/persona-db.xlsx`.
- Document the expected non-developer workflow for editing the workbook, rebuilding JSON, reviewing health checks, and publishing GitHub Pages updates.
- Add validation rules for duplicate `ReferenceID` values, missing disclaimers, missing schedules, missing icons, inactive rows that still display, and orphaned modifier relationships.
- Decide whether workbook rebuilds may depend on the SheetJS CDN or whether the dependency should be vendored for offline use.

## Milestone 5: Add automated confidence checks

- Add smoke checks that verify `index.html`, CSS, JavaScript, JSON, workbook, and icon assets are present and fetchable.
- Add a browser smoke test that loads the page, waits for the published database, and confirms the expected persona count appears.
- Run validation checks as part of the documented publishing process.
- Keep test output understandable for non-developer maintainers.

## Milestone 6: Polish export and print workflows

- Review the browser print/export layout for page breaks and readability.
- Improve the printed persona summary naming and structure.
- Confirm exported summaries include the most useful persona, modifier, schedule, disclaimer, and health information.

## Suggested implementation order

1. Loading, error, empty, and no-results states.
2. Real icon rendering and missing-icon fallbacks.
3. Health details expansion.
4. Accessibility, keyboard, and mobile improvements.
5. Workbook-to-JSON build and validation scripts.
6. Browser smoke tests and README workflow documentation.
7. Print and export polish.
