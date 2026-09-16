# Documentación Técnica de PlotWeaver

## 1. Introducción

**PlotWeaver** es una herramienta de planificación narrativa para escritores que funciona como un "lienzo de tramas" digital. Permite gestionar historias complejas mediante nodos interconectados (escenas/tramas), personajes, capítulos, línea de tiempo, editor de manuscrito, grafo de relaciones, exportación multi-formato y asistente IA.

### Tecnologías principales

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + Vite + Tailwind CSS | 19 / 8 / 4 |
| Canvas | @xyflow/react (React Flow) | 12 |
| Editor | @tiptap/react | 3 |
| Backend | Express | 5 |
| ORM | Mongoose | 9 |
| BD | MongoDB | - |
| Lenguaje | TypeScript | 6 |
| Paquetería | pnpm | 10 |

---

## 2. Estructura del Proyecto

```
plotDesigner/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/                # Login, Register, ProtectedRoute
│   │   │   ├── Canvas/              # Canvas principal + vistas alternas
│   │   │   │   ├── CanvasArea.tsx        # Lienzo con React Flow
│   │   │   │   ├── PlotCardNode.tsx      # Nodo personalizado
│   │   │   │   ├── PlotNodeModal.tsx     # Modal edición nodo
│   │   │   │   ├── EdgeModal.tsx         # Modal edición arista
│   │   │   │   ├── OutlineView.tsx       # Vista esquema
│   │   │   │   ├── TimelineView.tsx      # Línea de tiempo
│   │   │   │   ├── ManuscriptEditor.tsx  # Editor de manuscrito
│   │   │   │   ├── CharacterGraphView.tsx # Grafo relaciones
│   │   │   │   ├── CharacterNode.tsx     # Nodo personaje para grafo
│   │   │   │   ├── RelationEditModal.tsx # Modal editar relación
│   │   │   │   ├── AIPanel.tsx           # Asistente IA (4 funciones)
│   │   │   │   ├── InkStudioView.tsx     # Editor Ink + preview jugable
│   │   │   │   ├── inkCodeMirror.ts      # Sintaxis Ink para CodeMirror 6
│   │   │   │   └── ExportModal.tsx       # Exportación (6 formatos)
│   │   │   ├── Dashboard/            # Lista de proyectos
│   │   │   ├── Sidebar/              # Paneles laterales
│   │   │   │   ├── CharacterPanel.tsx    # CRUD personajes + campos expandidos
│   │   │   │   ├── ChapterPanel.tsx      # CRUD capítulos + beats
│   │   │   │   ├── SidebarArea.tsx       # Sidebar colapsable
│   │   │   │   └── ProjectStats.tsx      # Estadísticas del proyecto
│   │   │   └── ui/                   # Componentes reutilizables
│   │   │       ├── RichTextEditor.tsx
│   │   │       ├── ConfirmModal.tsx
│   │   │       ├── InputModal.tsx
│   │   │       ├── ShortcutsModal.tsx
│   │   │       ├── TagsModal.tsx
│   │   │       ├── SnapshotsModal.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       ├── ProjectStats.tsx
│   │   │       ├── exportMarkdown.ts
│   │   │       └── exportMarkdown.test.ts
│   │   ├── context/                  # Estado global
│   │   │   ├── AuthContext.tsx           # Auth (login/register/logout)
│   │   │   ├── UserContext.tsx           # Datos de usuario
│   │   │   ├── ProjectContext.tsx        # Estado del proyecto + CRUD
│   │   │   ├── useProject.ts            # Hook + types del context
│   │   │   ├── projectTypes.ts          # Interfaces compartidas
│   │   │   └── ToastContext.tsx          # Notificaciones toast
│   │   ├── lib/
│   │   │   ├── api.ts               # Cliente HTTP con auth + 401 redirect
│   │   │   ├── api.test.ts          # Tests de apiFetch (7 tests)
│   │   │   ├── upload.ts            # Subida de imágenes
│   │   │   ├── sanitizeHtml.ts
│   │   │   ├── sanitizeHtml.test.ts # Tests sanitizeRichTextHtml (13 tests)
│   │   │   ├── ink.ts               # Lógica Ink: ensamblado, compilación, plantillas
│   │   │   └── ../tests/ink.test.ts # Tests de lib/ink (14 tests)
│   │   ├── components/ui/exportMarkdown.ts
│   │   └── components/ui/exportMarkdown.test.ts # Tests htmlToMarkdown + generateProjectMarkdown (17 tests)
│   │   ├── App.tsx                  # Router principal + providers
│   │   ├── Workspace.tsx            # Layout del workspace
│   │   └── main.tsx                 # Entry point
│   ├── vite.config.ts
│   └── package.json
│
├── server/                          # Backend Express
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts                    # Conexión MongoDB
│   │   │   └── seed.ts                  # Usuario por defecto
│   │   ├── middleware/
│   │   │   └── auth.ts                  # JWT verify + generateToken
│   │   ├── controllers/
│   │   │   ├── authController.ts        # register, login, me
│   │   │   ├── projectController.ts     # CRUD proyectos
│   │   │   ├── snapshotController.ts    # Snapshots (append-only)
│   │   │   ├── userController.ts        # Perfil + library/tags
│   │   │   ├── uploadController.ts      # Subida de archivos
│   │   │   ├── exportController.ts      # Export PDF/DOCX/EPUB/HTML/Fountain
│   │   │   ├── export/htmlPlayable.ts   # Export HTML jugable (Ink + inkjs)
│   │   │   └── aiController.ts          # IA (sugerencias, nombres, huecos, resumen)
│   │   ├── models/
│   │   │   ├── Project.ts               # Schema proyecto
│   │   │   ├── Snapshot.ts              # Schema snapshot
│   │   │   └── User.ts                  # Schema usuario
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── projectRoutes.ts
│   │   │   ├── snapshotRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   ├── uploadRoutes.ts
│   │   │   ├── exportRoutes.ts
│   │   │   └── aiRoutes.ts
│   │   ├── types/
│   │   │   └── epub-gen.d.ts            # Type declaration
│   │   └── app.ts                       # Entry point + montaje rutas
│   ├── .env                             # Config (MONGO_URI, JWT_SECRET, AI)
│   └── package.json

```

