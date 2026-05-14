# ROADMAP — PlotWeaver

Mejoras potenciales ordenadas por categoría. Prioridad: 🔴 alta / 🟡 media / 🟢 baja.

---

## ✅ Aplicados (14/05/2026)

### Bugs
| Ítem | Solución |
|---|---|
| `useNodesState`/`useEdgesState` stale en recarga asíncrona | Sync effect con dirty-check por serialización |
| `EdgeModal` estado no reseteado al reabrir el mismo edge | Key con contador incremental `edgeEditKey` |
| `ChapterPanel` `onBlur` descarta ediciones | Captura de `editingId`/`editChapterId` en locales |
| `INodeData` sin index signature vs `Record<string, unknown>` | Añadido `[key: string]: unknown` |
| `onConnectEnd` incompatible con React Flow v12 | Usar `OnConnectEnd` type de la librería |
| `setContent(false)` incompatible con TipTap v3 | Cambiado a `{ emitUpdate: false }` |

### Rendimiento
| Ítem | Solución |
|---|---|
| `PlotCardNode` memo roto por suscripción al context entero | Context partido en `ProjectDataContext` + `ProjectStatusContext` |
| Métodos del provider sin `useCallback` | Envueltos todos en `useCallback` |
| `ChapterPanel` filtra O(n*m) por capítulo | `useMemo` con `Map<chapterId, nodes[]>` |
| `sanitizeRichTextHtml` parsea DOM en cada render | Cache `Map<string, string>` por contenido |

### Arquitectura
| Ítem | Solución |
|---|---|
| Tipos duplicados cliente/servidor | Tipos en `client/src/context/projectTypes.ts` y `server/src/models/` (shared package eliminado) |
| `as unknown as INode[]` en mappers | Mappers tipados `toProjectNodes`, `toProjectEdges`, `toFlowNodes`, `toFlowEdges` |
| `trashBin` no usado | Eliminado de interfaces, esquema y controlador |
| `ReactFlowProvider` acoplamiento | Documentado en `Workspace.tsx` |

### UX
| Ítem | Solución |
|---|---|
| Atajos de teclado | `Ctrl+S` guardar, `Ctrl+Z` undo, `Ctrl+Shift+Z` redo, `Escape` cerrar modal, `N` nueva tarjeta, `C` nuevo capítulo |
| Undo/redo | History stack (max 50) en `ProjectContext` con `pushUndo()` en cada mutación |
| Botones Undo/Redo en UI | Botones en barra superior del canvas, `canUndo`/`canRedo` para disabled |
| Error Boundary | `ErrorBoundary` class component envolviendo `<Routes>` |
| Escape en modales | `useEffect` con `keydown` listener en todos los modales |
| Dashboard sin prompt/alert | `InputModal` para crear/renombrar, `ConfirmModal` para eliminar |
| Toasts | `ToastContext` + `showToast()` en save, export, AI. Auto-dismiss 3s. |
| Sidebar colapsable | Botón toggle `◀`/`▶`, transición `w-80` ↔ `w-0 overflow-hidden` |
| Zoom indicator | Badge `%` en barra, actualizado via `onMoveEnd` |
| Fondo canvas variable | Ciclo Dots → Lines → Cross con botón en barra |
| Pantalla completa | Botón toggle Fullscreen API en barra del canvas |
| Búsqueda en nodos | Input search en barra, dims no-matching |
| Estadísticas del proyecto | `ProjectStats.tsx` sidebar |

### Backend
| Ítem | Solución |
|---|---|
| CORS, helmet, rate-limit, json limit | `helmet()`, `cors({ origin })`, `express-rate-limit`, `express.json({ limit: '5mb' })` |
| Límite de snapshots | `MAX_SNAPSHOTS_PER_PROJECT = 50` en `createSnapshot` |
| Validación Zod | Schemas en `middleware/schemas.ts`, middleware `validate()` aplicado a todas las rutas |
| `.env` validation al arrancar | Verifica `MONGO_URI` requerido, warns si `JWT_SECRET` es default |
| `db.ts` no usa `process.exit(1)` | Lanza error manejable, caller lo maneja gracefulmente |
| Controladores tipados | Todos usan `Request`/`Response` de Express, auth usa `AuthRequest` |

### Features (Phase 1-3)
| Ítem | Solución |
|---|---|
| Tipo de arista persistente | `IEdge.type` en tipos, EdgeSchema, EdgeModal persiste en `data.type` |
| Duplicar nodo | Botón "Duplicar" en PlotNodeModal, copia data con offset +30px |
| Beats UI (CRUD) | `addBeat`/`updateBeat`/`removeBeat` en context, inline CRUD en ChapterPanel |
| Tags globales | Backend user routes, `TagsModal`, tag selector en PlotNodeModal |
| Restaurar snapshots | `POST /api/snapshots/restore/:snapshotId` + `SnapshotsModal` |
| Imagen de personaje | `updateCharacter` acepta `Partial`, input URL al clickear avatar |
| Vista esquema / Outline | `OutlineView` toggle en canvas |
| Auth JWT | register/login/logout con bcrypt + jsonwebtoken, `authMiddleware`, proyectos por `authorId` |
| Export (HTML, PDF, DOCX, EPUB, Fountain) | `server/src/controllers/export/`, ExportModal con 5 formatos |
| AI Assistant (suggestPlot, generateNames, findPlotHoles, summarize) | `server/src/controllers/ai/`, AIPanel con 4 herramientas, soporte OpenAI/LM Studio/Ollama |

