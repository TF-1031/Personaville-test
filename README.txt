Personaville v1.0

Folder layout:
- index.html
- database/persona-db.xlsx
- database/persona-db.json
- css/app.css
- js/app.js
- js/database.js
- js/render.js
- icons/
- exports/
- backups/

How to use:
1. Open index.html in Chrome or Edge.
2. The bundled JSON may load automatically.
3. If it does not, click Build Database and select database/persona-db.xlsx.
4. Edit the workbook, save it, then use Build Database again.
5. Use Export Center to print a selected persona.

Notes:
- Workbook upload uses SheetJS from CDN. If internet is unavailable, bundled JSON still lets the app display the current database in most browser/server setups.
- Icons are expected in the icons/ folder. Missing icons are handled gracefully.

Roadmap:
- See ROADMAP.md for the Personaville project roadmap.