---

## 3. Modelos de Datos

### 3.1 Interfaces del Proyecto

```typescript
interface ICharacter {
  id: string;
  name: string;
  image?: { url: string; width: number; height: number };
  biography?: string;
  appearance?: string;
  psychology?: string;
  backstory?: string;
}

interface ICharacterRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'familia' | 'romance' | 'enemistad' | 'aliado' | 'mentor';
  label?: string;
  description?: string;
}

interface INodeData {
  title?: string;
  content?: string;
  color?: string;
  categoryTags?: string[];
  characterTags?: string[];
  chapterId?: string;
  [key: string]: unknown;
}

interface INode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: INodeData;
}

interface IEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  type?: 'normal' | 'causa' | 'conflicto';
}

interface IBeat {
  id: string;
  description: string;
  linkedNodes: string[];
}

interface IChapter {
  chapterId: string;
  beats: IBeat[];
  manuscriptContent?: string;
}

interface IProjectData {
  metadata: {
    projectId: string;
    title: string;
    createdAt: string;
    lastModified: string;
  };
  characters: ICharacter[];
  characterRelations: ICharacterRelation[];
  canvas: {
    viewport: { x: number; y: number; zoom: number };
    nodes: INode[];
    edges: IEdge[];
  };
  chapterManager: {
    chapters: IChapter[];
  };
}
```

### 3.2 Modelo Mongoose (`server/src/models/Project.ts`)

