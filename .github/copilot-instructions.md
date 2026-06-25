# Project-wide Coding Conventions

This repository is a MERN stack application (MongoDB, Express, React, Node.js). The team agreed conventions below must be followed exactly.

- Backend module system: use ES modules (`import` / `export`) and set `"type": "module"` in `package.json`.
- Folder responsibilities:
  - `routes/` only define HTTP endpoints and delegate to `controllers/`.
  - All business logic must live in `controllers/` or in a `services/` folder under `backend/services/` (create this folder if it doesn't exist).
  - `models/` only contains Mongoose schema definitions.
- Asynchronous code: always use `async`/`await`. Do not use `.then()` chains anywhere in the backend codebase.
- Controller error handling: every async controller function must be wrapped in `try { ... } catch (err) { next(err) }` and must call `next(err)` on failure. Rely on the centralized error-handling middleware to translate errors to HTTP responses.
- Logging: use the existing `backend/utils/logger.js` for all logging (do not use `console.log`). Import and call the exported logger helpers instead of `console`.
- Environment variables: always read `backend/.env.example` before assuming new environment variables are required. Reuse or extend the documented variables there.
- Data model & architecture: read `docs/design.md` and `docs/project.md` first and follow the architecture, schema, and recommendation approach described there exactly — do not invent a different schema, index strategy, or recommendation algorithm.

Notes and small guidelines:
- Keep `routes` thin; they should perform validation/sanitization (if any) and forward to controllers.
- Prefer small, testable functions inside `services/` for business logic that may be reused or unit-tested independently of Express.
- Define indexes in `models/` per the design documents (e.g., unique email index, compound indexes for events and registrations).
- When updating package.json to enable ES modules, check for any existing CommonJS usage and migrate files in small commits.

File to save: `.github/copilot-instructions.md` (project root)