### Testing & DX
| Ítem | Solución |
|---|---|
| Server tests | 120 tests en `server/tests/`: controllers (auth, project, snapshot, user, upload, export, ai), middleware (auth, validate), utilities (stripHtml, compileManuscript, buildProjectContext) |
| Client tests | 37 tests en `client/tests/`: apiFetch, sanitizeHtml, exportMarkdown |
| Scripts typecheck | `"typecheck": "tsc --noEmit"` en server, `"typecheck": "tsc -b --noEmit"` en client |
| Pre-commit hook | `.husky/pre-commit` ejecuta client typecheck → server typecheck → client tests → server tests |
| apiFetch inyectable | `setApiAdapters()` para mocking en tests |

### Type Safety
| Ítem | Solución |
|---|---|
| `project: IProject` en context | Early return pattern elimina cast |
| `globalCharacters: any[]` | `IGlobalCharacter` interface en `User.ts` |
| Seed hardcodeado | `SEED_EMAIL`/`SEED_PASSWORD` de `.env`, genera random `authorId` |
| AI getModel infinite loop | Corregido: `return _model!` en vez de `return getModel()` |
| Upload sin auth token | Cambiado de `fetch()` a `apiFetch()` |

---

## 🛡️ Backend: Validación & Seguridad

| Prioridad | Descripción | Archivos |
|---|---|---|
| 🟢 | ✅ Auth JWT implementado con bcrypt + jsonwebtoken | `authController.ts`, `authMiddleware.ts` |

---

## 🧪 Testing & DX

| Prioridad | Descripción | Archivos |
|---|---|---|
| 🟢 | ✅ **157 tests totales** (37 client + 120 server). Cobertura completa de controllers. | `client/tests/`, `server/tests/` |
| 🟢 | ✅ Server typecheck `"typecheck": "tsc --noEmit"` | `server/package.json` |
| 🟢 | ✅ Client typecheck en build `"tsc -b --noEmit && vite build"` | `client/package.json` |
| 🟢 | ✅ apiFetch inyectable con `setApiAdapters()` | `client/src/lib/api.ts` |
| 🟢 | ✅ `.env` validation al arrancar | `server/src/app.ts` |
| 🟢 | ✅ `db.ts` no usa `process.exit(1)`, lanza error | `server/src/config/db.ts` |
| 🟢 | ✅ Pre-commit hook con typecheck + tests | `.husky/pre-commit` |

---

## 🔧 Type Safety

| Prioridad | Descripción | Archivos |
|---|---|---|
| 🟢 | ✅ `project: IProject` no-nullable sin cast | `ProjectContext.tsx` early return pattern |
| 🟢 | ✅ Controladores tipados con `Request`/`Response` | Todos los controllers |
| 🟢 | ✅ `IGlobalCharacter` interface | `server/src/models/User.ts` |

---

## 📋 Pendientes / Por hacer

| Prioridad | Feature | Descripción | Archivos |
|---|---|---|---|
| 🔴 | **Selección de idioma** | Toggle Español/Inglés (i18n) en toda la app | `client/src/i18n/` (nuevo), componentes UI |
| 🟡 | Timeline / cronología | Vista horizontal con capítulos como bloques, arrastrar para reordenar | `client/src/components/Timeline/` |
| 🟡 | Editor de manuscrito | Editor rich-text por capítulo, contador de palabras, compilar documento | `client/src/components/Manuscript/` |
| 🟡 | Grafo de relaciones | Segundo canvas con personajes como nodos, aristas (familia/romance/enemistad/aliado/mentor) | `client/src/components/CharacterGraph/` |
| 🟢 | Modo offline / PWA | Service worker para trabajo sin conexión | `client/vite.config.ts` |
| 🟢 | CI/CD | GitHub Actions para tests y build | `.github/workflows/` |

---

## Notas

- Tests cubrió: auth, project, snapshot, user, upload, export (5 formatos), ai (4 endpoints), middleware (auth, validate), utilidades (stripHtml, compileManuscript, buildProjectContext).
- Pre-commit hook corre: client typecheck → server typecheck → client tests → server tests.
- after `pnpm build`, run `Remove-Item -Path server/src -Recurse -Filter "*.js" -Force` before testing to avoid stale compiled JS.