- `metadata`: subdocumento embebido (`projectId`, `title`, `createdAt`, `lastModified`)
- `authorId`: `ObjectId` ref → `User`
- `characters`: array embebido de `ICharacter`
- `characterRelations`: array embebido de `ICharacterRelation`
- `canvas.viewport`, `canvas.nodes`, `canvas.edges`: arrays embebidos
- `chapterManager.chapters`: array embebido de `IChapter` (con `manuscriptContent` y `beats`)

### 3.3 Modelo Snapshot (`server/src/models/Snapshot.ts`)

```typescript
interface ISnapshot {
  projectId: ObjectId;
  description: string;
  projectData: IProjectData;  // Clon inmutable del proyecto
  createdAt: Date;
}
```

---

## 4. API Endpoints

### 4.1 Auth (`/api/auth`)

| Método | Endpoint | Body | Respuesta |
|--------|----------|------|-----------|
| POST | `/api/auth/register` | `{ email, password, name }` | `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/api/auth/me` | - (auth header) | `{ user }` |

### 4.2 Proyectos (`/api/projects`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/projects` | Lista proyectos del usuario autenticado |
| POST | `/api/projects` | Crear proyecto (`{ title }`) |
| GET | `/api/projects/:projectId` | Obtener proyecto completo |
| PUT | `/api/projects/:projectId` | Actualizar proyecto (merge parcial) |
| DELETE | `/api/projects/:projectId` | Eliminar proyecto |

### 4.3 Snapshots (`/api/snapshots`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/snapshots/:projectId` | Listar snapshots |
| POST | `/api/snapshots/:projectId` | Crear snapshot (`{ description }`) |

### 4.4 Usuario (`/api/user`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/user/me` | Perfil + library |
| PUT | `/api/user/me/library/tags` | Actualizar globalTags |

### 4.5 Upload (`/api/upload`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/upload` | Subir imagen (multer) |

### 4.6 Export (`/api/export`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/export/:projectId/html` | HTML autocontenido |
| GET | `/api/export/:projectId/pdf` | PDF (pdfkit) |
| GET | `/api/export/:projectId/docx` | DOCX (docx lib) |
| GET | `/api/export/:projectId/epub` | EPUB (epub-gen) |
| GET | `/api/export/:projectId/fountain` | Fountain (texto) |
| GET | `/api/export/:projectId/html-playable` | HTML jugable (Ink Studio autocontenido) |

### 4.7 AI (`/api/ai`)

| Método | Endpoint | Body | Descripción |
|--------|----------|------|-------------|
| POST | `/api/ai/:projectId/suggest-plot` | `{ focus? }` | 3 giros argumentales |
| POST | `/api/ai/:projectId/generate-names` | `{ count?, style? }` | Nombres de personajes |
| POST | `/api/ai/:projectId/plot-holes` | - | Huecos argumentales |
| POST | `/api/ai/:projectId/summarize` | `{ chapterId? }` | Resumen (capítulo o proyecto) |

### 4.8 Health

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

> Todos los endpoints excepto `/api/auth/*` y `/api/health` requieren header `Authorization: Bearer <token>`.

---

## 5. Autenticación y Seguridad

### JWT Flow
1. `POST /api/auth/login` o `/register` devuelve `{ token, user }`
2. El frontend almacena el token en `localStorage('plotweaver_token')`
3. Cada request incluye `Authorization: Bearer <token>`
4. `authMiddleware` verifica el token y adjunta `{ userId, authorId, email }` a `req.user`
5. En 401, el frontend limpia el token y redirige a `/login`

### Seed por defecto
- Email: `admin@plotweaver.com` / Password: `admin123` (configurable via `SEED_EMAIL`/`SEED_PASSWORD` en `.env`)
- Se crea automáticamente al iniciar el servidor si no existe un usuario con ese email

### Configuración `.env`
```
MONGO_URI=mongodb://localhost:27017/plotweaver
JWT_SECRET=plotweaver-dev-secret-key-change-in-production
PORT=5000
SEED_EMAIL=admin@plotweaver.com
SEED_PASSWORD=admin123

# AI - Nube (OpenAI)
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini

# AI - Local (LM Studio)
OPENAI_BASE_URL=http://localhost:1234/v1
OPENAI_MODEL=nombre-del-modelo
```

