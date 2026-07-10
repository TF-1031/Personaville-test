# Personaville Next Steps

This checklist is based on a review of the published GitHub Pages site at `https://tf-1031.github.io/Personaville-test/` and the current repository implementation.

## High-priority product fixes

1. **Make the initial database-load state explicit.**
   - The published page initially renders the shell with `No database loaded` until the bundled JSON finishes loading or fails.
   - Add a visible loading state and a persistent error panel if `database/persona-db.json` cannot be fetched, instead of only writing the failure to the console.
   - Keep the existing manual `Build Database` and `Load Bundled DB` actions, but explain which one to use in each failure mode.

2. **Render real promo and modifier icons.**
   - Persona tiles currently show a placeholder `1:1` box even though the database includes icon metadata and PNG assets.
   - Map each persona's `PromoIcon` and related modifier/feature icons to the `icons/` folder, with alt text and a graceful missing-image fallback.

3. **Add empty and no-results states.**
   - Dashboard and Persona Library tile containers should show helpful messages when no database is loaded or filters/search return zero matches.
   - Modifier, Health, and Export views should also render explanatory empty states before data is available.

4. **Expose health details, not just counts.**
   - The health view currently summarizes Section, Check, Status, and Count.
   - Add the `Details` field so WARN/BAD rows explain exactly which persona, reference ID, schedule, or disclaimer needs attention.

5. **Improve mobile and accessibility polish.**
   - Add semantic labels for filters and file-upload controls.
   - Ensure keyboard users can select persona tiles via buttons/links rather than click-only article cards.
   - Verify focus states, color contrast, and screen-reader announcements for database load success/failure.

## Data and content follow-up

1. **Create a repeatable workbook-to-JSON build step.**
   - The app can build from an uploaded workbook in the browser, but the repository should also include a script that regenerates `database/persona-db.json` from `database/persona-db.xlsx` so GitHub Pages deployments stay reproducible.

2. **Define data validation rules outside the UI.**
   - Add automated checks for duplicate `ReferenceID` values, missing disclaimers, missing schedules, missing icons, inactive rows that still display, and orphaned modifier relationships.

3. **Document the editing workflow for non-developers.**
   - Expand the README with a step-by-step process for editing the workbook, rebuilding JSON, reviewing health checks, and publishing GitHub Pages updates.

## Engineering follow-up

1. **Add automated smoke tests.**
   - At minimum, verify that `index.html`, CSS, JavaScript, JSON, workbook, and icon assets are present and fetchable.
   - Add a browser smoke test that loads the page, waits for the bundled database, and confirms the expected persona count appears.

2. **Reduce CDN risk.**
   - The workbook upload path depends on SheetJS from jsDelivr.
   - Either vendor the dependency for offline use or document that workbook rebuilds require internet access.

3. **Prepare export improvements.**
   - The print/export flow works through the browser print dialog, but it would benefit from print-specific layout review, page-break handling, and a clearly named downloaded/printed persona summary.

## Suggested implementation order

1. Loading/error/no-results states.
2. Real icon rendering.
3. Health details expansion.
4. Accessibility and keyboard interactions.
5. Workbook-to-JSON build and validation scripts.
6. Browser smoke tests and README workflow updates.
7. Print/export polish.
