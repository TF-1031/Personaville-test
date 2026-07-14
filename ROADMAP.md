# Personaville Roadmap

Personaville v1.0 has been released as the stable, static, workbook-driven baseline. Ongoing planning now focuses on Personaville v1.1 while preserving the v1.0 release history and maintenance principles below.

## Current Priority

**Data Explorer** is the first recommended Personaville v1.1 feature. It should remain read-only and focus on helping users search, filter, group, and compare persona speed records before any future management or editing workflows are implemented.

# Personaville v1.1

## Data Discovery
- [ ] Data Explorer
  Add a read-only page for searching, filtering, grouping, and comparing persona speed records.
- [ ] Table and Grouped Views
  Allow users to switch between a sortable table and grouped result summaries.
- [ ] Advanced Filters
  Add filters for pricing set, family group, speed, symmetrical service, equipment included, modifier, and active status.
- [ ] CSV Export
  Export the currently filtered Data Explorer results with a timestamped filename.
- [ ] Saved Queries
  Allow frequently used filter combinations to be saved and reopened.

## Export Improvements
- [ ] Dedicated Print Document
  Ensure only selected persona pages are included in browser print and PDF output.
- [ ] Improved Export Filenames
  Use persona names when available and date/time fallbacks when names cannot be resolved.
- [ ] Separate PDF Export
  Allow each selected persona to be downloaded as its own PDF.
- [ ] Export Cart Refinements
  Improve ordering, removal, output actions, and selected-set review.

## Future Management
- [ ] Asset Manager
  Manage icons and images from the web interface.
- [ ] Persona and Pricing Editor
  Edit persona, speed, modifier, disclaimer, and pricing data in the browser.
- [ ] Version History
  Track changes and support rollback.
- [ ] Direct Publishing
  Explore authenticated publishing to GitHub or another backend.

## v1.0 released baseline — completed

- Primary navigation finalized: **Personas**, **Export Cart**, **Manage**, and **Admin**.
- Full hero behavior on Personas and compact mini-player behavior on secondary views completed.
- Export Cart selection, selected-count tray, removal, print/PDF, and copy-summary workflows completed.
- Admin subsections completed: Overview, Database Health, Publish Database, Modifiers, and Settings.
- Upload Workbook and Download Updated JSON workflow completed for static publishing.
- Database Health details completed for workbook and browser-generated checks.
- Icon path resolution and missing-icon fallback behavior completed.
- Letter-oriented print/export CSS completed.
- Responsive layout reviewed for the v1 static experience.
- README updated as user guide and developer guide.

## v1.0 maintenance principles

- Keep Personaville static and GitHub Pages friendly.
- Treat the workbook as the editable source of truth and `database/persona-db.json` as the deployable artifact.
- Fix release-blocking health issues before publishing data updates.
- Prefer documentation and validation improvements over new UI scope during v1.0 maintenance.
- Do not remove code unless it is clearly unused and current behavior is covered.

## v2 roadmap history

The following items were originally deferred from v1 to v2. They are preserved here as roadmap history and may be refined by the v1.1 planning sections above:

1. **Future editing workspace**
   - Edit personas, speed options, pricing schedules, modifiers, and disclaimers in the app.
   - Add form validation and save flows.

2. **Asset management**
   - Upload, preview, replace, and audit icons/images from the app.
   - Manage audio and hero assets without manual repository edits.

3. **Direct database editing**
   - Provide safe direct JSON/database editing tools if the project moves beyond workbook-first maintenance.
   - Add stronger migration and rollback controls before enabling direct edits.

4. **Email export**
   - Convert the Export Cart into an email-ready workflow.
   - Add recipient/template controls only after export content is approved.

5. **Version history**
   - Show workbook/JSON version history, publish history, and previous release comparisons.
   - Add restore/rollback guidance after governance requirements are defined.

6. **Automated release tooling**
   - Optional CI checks for browser smoke tests, asset path validation, JSON validation, and workbook-to-JSON regeneration.
   - Optional vendoring strategy for SheetJS if offline rebuilds become required.