---

## 6. Vistas del Canvas

El workspace tiene 6 vistas alternas, mutuamente excluyentes, activables desde la toolbar:

| Botón | Vista | Componente | Descripción |
|-------|-------|-----------|-------------|
| ≡ | Outline | `OutlineView.tsx` | Árbol capítulos → escenas |
| 🕐 | Timeline | `TimelineView.tsx` | Línea temporal horizontal con drag reorder |
| 📄 | Manuscrito | `ManuscriptEditor.tsx` | Editor TipTap por capítulo + export TXT/HTML |
| 👥 | Grafo personajes | `CharacterGraphView.tsx` | React Flow con relaciones entre personajes |
| ✨ | Asistente IA | `AIPanel.tsx` | 4 herramientas de IA conversacional |
| 🖋 | Ink Studio | `InkStudioView.tsx` | Editor Ink (narrativa ramificada) + preview jugable |

---

## 6.5 Ink Studio (narrativa interactiva)

Editor de scripts [Ink](https://www.inklestudios.com/ink/) (lenguaje de Inkle para narrativa ramificada) integrado en el canvas:

- **Contenido por nodo**: cada nodo del canvas puede tener su propio script en `data.inkContent`.
- **Modo historia completa**: ensambla automáticamente todos los nodos con script en un solo relato (`assembleInkStory`, orden por capítulos y posición), generando un knot por nodo.
- **Modo nodo**: compila y reproduce solo el script del nodo seleccionado.
- **Editor CodeMirror 6**: resaltado de sintaxis Ink (`client/src/components/Canvas/inkCodeMirror.ts`), guardado con debounce de 900ms (mismo flujo de autosave/undo que el resto del proyecto).
- **Reproductor editorial**: preview jugable con inkjs (choices, diverts, tags); texto serif, historial de elecciones, botones Reiniciar/Atrás (replay de la ruta), inspector de variables `{ }` y atajos `Ctrl+Enter` / `Esc` / teclas `1-9`.
- **Diagnósticos**: errores de compilación con salto directo al nodo responsable (mapeo línea → nodo vía `fragmentForLine`).
- **Accesos**: botón "Ink" en la toolbar del canvas, en el modal de nodo y badge "Ink" en tarjetas con script.

Lógica pura reutilizable en `client/src/lib/ink.ts`; compilación vía `Compiler` de `inkjs/full`.

> 📖 Guía de uso completa (sintaxis Ink, ensamblado, exportación): [`docs/ink-studio.md`](docs/ink-studio.md)

---

## 7. Contextos y Estado Global

### AuthContext
- `user`, `token`, `isAuthenticated`, `isLoading`
- `login(email, password)`, `register(email, password, name)`, `logout()`

### ProjectContext
- `project` (non-nullable via early return pattern — ver línea 450 de `ProjectContext.tsx`)
- `isSaving`, `hasUnsavedChanges`, `canUndo`, `canRedo`
- `saveProject()`, `undo()`, `redo()`, `addChapter()`, `addCharacter()`
- CRUD nodos: `addNode`, `updateNodes`, `deleteNodes`
- CRUD aristas: `updateEdges`
- CRUD personajes: `updateCharacters`
- CRUD relaciones: `addRelation`, `updateRelation`, `removeRelation`
- Capítulos: `updateChapters`, `reorderChapters`, `updateChapterManuscript`
- Auto-save: 5 segundos después del último cambio
- Undo/Redo: stack de hasta 50 estados

### UserContext
- Datos del usuario (usa `AuthContext` internamente)
- Tags globales

---

## 8. AI Writing Assistant

### Configuración
- **Lazy init**: el cliente OpenAI se crea en el primer uso, no al importar
- Soporta OpenAI nube (`OPENAI_API_KEY`) y local (`OPENAI_BASE_URL`)
- Sin API key requerida si se usa baseURL local (LM Studio, Ollama)
- Modelo configurable via `OPENAI_MODEL` (default: `gpt-4o-mini`)

### Endpoints (todos POST)
1. **suggest-plot**: Contexto completo del proyecto → 3 giros argumentales
2. **generate-names**: Lista numerada de nombres (filtrables por estilo)
3. **plot-holes**: Análisis de inconsistencias narrativas
4. **summarize**: Resumen de capítulo individual o proyecto completo

### Prompt engineering
- Cada función usa `system prompt` especializado
- El contexto del proyecto se construye con `buildProjectContext()`: incluye título, personajes, escenas (nodos), capítulos y manuscripto

---

## 9. Exportación

### Formatos
| Formato | Librería | Contenido |
|---------|----------|-----------|
| HTML | Generación directa | Documento autocontenido con CSS oscura, índice navegable |
| PDF | pdfkit | A4, portada, capítulos con tipografía profesional |
| DOCX | docx | Word con títulos, párrafos justificados |
| EPUB | epub-gen | Libro electrónico con índice, capítulos en XHTML |
| Fountain | Texto plano | Formato de guion cinematográfico |
| HTML Jugable | inkjs (UMD inline) | Historia interactiva Ink autocontenida: motor + story JSON + player vanilla; 422 si el script tiene errores |

### Flujo
1. Backend busca el proyecto por `projectId` + `authorId`
2. Compila `chapterManager.chapters[].manuscriptContent` (html)
3. Para PDF/DOCX: extrae texto plano (strip HTML)
4. Para EPUB: preserva HTML
5. Para HTML Jugable: ensambla los scripts Ink de los nodos (`assembleProjectInk`), compila con `Compiler` de `inkjs/full` y embebe story JSON + engine UMD en un solo HTML
6. Stream o buffer → response con headers `Content-Disposition: attachment`

---

## 10. Testing

### Stack
- **vitest** + **jsdom** (browser API mock)
- Configuración en `client/vite.config.ts` (bloque `test`)
- Test files junto al módulo que prueban: `*.test.ts`

### Cobertura actual
| Archivo | Tests | Objeto |
|---------|-------|--------|
| `sanitizeHtml.test.ts` | 13 | `sanitizeRichTextHtml()` — tags permitidos/prohibidos, escaping, caché |
| `exportMarkdown.test.ts` | 17 | `htmlToMarkdown()` + `generateProjectMarkdown()` — conversión HTML→MD, agrupación capítulos |
| `api.test.ts` | 7 | `apiFetch()` — headers, token, 401 redirect, custom init |
| `tests/ink.test.ts` | 14 | `lib/ink.ts` — ensamblado de historia, compilación, mapeo errores→nodo, plantillas |

### Cómo correrlos
```bash
cd client && pnpm test        # una vez
cd client && pnpm test:watch  # modo watch
```

### apiFetch inyectable
`api.ts` exporta `setApiAdapters(overrides)` y `resetApiAdapters()` para mockear `fetch`, `getToken`, `setToken` y `redirect` en tests. Ver `api.test.ts`.

---

## 11. Import Quirks y TypeScript

### Server (`"moduleResolution": "NodeNext"`)
- Todos los imports relativos requieren extensión `.js`: `from './config/db.js'`
- Módulos CommonJS sin tipos requieren `.d.ts` declarations

### Client (`"verbatimModuleSyntax": true`)
- Usar `import type` para imports solo de tipos
- `import { valor }` para valores runtime
- `"moduleResolution": "bundler"`

---

## 12. Convenciones de Código

### Estilo
- Sin comentarios en el código (salvo componentes públicos)
- Nombres de archivos en PascalCase para componentes, camelCase para utilidades
- Props tipadas con interfaces locales en cada componente

### Estado
- Estado local con `useState`/`useReducer` para UI
- Estado global via Context API (`ProjectContext`, `AuthContext`)
- `useCallback` + `useMemo` para optimización
- `useRef` para timers y valores sincrónicos

### API
- Cliente usa `apiFetch()` que añade `Authorization` header automáticamente
- Respuestas envueltas en `{ status: 'success'|'error', data, message, detail }`
- Códigos: 200 (ok), 201 (creado), 400 (bad request), 401 (no auth), 404 (not found), 500 (error)

---

## 13. PWA / Offline

### Stack
- **`vite-plugin-pwa` v1.3.0** — genera service worker + manifest en build
- Basado en **Workbox** (Google) con estrategia `generateSW`
- Sin dependencias adicionales de runtime

### Configuración (`client/vite.config.ts`)

```typescript
VitePWA({
  registerType: 'autoUpdate',       // actualiza SW sin preguntar
  includeAssets: ['favicon.svg', 'icons.svg', 'pwa-192.svg', 'pwa-512.svg'],
  manifest: { ... },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
    runtimeCaching: [
      {
        urlPattern: /^https?:\/\/.*\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxEntries: 100, maxAgeSeconds: 604800 },  // 7 días
          networkTimeoutSeconds: 5,
        },
      },
    ],
  },
})
```

### Archivos generados en build (`dist/`)

| Archivo | Propósito |
|---------|-----------|
| `sw.js` | Service worker (precache + runtime caching) |
| `workbox-e4022e15.js` | Librería Workbox incluida |
| `manifest.webmanifest` | Manifest PWA (nombre, iconos, display) |
| `registerSW.js` | Script de registro del SW (auto-inyectado) |

### Manifest

- `name`: PlotWeaver
- `short_name`: PlotWeaver
- `display`: standalone (sin barra de navegación del navegador)
- `theme_color`: `#0f172a` (slate-900, acorde al fondo de la app)
- `background_color`: `#0f172a` (pantalla de splash al abrir)
- Iconos SVG: 192×192 y 512×512 (el último también con propósito `maskable`)
- `orientation`: portrait-primary

### Service Worker — Estrategia de Caché

| Recurso | Estrategia | Detalle |
|---------|-----------|---------|
| JS, CSS, HTML, SVG, PNG, ICO, JSON | **Precache** (instalación) | Se descargan al registrar el SW, servidos desde `CacheStorage` |
| Llamadas API (`/api/*`) | **NetworkFirst** | Intenta red primero; si falla o timeout (5s), sirve desde caché. Válido por 7 días, máx 100 entradas |

### Meta Tags en `index.html`

```html
<meta name="theme-color" content="#0f172a" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/pwa-192.svg" />
<link rel="mask-icon" href="/pwa-512.svg" color="#863bff" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### Iconos

- `public/pwa-192.svg` — SVG 192×192 basado en `favicon.svg` (logotipo PlotWeaver)
- `public/pwa-512.svg` — SVG 512×512, mismo diseño escalado
- `public/favicon.svg` — favicon del sitio (existente)

### Flujo de instalación (usuario)

1. El usuario visita la app en Chrome/Edge/Safari
2. El `registerSW.js` solicita registrar el service worker
3. Se precachean los assets estáticos
4. Aparece el prompt "Add to Home Screen" (o el usuario lo hace manualmente)
5. Al abrir desde el homescreen, la app se inicia en modo `standalone`

### Actualizaciones

- `registerType: 'autoUpdate'` — cuando se detecta un nuevo SW, se instala automáticamente y se recarga la página
- No hay prompt de "actualización disponible" — la app siempre corre la última versión

---

## 14. Referencias

- [React Flow docs](https://reactflow.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [TipTap Editor](https://tiptap.dev/)
- [pdfkit](https://pdfkit.org/)
- [docx](https://docx.js.org/)
- [epub-gen](https://www.npmjs.com/package/epub-gen)
- [OpenAI SDK](https://www.npmjs.com/package/openai)
