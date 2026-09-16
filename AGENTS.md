# AGENTS.md — PlotWeaver

## ⚠️ Reglas críticas

- **NUNCA** instalar dependencias ni modificar `package.json` / `pnpm-lock.yaml` sin preguntar primero y obtener aprobación explícita del usuario.
- **NUNCA** hacer commit ni push sin autorización explícita del usuario. Solo el usuario puede pedir un commit.

## Stack

- Two independent packages: `client/` (React 19 + Vite 8 + Tailwind 4) and `server/` (Express 5 + Mongoose 9).
- Each has its own `package.json`, `node_modules`, and TypeScript config.
- Package manager: **pnpm** (v10).
- TypeScript 6 on both sides.

## Dev commands

| Package | Command | What it does |
|---|---|---|---|
| Server | `cd server && pnpm install` | Install dependencies |
| Server | `cd server && pnpm dev` | Dev mode (watch, `tsx watch src/app.ts`) |
| Server | `cd server && pnpm build` | Compile with `tsc` |
| Server | `cd server && pnpm typecheck` | TypeScript check (`tsc --noEmit`) |
| Server | `cd server && pnpm start` | Run compiled `node dist/app.js` |
| Server | `cd server && pnpm test` | Run tests (vitest, 134 tests) |
| Server | `cd server && pnpm test:watch` | Tests in watch mode |
| Client | `cd client && pnpm install` | Install dependencies |
| Client | `cd client && pnpm dev` | Dev mode (HMR, `vite`) |
| Client | `cd client && pnpm build` | Build (`tsc -b --noEmit && vite build`) |
| Client | `cd client && pnpm typecheck` | TypeScript check (`tsc -b --noEmit`) |
| Client | `cd client && pnpm lint` | ESLint |
| Client | `cd client && pnpm test` | Run tests (vitest, 51 tests) |
| Client | `cd client && pnpm test:watch` | Tests in watch mode |
| Both | `Arrancar_PlotWeaver.bat` | Starts both in two terminal windows |

Pre-commit hook (via husky): runs client typecheck → server typecheck → client tests → server tests.

## Prerequisites

- **MongoDB** running (default: `mongodb://localhost:27017/plotweaver`).
- Server needs `.env` in `server/` with `MONGO_URI` (and optionally `PORT`).
- Client reads `VITE_API_URL` from env (default `http://localhost:5000`).

## Architecture

- **Server entrypoint**: `server/src/app.ts` — mounts routes at `/api/projects`, `/api/snapshots`, `/api/health`.
- **Client entrypoint**: `client/src/main.tsx` — mounts `<App>` inside `<BrowserRouter>`.
- **Routes**: `/` → Dashboard, `/project/:projectId` → Workspace.
- **State**: `ProjectContext` (Context API) in `client/src/context/ProjectContext.tsx`. Auto-saves after 5s of inactivity.
- **Shared types**: each side defines its own interfaces independently (`client/src/context/projectTypes.ts` and `server/src/models/Project.ts`). No shared package.

## Import quirks

- **Server** (`"moduleResolution": "NodeNext"`): all relative imports must include `.js` extension, e.g. `from './config/db.js'`.
- **Client** (`"verbatimModuleSyntax": true` + `"moduleResolution": "bundler"`): use `import type` for type-only imports.

## Canvas

Uses `@xyflow/react` (React Flow v12). Custom nodes in `client/src/components/Canvas/PlotCardNode.tsx`, custom edge editing in `EdgeModal.tsx`.

## Snapshots

Immutable append-only version system. `POST /api/snapshots/:projectId` creates a snapshot; never overwritten.

## Export (Phase 3.5)

- **Server**: `server/src/controllers/export/` — PDF (pdfkit), DOCX (docx), EPUB (epub-gen), HTML, Fountain, HTML jugable (`htmlPlayable.ts`, inkjs).
- **Routes**: `GET /api/export/:projectId/{html|pdf|docx|epub|fountain|html-playable}` (authMiddleware).
- **Frontend**: `client/src/components/Canvas/ExportModal.tsx` — modal con 6 formatos, descarga directa.
- **Client data flow**: `apiUrl()` de `client/src/lib/api.ts` → `http://localhost:5000`.

## Ink Studio (narrativa interactiva)

- Cada nodo del canvas puede tener un script Ink en `data.inkContent` (tipos en `projectTypes.ts`, schema en `server/src/models/Project.ts`).
- **Vista**: `client/src/components/Canvas/InkStudioView.tsx` (lazy import desde `CanvasArea.tsx`) — editor CodeMirror 6 + reproductor inkjs + diagnósticos con salto a nodo.
- **Reproductor editorial**: texto serif + separador ⁂, historial de elecciones, **Atrás** replayea la ruta elegida (`playFromStart` determinista vía `chosenPath`), inspector de variables (`extractVarNames` + `variablesState`), fade-in de párrafos (`.ink-fade-in` en `index.css`), atajos `Ctrl+Enter`/`Esc`/`1-9`.
- **Lógica pura**: `client/src/lib/ink.ts` — `assembleInkStory` (knot por nodo, orden capítulos→posición), `compileInk` (wrapper de `Compiler` de `'inkjs/full'`; el entry `'inkjs'` solo exporta el motor), `fragmentForLine` (mapea línea de error → nodo), `inkTemplateForNode`.
- **Sintaxis CodeMirror**: `client/src/components/Canvas/inkCodeMirror.ts` (StreamLanguage + tema oscuro).
- **Guardado**: debounce 900ms vía `updateNodes` (mismo flujo autosave/undo que el manuscrito); flush al desmontar o cambiar de nodo.
- **Export HTML jugable**: `server/src/controllers/export/htmlPlayable.ts` compila el proyecto completo y embebe story JSON + engine UMD (`require.resolve('inkjs')` → `dist/ink.js`, se auto-registra como `window.inkjs`) en un HTML autocontenido; devuelve 422 si hay errores de compilación (el compilador lanza excepción pero deja `compiler.errors` poblado).

## AI Assistant (Phase 3.6)

- **Server**: `server/src/controllers/ai/` — 4 endpoints:
  - `suggestPlot` — 3 giros argumentales
  - `generateNames` — nombres con estilo
  - `findPlotHoles` — inconsistencias narrativas
  - `summarize` — resumen de capítulo o proyecto
- **Routes**: `POST /api/ai/:projectId/{suggest-plot|generate-names|plot-holes|summarize}` (authMiddleware).
- **Client data flow**: `apiUrl()` de `client/src/lib/api.ts` → `http://localhost:5000`.
- **AI config** (`.env` del servidor):
  - `OPENAI_API_KEY` — para OpenAI nube
  - `OPENAI_BASE_URL` — para local (LM Studio `:1234/v1`, Ollama `:11434/v1`)
  - `OPENAI_MODEL` — nombre del modelo
- **Frontend**: `client/src/components/Canvas/AIPanel.tsx` — panel con 4 secciones, toggle ✨ en toolbar.

## Testing

- **Server tests** (`server/tests/`): 12 files, 134 tests. Covers all controllers (auth, project, snapshot, user, upload, export, AI) plus middleware (auth, validate) and utility functions (stripHtml, compileManuscript, buildProjectContext). Mongoose models, bcrypt, jsonwebtoken, OpenAI, pdfkit, docx, epub-gen are mocked.
- **Client tests** (`client/tests/`): 4 files, 51 tests. Covers apiFetch, sanitizeHtml, exportMarkdown, lib/ink.
- **Stale compiled .js files**: `tsc` outputs `.js` files alongside `.ts` files. When running tests, vitest may load stale `.js` instead of current `.ts`. Run `Remove-Item -Path server/src -Recurse -Filter "*.js" -Force` before testing after a `pnpm build`.

## AI Config Notes

- El modelo se lee con lazy init (`getOpenAI()`) para evitar el problema ESM de que `dotenv.config()` corre después de las importaciones.
- `initAI()` unifica la inicialización; `getModel()` y `getOpenAI()` la usan sin non-null assertions.
- Si `OPENAI_BASE_URL` está configurado, no exige API key (usa placeholder `'no-key-required'`).
- Si no hay ni `BASE_URL` ni `API_KEY`, lanza error descriptivo.

## References

- Technical docs: `TECHNICAL.md`
- SDD / agent instructions (Spanish): `docs/context.md`
- API spec & data models: `docs/data.json`
- Ink Studio usage guide (Spanish): `docs/ink-studio.md`
- UI design system plan (Spanish): `docs/plan-ui-design-system.md`
